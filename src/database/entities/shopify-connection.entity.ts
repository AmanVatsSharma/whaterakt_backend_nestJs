/**
* File: src/database/entities/shopify-connection.entity.ts
* Module: database
* Purpose: Shopify tenant connection credentials and metadata.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Unique by tenant + shopDomain.
* - Access token is stored for integration calls; keep encrypted at rest in production.
*/
import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

@Entity({ name: 'ShopifyConnection' })
@Index(['tenantId', 'shopDomain'], { unique: true })
export class ShopifyConnectionOrmEntity {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 191 })
  shopDomain: string;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  scopes: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastOrdersSyncAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastCustomersSyncAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastProductsSyncAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  connectedAt: Date;
}
