/**
* File: src/database/entities/contact-tag.entity.ts
* Module: database
* Purpose: Join table entity between contacts and tags.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses explicit entity to support deterministic upsert behavior.
* - Prevents duplicate links with a unique composite key.
*/
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { ContactOrmEntity } from './contact.entity';
import { TagOrmEntity } from './tag.entity';

@Entity({ name: 'ContactTag' })
@Unique(['contactId', 'tagId'])
export class ContactTagOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  contactId: string;

  @ManyToOne(() => ContactOrmEntity, (contact) => contact.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contactId' })
  contact: ContactOrmEntity;

  @Column({ type: 'uuid' })
  tagId: string;

  @ManyToOne(() => TagOrmEntity, (tag) => tag.contactTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: TagOrmEntity;
}
