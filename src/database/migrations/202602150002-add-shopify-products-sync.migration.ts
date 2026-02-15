/**
 * File: src/database/migrations/202602150002-add-shopify-products-sync.migration.ts
 * Module: database
 * Purpose: Add Shopify products cache table and products sync cursor.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopifyProductsSync202602150002 implements MigrationInterface {
  name = 'AddShopifyProductsSync202602150002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "ShopifyConnection"
      ADD COLUMN IF NOT EXISTS "lastProductsSyncAt" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ShopifyProduct" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "tenantId" uuid NOT NULL,
        "shopifyProductId" character varying(191) NOT NULL,
        "title" character varying(255) NOT NULL,
        "vendor" character varying(120),
        "status" character varying(40),
        "updatedAtShopify" TIMESTAMPTZ,
        "raw" jsonb,
        CONSTRAINT "PK_ShopifyProduct_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ShopifyProduct_tenant_product"
      ON "ShopifyProduct" ("tenantId", "shopifyProductId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_ShopifyProduct_tenant_product"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "ShopifyProduct"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "ShopifyConnection"
      DROP COLUMN IF EXISTS "lastProductsSyncAt"
    `);
  }
}
