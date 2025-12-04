import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantOrmEntity } from '../entities/tenant.entity';

type PrismaTenant = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  plan?: string | null;
  status?: string | null;
  region?: string | null;
  featureFlags?: Record<string, boolean> | null;
};

@Injectable()
export class TenantWriteRepository {
  private readonly logger = new Logger(TenantWriteRepository.name);

  constructor(
    @InjectRepository(TenantOrmEntity)
    private readonly repository: Repository<TenantOrmEntity>,
  ) {}

  async upsertFromPrisma(tenant: PrismaTenant) {
    this.logger.log(`Mirroring tenant ${tenant.id} into TypeORM store`);
    const entity = this.repository.create({
      id: tenant.id,
      name: tenant.name,
      description: tenant.description ?? null,
      plan: tenant.plan ?? 'standard',
      status: tenant.status ?? 'active',
      region: tenant.region ?? 'global',
      featureFlags: tenant.featureFlags ?? null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    } as Partial<TenantOrmEntity>);
    return this.repository.save(entity);
  }
}
