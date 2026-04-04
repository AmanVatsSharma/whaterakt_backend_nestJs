/**
 * @file 202604040001-add-rbac-tables.migration.ts
 * @module database
 * @description Adds Role, Permission, RolePermission, and UserRole tables for RBAC.
 * @author Whaterakt
 * @created 2026-04-04
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRbacTables202604040001 implements MigrationInterface {
  name = 'AddRbacTables202604040001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Permission" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "resource" character varying(120) NOT NULL,
        "action" character varying(120) NOT NULL,
        "description" text,
        CONSTRAINT "PK_Permission_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_Permission_resource_action"
      ON "Permission" ("resource", "action")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Role" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(120) NOT NULL,
        "description" text,
        "tenantId" uuid NOT NULL,
        "metadata" jsonb,
        CONSTRAINT "PK_Role_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_Role_tenantId" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_Role_tenantId_name"
      ON "Role" ("tenantId", "name")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "RolePermission" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        CONSTRAINT "PK_RolePermission_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_RolePermission_roleId" FOREIGN KEY ("roleId") REFERENCES "Role"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_RolePermission_permissionId" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "UQ_RolePermission_role_permission" UNIQUE ("roleId", "permissionId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "UserRole" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "constraints" jsonb,
        CONSTRAINT "PK_UserRole_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_UserRole_userId" FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_UserRole_roleId" FOREIGN KEY ("roleId") REFERENCES "Role"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "UQ_UserRole_user_role" UNIQUE ("userId", "roleId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "UserRole"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "RolePermission"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Role"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Permission"`);
  }
}
