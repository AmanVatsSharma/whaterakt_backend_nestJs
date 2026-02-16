/**
* File: src/inbox/conversation.service.ts
* Module: inbox
* Purpose: Conversation command/query service for inbox workflows.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses TypeORM repositories for conversation, note, and tag links.
* - Keeps list payload lightweight for dashboard consumption.
*/
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ConversationNoteOrmEntity,
  ConversationOrmEntity,
  ConversationStatus,
  ConversationTagOrmEntity,
  MessageDirection,
  MessageOrmEntity,
  MessageStatus,
  TagOrmEntity,
} from '../database/entities';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ConversationService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async listConversations(tenantId: string) {
    const conversations = await this.dataSource.getRepository(ConversationOrmEntity).find({
      where: { tenantId },
      order: { updatedAt: 'DESC' },
      take: 200,
      relations: { tags: { tag: true } },
    });

    return conversations.map((item) => ({
      id: item.id,
      contactId: item.contactId,
      status: item.status,
      assignedUserId: item.assignedUserId,
      lastMessage: item.lastMessage ? `Last activity at ${item.lastMessage.toISOString()}` : null,
      lastMessageAt: item.lastMessage ? item.lastMessage.toISOString() : null,
      tags: item.tags?.map((tagRef) => tagRef.tag.name) ?? [],
    }));
  }

  async assign(tenantId: string, conversationId: string, userId: string) {
    await this.ensureConversation(tenantId, conversationId);
    await this.dataSource.getRepository(ConversationOrmEntity).update(
      { id: conversationId, tenantId },
      { assignedUserId: userId },
    );
  }

  async setStatus(tenantId: string, conversationId: string, status: ConversationStatus) {
    await this.ensureConversation(tenantId, conversationId);
    await this.dataSource.getRepository(ConversationOrmEntity).update(
      { id: conversationId, tenantId },
      { status },
    );
  }

  async addNote(tenantId: string, conversationId: string, userId: string, content: string) {
    await this.ensureConversation(tenantId, conversationId);
    const repository = this.dataSource.getRepository(ConversationNoteOrmEntity);
    return repository.save(
      repository.create({
        conversationId,
        userId,
        content,
      }),
    );
  }

  async tag(tenantId: string, conversationId: string, tagName: string) {
    await this.ensureConversation(tenantId, conversationId);
    const tagRepository = this.dataSource.getRepository(TagOrmEntity);
    const conversationTagRepository = this.dataSource.getRepository(ConversationTagOrmEntity);

    let tag = await tagRepository.findOne({ where: { tenantId, name: tagName } });
    if (!tag) {
      tag = await tagRepository.save(tagRepository.create({ tenantId, name: tagName }));
    }

    const existing = await conversationTagRepository.findOne({
      where: { conversationId, tagId: tag.id },
    });
    if (existing) {
      return existing;
    }

    return conversationTagRepository.save(
      conversationTagRepository.create({
        conversationId,
        tagId: tag.id,
      }),
    );
  }

  async sendMessage(tenantId: string, conversationId: string, text: string) {
    if (!text.trim()) {
      throw new BadRequestException('message text is required');
    }
    const conversation = await this.ensureConversation(tenantId, conversationId, true);
    const to = conversation.contact?.phone;
    if (!to) {
      throw new BadRequestException('Conversation contact phone is unavailable');
    }
    const sendResult = await this.whatsappService.sendMessage(
      {
        to,
        type: 'text',
        message: text.trim(),
      },
      tenantId,
    );
    if (sendResult?.success === false) {
      throw new BadRequestException(
        sendResult?.reason
          ? `Outbound message blocked: ${sendResult.reason}`
          : 'Outbound message failed',
      );
    }

    const messageRepository = this.dataSource.getRepository(MessageOrmEntity);
    await messageRepository.save(
      messageRepository.create({
        content: text.trim(),
        status: sendResult?.queued ? MessageStatus.DRAFT : MessageStatus.SENT,
        direction: MessageDirection.OUTBOUND,
        to,
        tenantId,
        conversationId,
      }),
    );
    await this.dataSource.getRepository(ConversationOrmEntity).update(
      { id: conversationId, tenantId },
      { lastMessage: new Date() },
    );
    return { ok: true, queued: Boolean(sendResult?.queued) };
  }

  async getConversationThread(tenantId: string, conversationId: string) {
    const conversation = await this.dataSource.getRepository(ConversationOrmEntity).findOne({
      where: { id: conversationId, tenantId },
      relations: {
        contact: true,
        tags: { tag: true },
        notes: true,
        messages: true,
      },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found for tenant');
    }

    const sortedMessages = [...(conversation.messages || [])].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const sortedNotes = [...(conversation.notes || [])].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return {
      id: conversation.id,
      contactId: conversation.contactId,
      contactPhone: conversation.contact?.phone || null,
      status: conversation.status,
      assignedUserId: conversation.assignedUserId || null,
      tags: conversation.tags?.map((tagRef) => tagRef.tag.name) || [],
      messages: sortedMessages.map((message) => ({
        id: message.id,
        content: message.content,
        direction: message.direction,
        status: message.status,
        createdAt: message.createdAt.toISOString(),
        from: message.from || null,
        to: message.to || null,
      })),
      notes: sortedNotes.map((note) => ({
        id: note.id,
        content: note.content,
        userId: note.userId,
        createdAt: note.createdAt.toISOString(),
      })),
    };
  }

  private async ensureConversation(
    tenantId: string,
    conversationId: string,
    withContact = false,
  ) {
    const conversation = await this.dataSource.getRepository(ConversationOrmEntity).findOne({
      where: { id: conversationId, tenantId },
      relations: withContact ? { contact: true } : undefined,
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found for tenant');
    }
    return conversation;
  }
}
