/**
 * File: src/database/migrations/202602150001-add-shopify-sync-cursors.migration.ts
 * Module: database
 * Purpose: Add incremental sync cursor timestamps to Shopify connections.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopifySyncCursors202602150001 implements MigrationInterface {
  name = 'AddShopifySyncCursors202602150001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "ShopifyConnection"
      ADD COLUMN IF NOT EXISTS "lastOrdersSyncAt" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "ShopifyConnection"
      ADD COLUMN IF NOT EXISTS "lastCustomersSyncAt" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "ShopifyConnection"
      DROP COLUMN IF EXISTS "lastCustomersSyncAt"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "ShopifyConnection"
      DROP COLUMN IF EXISTS "lastOrdersSyncAt"
    `);
  }
}
