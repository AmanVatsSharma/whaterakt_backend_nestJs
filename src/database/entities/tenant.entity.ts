/**
* File: src/database/entities/tenant.entity.ts
* Module: database
* Purpose: Tenant persistence model used by TypeORM repositories.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Maps to the existing "Tenant" table in PostgreSQL.
* - Keeps optional account metadata fields for future plan/region extensions.
*/
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { AutomationOrmEntity } from './automation.entity';
import { CampaignOrmEntity } from './campaign.entity';
import { ContactOrmEntity } from './contact.entity';
import { ConsentLogOrmEntity } from './consent-log.entity';
import { ConversationOrmEntity } from './conversation.entity';
import { TagOrmEntity } from './tag.entity';
import { TemplateOrmEntity } from './template.entity';
import { UserOrmEntity } from './user.entity';

@Entity({ name: 'Tenant' })
@Index(['name'], { unique: true })
export class TenantOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  apiKey?: string | null;

  @Column({ type: 'varchar', length: 64, default: 'standard' })
  plan: string;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 64, default: 'global' })
  region: string;

  @Column({ type: 'jsonb', nullable: true })
  featureFlags?: Record<string, boolean> | null;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => UserOrmEntity, (user) => user.tenant)
  users?: UserOrmEntity[];

  @OneToMany(() => CampaignOrmEntity, (campaign) => campaign.tenant)
  campaigns?: CampaignOrmEntity[];

  @OneToMany(() => ContactOrmEntity, (contact) => contact.tenant)
  contacts?: ContactOrmEntity[];

  @OneToMany(() => TemplateOrmEntity, (template) => template.tenant)
  templates?: TemplateOrmEntity[];

  @OneToMany(() => ConversationOrmEntity, (conversation) => conversation.tenant)
  conversations?: ConversationOrmEntity[];

  @OneToMany(() => AutomationOrmEntity, (automation) => automation.tenant)
  automations?: AutomationOrmEntity[];

  @OneToMany(() => TagOrmEntity, (tag) => tag.tenant)
  tags?: TagOrmEntity[];

  @OneToMany(() => ConsentLogOrmEntity, (log) => log.tenant)
  consentLogs?: ConsentLogOrmEntity[];
}
