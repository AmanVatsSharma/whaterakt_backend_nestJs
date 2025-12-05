import { Injectable } from '@nestjs/common';
import { CreateTenantInput } from './dto/create-tenant.input';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { TenantWriteRepository } from '../database/repositories/tenant-write.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { seedRbacDefaults } from '../rbac/rbac.seed';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tenantWriteRepository: TenantWriteRepository,
    private readonly metrics: MetricsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createTenant(input: CreateTenantInput) {
    console.log('[TenantService] Creating tenant', { name: input.name });
    const tenant = await this.prisma.tenant.create({
      data: {
        name: input.name,
        description: input.description,
      },
    });
    await this.mirrorTenantToTypeOrm(tenant);
    return tenant;
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  private isDualWriteEnabled() {
    return this.configService.get('TYPEORM_DUAL_WRITE_ENABLED') === 'true';
  }

  private async mirrorTenantToTypeOrm(tenant: any) {
    if (!this.isDualWriteEnabled()) {
      return;
    }
    try {
    await this.tenantWriteRepository.upsertFromPrisma(tenant);
    await this.seedTenantRbac(tenant.id);
    } catch (error) {
      console.error('[TenantService] Failed to mirror tenant to TypeORM', { tenantId: tenant.id, error });
      this.metrics.incrementDualWriteFailure('tenant');
    }
  }

  private async seedTenantRbac(tenantId: string) {
    if (!this.isDualWriteEnabled()) {
      return;
    }
    try {
      await seedRbacDefaults(this.dataSource, tenantId);
    } catch (error) {
      console.error('[TenantService] Failed to seed RBAC defaults', { tenantId, error });
      this.metrics.incrementDualWriteFailure('tenant');
    }
  }
} 