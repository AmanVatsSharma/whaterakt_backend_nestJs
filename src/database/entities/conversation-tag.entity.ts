/**
* File: src/database/entities/conversation-tag.entity.ts
* Module: database
* Purpose: Join table entity between conversations and tags.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Unique composite key blocks duplicate conversation tag links.
* - Supports inbox labeling and filtering features.
*/
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { ConversationOrmEntity } from './conversation.entity';
import { TagOrmEntity } from './tag.entity';

@Entity({ name: 'ConversationTag' })
@Unique(['conversationId', 'tagId'])
export class ConversationTagOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => ConversationOrmEntity, (conversation) => conversation.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: ConversationOrmEntity;

  @Column({ type: 'uuid' })
  tagId: string;

  @ManyToOne(() => TagOrmEntity, (tag) => tag.conversationTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: TagOrmEntity;
}
