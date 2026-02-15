/**
* File: src/database/entities/conversation.entity.ts
* Module: database
* Purpose: Inbox conversation thread linked to contacts.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Conversation status drives inbox triage workflows.
* - Tracks lastMessage timestamp for quick sorting in dashboards.
*/
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import { ContactOrmEntity } from './contact.entity';
import { ConversationNoteOrmEntity } from './conversation-note.entity';
import { ConversationTagOrmEntity } from './conversation-tag.entity';
import { MessageOrmEntity } from './message.entity';
import { TenantOrmEntity } from './tenant.entity';
import { UserOrmEntity } from './user.entity';

export enum ConversationStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  CLOSED = 'CLOSED',
}

@Entity({ name: 'Conversation' })
export class ConversationOrmEntity {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  contactId: string;

  @ManyToOne(() => ContactOrmEntity, (contact) => contact.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contactId' })
  contact: ContactOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.conversations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: TenantOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  assignedUserId?: string | null;

  @ManyToOne(() => UserOrmEntity, (user) => user.assignedConversations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser?: UserOrmEntity | null;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.OPEN })
  status: ConversationStatus;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastMessage: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => MessageOrmEntity, (message) => message.conversation)
  messages?: MessageOrmEntity[];

  @OneToMany(() => ConversationNoteOrmEntity, (note) => note.conversation)
  notes?: ConversationNoteOrmEntity[];

  @OneToMany(() => ConversationTagOrmEntity, (tag) => tag.conversation)
  tags?: ConversationTagOrmEntity[];
}
