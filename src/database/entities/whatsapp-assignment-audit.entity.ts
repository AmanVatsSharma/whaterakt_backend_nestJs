/**
* File: src/database/entities/whatsapp-assignment-audit.entity.ts
* Module: database
* Purpose: Assignment and lifecycle audit trail for managed WhatsApp channels.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Captures operator actions for assignment, release, suspension, activation.
* - Supports tenant-level compliance export and troubleshooting.
*/
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { TenantOrmEntity } from './tenant.entity';
import { WhatsAppManagedNumberOrmEntity } from './whatsapp-number.entity';

export enum WhatsAppAssignmentAuditAction {
  ASSIGNED = 'ASSIGNED',
  REASSIGNED = 'REASSIGNED',
  RELEASED = 'RELEASED',
  SUSPENDED = 'SUSPENDED',
  ACTIVATED = 'ACTIVATED',
  STATUS_UPDATED = 'STATUS_UPDATED',
  ONBOARDING_UPDATED = 'ONBOARDING_UPDATED',
}

@Entity({ name: 'WhatsAppAssignmentAudit' })
@Index(['tenantId', 'createdAt'])
@Index(['phoneNumberId', 'createdAt'])
export class WhatsAppAssignmentAuditOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @ManyToOne(() => TenantOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: TenantOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  managedNumberId?: string | null;

  @ManyToOne(() => WhatsAppManagedNumberOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'managedNumberId' })
  managedNumber?: WhatsAppManagedNumberOrmEntity | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  phoneNumberId?: string | null;

  @Column({ type: 'varchar', length: 48 })
  action: WhatsAppAssignmentAuditAction;

  @Column({ type: 'varchar', length: 128, nullable: true })
  operatorId?: string | null;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;
}
