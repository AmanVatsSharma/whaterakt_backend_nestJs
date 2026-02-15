/**
* File: src/database/entities/shopify-product.entity.ts
* Module: database
* Purpose: Cached Shopify product mirror for campaign audience/product context.
* Author: BharatERP
* created: 2026-02-15
*/
import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';

@Entity({ name: 'ShopifyProduct' })
@Index(['tenantId', 'shopifyProductId'], { unique: true })
export class ShopifyProductOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 191 })
  shopifyProductId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  vendor?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  status?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  updatedAtShopify?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  raw?: Record<string, any> | null;
}
