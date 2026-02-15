/**
 * File: src/inbox/inbox.controller.ts
 * Module: inbox
 * Purpose: REST endpoints for inbox data consumed by Next BFF.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Uses tenant id from request context/middleware header.
 * - Read listConversations first.
 */

import { Body, Controller, Get, Headers, Param, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ConversationService } from './conversation.service';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { SetConversationStatusDto } from './dto/set-conversation-status.dto';
import { AddConversationNoteDto } from './dto/add-conversation-note.dto';
import { TagConversationDto } from './dto/tag-conversation.dto';
import { SendConversationMessageDto } from './dto/send-conversation-message.dto';
import { ConversationStatus } from '../database/entities';

type RequestWithTenant = Request & {
  tenant?: { id?: string };
  user?: { userId?: string };
};

@Controller('inbox')
export class InboxController {
  constructor(private readonly conversationService: ConversationService) {}

  private resolveTenantId(
    request: RequestWithTenant,
    tenantHeader?: string,
  ) {
    return request.tenant?.id || tenantHeader || '';
  }

  @Get('conversations')
  async listConversations(
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    if (!tenantId) {
      return { data: [] };
    }

    const data = await this.conversationService.listConversations(tenantId);
    return { data };
  }

  @Patch('conversations/:conversationId/assignment')
  async assignConversation(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: AssignConversationDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.assign(tenantId, conversationId, body.userId);
    return { ok: true };
  }

  @Patch('conversations/:conversationId/status')
  async setStatus(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: SetConversationStatusDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.setStatus(
      tenantId,
      conversationId,
      body.status as ConversationStatus,
    );
    return { ok: true };
  }

  @Post('conversations/:conversationId/notes')
  async addNote(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: AddConversationNoteDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    const userId = request.user?.userId || 'system';
    await this.conversationService.addNote(
      tenantId,
      conversationId,
      userId,
      body.content,
    );
    return { ok: true };
  }

  @Post('conversations/:conversationId/tags')
  async addTag(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: TagConversationDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.tag(tenantId, conversationId, body.tag);
    return { ok: true };
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: SendConversationMessageDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.sendMessage(tenantId, conversationId, body.message);
    return { ok: true };
  }
}

