/**
 * File: src/database/migrations/202602160005-add-whatsapp-oba-tracking.migration.ts
 * Module: database
 * Purpose: Add OBA/green-tick readiness tracking fields to WhatsApp channel table.
 * Author: BharatERP
 * created: 2026-02-16
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsAppObaTracking202602160005
  implements MigrationInterface
{
  name = 'AddWhatsAppObaTracking202602160005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      ADD COLUMN IF NOT EXISTS "obaEligible" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      ADD COLUMN IF NOT EXISTS "obaStatus" character varying(32) NOT NULL DEFAULT 'NOT_APPLIED'
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      ADD COLUMN IF NOT EXISTS "obaAppliedAt" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      ADD COLUMN IF NOT EXISTS "obaApprovedAt" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      ADD COLUMN IF NOT EXISTS "obaRejectedAt" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      ADD COLUMN IF NOT EXISTS "obaReviewNotes" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      DROP COLUMN IF EXISTS "obaReviewNotes"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      DROP COLUMN IF EXISTS "obaRejectedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      DROP COLUMN IF EXISTS "obaApprovedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      DROP COLUMN IF EXISTS "obaAppliedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      DROP COLUMN IF EXISTS "obaStatus"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      DROP COLUMN IF EXISTS "obaEligible"
    `);
  }
}
