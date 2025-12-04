import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

/**
 * Simple helper so future repositories can easily scope every query to the
 * active tenant without rewriting boilerplate in each module.
 */
export abstract class TenantAwareRepository<T extends { tenantId?: string }> {
  protected tenantId?: string;
  protected readonly logger = new Logger(TenantAwareRepository.name);

  constructor(protected readonly repository: Repository<T>) {}

  setTenantContext(tenantId: string) {
    this.logger.log(`Tenant context set for repository (${tenantId})`);
    this.tenantId = tenantId;
    return this;
  }

  protected ensureTenant() {
    if (!this.tenantId) {
      throw new Error('Tenant context required before performing this operation');
    }
    return this.tenantId;
  }

  protected scopedQuery(alias: string) {
    const tenantId = this.ensureTenant();
    return this.repository.createQueryBuilder(alias).where(`${alias}.tenantId = :tenantId`, { tenantId });
  }
}
