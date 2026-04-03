/**
 * File: src/database/migrations/202602160006-add-campaign-composition-targeting.migration.ts
 * Module: database
 * Purpose: Add campaign composition and audience targeting columns.
 * Author: BharatERP
 * created: 2026-02-16
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCampaignCompositionTargeting202602160006
  implements MigrationInterface
{
  name = 'AddCampaignCompositionTargeting202602160006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Campaign"
      ADD COLUMN IF NOT EXISTS "messageBody" text
    `);
    await queryRunner.query(`
      ALTER TABLE "Campaign"
      ADD COLUMN IF NOT EXISTS "templateName" character varying(191)
    `);
    await queryRunner.query(`
      ALTER TABLE "Campaign"
      ADD COLUMN IF NOT EXISTS "audienceContactIds" text[] NOT NULL DEFAULT ARRAY[]::text[]
    `);
    await queryRunner.query(`
      ALTER TYPE "Campaign_status_enum" ADD VALUE IF NOT EXISTS 'PAUSED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Campaign"
      DROP COLUMN IF EXISTS "audienceContactIds"
    `);
    await queryRunner.query(`
      ALTER TABLE "Campaign"
      DROP COLUMN IF EXISTS "templateName"
    `);
    await queryRunner.query(`
      ALTER TABLE "Campaign"
      DROP COLUMN IF EXISTS "messageBody"
    `);
  }
}
