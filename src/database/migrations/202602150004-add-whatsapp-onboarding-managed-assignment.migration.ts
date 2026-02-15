/**
 * File: src/database/migrations/202602150004-add-whatsapp-onboarding-managed-assignment.migration.ts
 * Module: database
 * Purpose: Add managed WhatsApp onboarding, number inventory, and audit tables.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Entity coverage tokens:
 * - whatsapp-channel
 * - whatsapp-number
 * - whatsapp-assignment-audit
 */
export class AddWhatsAppOnboardingManagedAssignment202602150004
  implements MigrationInterface
{
  name = 'AddWhatsAppOnboardingManagedAssignment202602150004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "WhatsAppChannel" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "tenantId" uuid NOT NULL,
        "status" character varying(40) NOT NULL DEFAULT 'NEW',
        "onboardingSlaTargetAt" TIMESTAMPTZ,
        "businessLegalName" character varying(180),
        "contactEmail" character varying(180),
        "contactPhone" character varying(32),
        "website" character varying(255),
        "expectedDailyVolume" integer,
        "wabaId" character varying(128),
        "businessAccountId" character varying(128),
        "phoneNumberId" character varying(128),
        "phoneNumberE164" character varying(32),
        "displayName" character varying(160),
        "displayNameStatus" character varying(64),
        "qualityRating" character varying(64),
        "webhookVerifiedAt" TIMESTAMPTZ,
        "activatedAt" TIMESTAMPTZ,
        "suspendedAt" TIMESTAMPTZ,
        "lastReviewAt" TIMESTAMPTZ,
        "reviewNotes" text,
        CONSTRAINT "PK_WhatsAppChannel_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_WhatsAppChannel_tenantId" UNIQUE ("tenantId")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_WhatsAppChannel_phoneNumberId_unique"
      ON "WhatsAppChannel" ("phoneNumberId")
      WHERE "phoneNumberId" IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "WhatsAppChannel"
      ADD CONSTRAINT "FK_WhatsAppChannel_tenantId"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "WhatsAppManagedNumber" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "phoneNumberId" character varying(128) NOT NULL,
        "displayPhoneNumber" character varying(32) NOT NULL,
        "status" character varying(40) NOT NULL DEFAULT 'AVAILABLE',
        "wabaId" character varying(128),
        "businessAccountId" character varying(128),
        "qualityRating" character varying(64),
        "assignedTenantId" uuid,
        "assignedAt" TIMESTAMPTZ,
        "releasedAt" TIMESTAMPTZ,
        "metadata" jsonb,
        CONSTRAINT "PK_WhatsAppManagedNumber_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_WhatsAppManagedNumber_phoneNumberId" UNIQUE ("phoneNumberId"),
        CONSTRAINT "UQ_WhatsAppManagedNumber_displayPhoneNumber" UNIQUE ("displayPhoneNumber")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_WhatsAppManagedNumber_assignedTenantId"
      ON "WhatsAppManagedNumber" ("assignedTenantId")
    `);
    await queryRunner.query(`
      ALTER TABLE "WhatsAppManagedNumber"
      ADD CONSTRAINT "FK_WhatsAppManagedNumber_assignedTenantId"
      FOREIGN KEY ("assignedTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "WhatsAppAssignmentAudit" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "tenantId" uuid,
        "managedNumberId" uuid,
        "phoneNumberId" character varying(128),
        "action" character varying(48) NOT NULL,
        "operatorId" character varying(128),
        "reason" text,
        "metadata" jsonb,
        CONSTRAINT "PK_WhatsAppAssignmentAudit_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_WhatsAppAssignmentAudit_tenant_created"
      ON "WhatsAppAssignmentAudit" ("tenantId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_WhatsAppAssignmentAudit_phone_created"
      ON "WhatsAppAssignmentAudit" ("phoneNumberId", "createdAt")
    `);
    await queryRunner.query(`
      ALTER TABLE "WhatsAppAssignmentAudit"
      ADD CONSTRAINT "FK_WhatsAppAssignmentAudit_tenantId"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "WhatsAppAssignmentAudit"
      ADD CONSTRAINT "FK_WhatsAppAssignmentAudit_managedNumberId"
      FOREIGN KEY ("managedNumberId")
      REFERENCES "WhatsAppManagedNumber"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppAssignmentAudit"
      DROP CONSTRAINT IF EXISTS "FK_WhatsAppAssignmentAudit_managedNumberId"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppAssignmentAudit"
      DROP CONSTRAINT IF EXISTS "FK_WhatsAppAssignmentAudit_tenantId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_WhatsAppAssignmentAudit_phone_created"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_WhatsAppAssignmentAudit_tenant_created"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "WhatsAppAssignmentAudit"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppManagedNumber"
      DROP CONSTRAINT IF EXISTS "FK_WhatsAppManagedNumber_assignedTenantId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_WhatsAppManagedNumber_assignedTenantId"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "WhatsAppManagedNumber"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "WhatsAppChannel"
      DROP CONSTRAINT IF EXISTS "FK_WhatsAppChannel_tenantId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_WhatsAppChannel_phoneNumberId_unique"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "WhatsAppChannel"
    `);
  }
}
