/**
* File: src/database/entities/tag.entity.ts
* Module: database
* Purpose: Reusable tenant-scoped tag model for contacts and conversations.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Unique by tenant + name to match upsert flows.
* - Connected through explicit join entities for audit-friendly tagging.
*/
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { ContactTagOrmEntity } from './contact-tag.entity';
import { ConversationTagOrmEntity } from './conversation-tag.entity';
import { TenantOrmEntity } from './tenant.entity';

@Entity({ name: 'Tag' })
@Index(['tenantId', 'name'], { unique: true })
export class TagOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantOrmEntity;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @OneToMany(() => ContactTagOrmEntity, (contactTag) => contactTag.tag)
  contactTags?: ContactTagOrmEntity[];

  @OneToMany(() => ConversationTagOrmEntity, (conversationTag) => conversationTag.tag)
  conversationTags?: ConversationTagOrmEntity[];
}
