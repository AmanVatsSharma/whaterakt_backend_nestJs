/**
* File: src/database/entities/automation.entity.ts
* Module: database
* Purpose: Automation rule model for keyword and drip workflows.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Definition payload is jsonb to support provider-specific metadata.
* - Enabled flag allows safe toggling without deleting rules.
*/
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { TenantOrmEntity } from './tenant.entity';

@Entity({ name: 'Automation' })
export class AutomationOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.automations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantOrmEntity;

  @Column({ type: 'varchar', length: 80 })
  type: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  definition?: Record<string, any> | null;
}
