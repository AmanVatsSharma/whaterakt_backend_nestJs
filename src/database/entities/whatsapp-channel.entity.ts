/**
* File: src/database/entities/whatsapp-channel.entity.ts
* Module: database
* Purpose: Tenant-scoped WhatsApp onboarding and channel activation state.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Stores onboarding lifecycle and channel metadata for managed numbers.
* - Read status + phoneNumberId fields first for send/readiness checks.
*/
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { TenantOrmEntity } from './tenant.entity';

export enum WhatsAppChannelStatus {
  NEW = 'NEW',
  DOCS_PENDING = 'DOCS_PENDING',
  VERIFIED = 'VERIFIED',
  NUMBER_ASSIGNED = 'NUMBER_ASSIGNED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum WhatsAppObaStatus {
  NOT_APPLIED = 'NOT_APPLIED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'WhatsAppChannel' })
@Index(['tenantId'], { unique: true })
@Index(['phoneNumberId'], { unique: true, where: '"phoneNumberId" IS NOT NULL' })
export class WhatsAppChannelOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantOrmEntity;

  @Column({ type: 'varchar', length: 40, default: WhatsAppChannelStatus.NEW })
  status: WhatsAppChannelStatus;

  @Column({ type: 'timestamptz', nullable: true })
  onboardingSlaTargetAt?: Date | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  businessLegalName?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  contactEmail?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  contactPhone?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string | null;

  @Column({ type: 'int', nullable: true })
  expectedDailyVolume?: number | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  wabaId?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  businessAccountId?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  phoneNumberId?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phoneNumberE164?: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  displayName?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  displayNameStatus?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  qualityRating?: string | null;

  @Column({ type: 'boolean', default: false })
  obaEligible: boolean;

  @Column({ type: 'varchar', length: 32, default: WhatsAppObaStatus.NOT_APPLIED })
  obaStatus: WhatsAppObaStatus;

  @Column({ type: 'timestamptz', nullable: true })
  obaAppliedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  obaApprovedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  obaRejectedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  obaReviewNotes?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  webhookVerifiedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  suspendedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastReviewAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string | null;
}
