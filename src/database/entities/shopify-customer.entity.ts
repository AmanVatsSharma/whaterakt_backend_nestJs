/**
* File: src/database/entities/shopify-customer.entity.ts
* Module: database
* Purpose: Cached Shopify customer mirror for tenant records.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Unique by tenant + Shopify customer id.
* - Raw payload supports schema evolution from provider webhooks.
*/
import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';

@Entity({ name: 'ShopifyCustomer' })
@Index(['tenantId', 'shopifyCustomerId'], { unique: true })
export class ShopifyCustomerOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 191 })
  shopifyCustomerId: string;

  @Column({ type: 'varchar', length: 191, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  firstName?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  lastName?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  raw?: Record<string, any> | null;
}
