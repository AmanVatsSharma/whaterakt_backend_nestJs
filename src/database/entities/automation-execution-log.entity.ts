/**
* File: src/database/entities/automation-execution-log.entity.ts
* Module: database
* Purpose: Execution trail for automation rule processing events.
* Author: BharatERP
* created: 2026-02-16
*/
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { AutomationOrmEntity } from './automation.entity';
import { TenantOrmEntity } from './tenant.entity';

@Entity({ name: 'AutomationExecutionLog' })
export class AutomationExecutionLogOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  automationId?: string | null;

  @ManyToOne(() => AutomationOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'automationId' })
  automation?: AutomationOrmEntity | null;

  @Column({ type: 'varchar', length: 80 })
  automationType: string;

  @Column({ type: 'varchar', length: 80 })
  triggerSource: string;

  @Column({ type: 'varchar', length: 40 })
  status: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  recipient?: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  messagePreview?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown> | null;
}
