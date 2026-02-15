/**
* File: src/database/entities/message.entity.ts
* Module: database
* Purpose: Inbound/outbound WhatsApp message audit trail.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Stores provider message IDs for delivery reconciliation and idempotency.
* - Keeps optional links to campaign and conversation contexts.
*/
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CampaignOrmEntity } from './campaign.entity';
import { ConversationOrmEntity } from './conversation.entity';
import { TenantOrmEntity } from './tenant.entity';

export enum MessageStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

@Entity({ name: 'Message' })
@Index(['waMessageId'], { unique: true, where: '"waMessageId" IS NOT NULL' })
export class MessageOrmEntity {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.DRAFT })
  status: MessageStatus;

  @Column({ type: 'enum', enum: MessageDirection, nullable: true })
  direction?: MessageDirection | null;

  @Column({ type: 'varchar', length: 191, nullable: true })
  waMessageId?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  to?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  from?: string | null;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @ManyToOne(() => TenantOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: TenantOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  campaignId?: string | null;

  @ManyToOne(() => CampaignOrmEntity, (campaign) => campaign.messages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaignId' })
  campaign?: CampaignOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  conversationId?: string | null;

  @ManyToOne(() => ConversationOrmEntity, (conversation) => conversation.messages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'conversationId' })
  conversation?: ConversationOrmEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
