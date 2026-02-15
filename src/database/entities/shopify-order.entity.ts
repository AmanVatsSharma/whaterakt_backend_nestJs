/**
* File: src/database/entities/shopify-order.entity.ts
* Module: database
* Purpose: Cached Shopify order mirror for tenant reporting/use-cases.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Unique by tenant + Shopify order id.
* - Raw payload is retained for forward-compatible field reads.
*/
import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';

@Entity({ name: 'ShopifyOrder' })
@Index(['tenantId', 'shopifyOrderId'], { unique: true })
export class ShopifyOrderOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 191 })
  shopifyOrderId: string;

  @Column({ type: 'varchar', length: 191 })
  orderNumber: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  totalPrice?: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  currency?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  status?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  placedAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  raw?: Record<string, any> | null;
}
