/**
* File: src/tenant/tenant.module.ts
* Module: tenant
* Purpose: Tenant module exposing tenant services for auth and request scoping.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Relies on TypeORM through the shared DatabaseModule.
* - Seeds RBAC defaults when tenants are created.
*/
import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { MetricsModule } from '../metrics/metrics.module';
import { DatabaseModule } from '../database/database.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [DatabaseModule, MetricsModule, RbacModule],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}