/**
* File: src/database/entities/shopify-sync-log.entity.ts
* Module: database
* Purpose: Audit log for Shopify sync execution runs.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Tracks lifecycle states STARTED/COMPLETED/FAILED.
* - Message stores concise run status for diagnostics.
*/
import { Column, Entity } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';

@Entity({ name: 'ShopifySyncLog' })
export class ShopifySyncLogOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 40 })
  resource: string;

  @Column({ type: 'varchar', length: 40 })
  status: string;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt?: Date | null;
}
