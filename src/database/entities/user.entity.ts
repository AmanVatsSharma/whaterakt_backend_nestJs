/**
* File: src/database/entities/user.entity.ts
* Module: database
* Purpose: User persistence model, including MFA material and tenant link.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Keeps MFA fields used by auth flows.
* - Uses tenant foreign key for strict workspace boundaries.
*/
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { CampaignOrmEntity } from './campaign.entity';
import { ContactOrmEntity } from './contact.entity';
import { ConversationNoteOrmEntity } from './conversation-note.entity';
import { ConversationOrmEntity } from './conversation.entity';
import { TemplateOrmEntity } from './template.entity';
import { TenantOrmEntity } from './tenant.entity';

@Entity({ name: 'User' })
@Index(['email'], { unique: true })
export class UserOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 180 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantOrmEntity;

  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  mfaSecret?: string | null;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  mfaBackupCodes: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @OneToMany(() => CampaignOrmEntity, (campaign) => campaign.user)
  campaigns?: CampaignOrmEntity[];

  @OneToMany(() => ContactOrmEntity, (contact) => contact.user)
  contacts?: ContactOrmEntity[];

  @OneToMany(() => TemplateOrmEntity, (template) => template.user)
  templates?: TemplateOrmEntity[];

  @OneToMany(() => ConversationOrmEntity, (conversation) => conversation.assignedUser)
  assignedConversations?: ConversationOrmEntity[];

  @OneToMany(() => ConversationNoteOrmEntity, (note) => note.user)
  conversationNotes?: ConversationNoteOrmEntity[];
}
