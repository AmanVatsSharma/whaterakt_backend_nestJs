/**
* File: src/tenant/tenant.service.ts
* Module: tenant
* Purpose: Tenant creation and lookup service using TypeORM.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Seeds default RBAC roles after tenant creation.
* - Reads/writes directly through DataSource repositories.
*/
import { Injectable, Logger } from '@nestjs/common';
import { CreateTenantInput } from './dto/create-tenant.input';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { seedRbacDefaults } from '../rbac/rbac.seed';
import { TenantOrmEntity } from '../database/entities';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createTenant(input: CreateTenantInput) {
    this.logger.log(`Creating tenant ${input.name}`);
    const repository = this.dataSource.getRepository(TenantOrmEntity);
    const tenant = repository.create({
      name: input.name,
      description: input.description ?? null,
    });
    const savedTenant = await repository.save(tenant);
    await this.seedTenantRbac(savedTenant.id);
    return savedTenant;
  }

  async findById(id: string) {
    return this.dataSource.getRepository(TenantOrmEntity).findOne({
      where: { id },
    });
  }

  private async seedTenantRbac(tenantId: string) {
    try {
      await seedRbacDefaults(this.dataSource, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to seed RBAC defaults for tenant ${tenantId}: ${message}`);
    }
  }
} 