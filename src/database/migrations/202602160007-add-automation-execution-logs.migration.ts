/**
 * File: src/database/migrations/202602160007-add-automation-execution-logs.migration.ts
 * Module: database
 * Purpose: Persist automation execution trail for diagnostics and audits.
 * Author: BharatERP
 * created: 2026-02-16
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAutomationExecutionLogs202602160007
  implements MigrationInterface
{
  name = 'AddAutomationExecutionLogs202602160007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "AutomationExecutionLog" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenantId" uuid NOT NULL,
        "automationId" uuid,
        "automationType" character varying(80) NOT NULL,
        "triggerSource" character varying(80) NOT NULL,
        "status" character varying(40) NOT NULL,
        "recipient" character varying(32),
        "messagePreview" character varying(240),
        "details" jsonb,
        CONSTRAINT "PK_AutomationExecutionLog_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_AutomationExecutionLog_tenant_createdAt"
      ON "AutomationExecutionLog" ("tenantId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_AutomationExecutionLog_automation_createdAt"
      ON "AutomationExecutionLog" ("automationId", "createdAt")
    `);

    await queryRunner.query(`
      ALTER TABLE "AutomationExecutionLog"
      ADD CONSTRAINT "FK_AutomationExecutionLog_tenantId"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "AutomationExecutionLog"
      ADD CONSTRAINT "FK_AutomationExecutionLog_automationId"
      FOREIGN KEY ("automationId") REFERENCES "Automation"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "AutomationExecutionLog"
      DROP CONSTRAINT IF EXISTS "FK_AutomationExecutionLog_automationId"
    `);
    await queryRunner.query(`
      ALTER TABLE "AutomationExecutionLog"
      DROP CONSTRAINT IF EXISTS "FK_AutomationExecutionLog_tenantId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_AutomationExecutionLog_automation_createdAt"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_AutomationExecutionLog_tenant_createdAt"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "AutomationExecutionLog"
    `);
  }
}
