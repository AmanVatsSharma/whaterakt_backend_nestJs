/**
* File: src/database/entities/campaign.entity.ts
* Module: database
* Purpose: Campaign persistence model for outbound broadcast workflows.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Reuses GraphQL campaign enums to keep API and DB values aligned.
* - Links campaign dispatch metadata to user, tenant, and sent messages.
*/
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CampaignStatus, CampaignType } from '../../campaign/enums';
import { MessageOrmEntity } from './message.entity';
import { TenantOrmEntity } from './tenant.entity';
import { UserOrmEntity } from './user.entity';

@Entity({ name: 'Campaign' })
export class CampaignOrmEntity {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Column({ type: 'enum', enum: CampaignType })
  type: CampaignType;

  @Column({ type: 'enum', enum: CampaignStatus })
  status: CampaignStatus;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date | null;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.campaigns, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.campaigns, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: TenantOrmEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => MessageOrmEntity, (message) => message.campaign)
  messages?: MessageOrmEntity[];
}
