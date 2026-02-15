/**
* File: src/database/entities/whatsapp-number.entity.ts
* Module: database
* Purpose: Managed WhatsApp number inventory and tenant assignment state.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Inventory rows are operator-managed and can be assigned/released.
* - `assignedTenantId` is the source of truth for pool occupancy.
*/
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { TenantOrmEntity } from './tenant.entity';

export enum WhatsAppManagedNumberStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  SUSPENDED = 'SUSPENDED',
}

@Entity({ name: 'WhatsAppManagedNumber' })
@Index(['phoneNumberId'], { unique: true })
@Index(['displayPhoneNumber'], { unique: true })
@Index(['assignedTenantId'])
export class WhatsAppManagedNumberOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 128 })
  phoneNumberId: string;

  @Column({ type: 'varchar', length: 32 })
  displayPhoneNumber: string;

  @Column({ type: 'varchar', length: 40, default: WhatsAppManagedNumberStatus.AVAILABLE })
  status: WhatsAppManagedNumberStatus;

  @Column({ type: 'varchar', length: 128, nullable: true })
  wabaId?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  businessAccountId?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  qualityRating?: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedTenantId?: string | null;

  @ManyToOne(() => TenantOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedTenantId' })
  assignedTenant?: TenantOrmEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  releasedAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;
}
