/**
* File: src/database/entities/conversation-note.entity.ts
* Module: database
* Purpose: Internal note model attached to inbox conversations.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Notes are operator-authored annotations, not customer messages.
* - Each note is scoped to a conversation and user.
*/
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ConversationOrmEntity } from './conversation.entity';
import { UserOrmEntity } from './user.entity';

@Entity({ name: 'ConversationNote' })
export class ConversationNoteOrmEntity {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => ConversationOrmEntity, (conversation) => conversation.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: ConversationOrmEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.conversationNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
