import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export abstract class TenantAwareService {
  protected tenantId: string;

  constructor(protected readonly prisma: PrismaService) {}

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
    return this;
  }

  protected withTenant() {
    return {
      tenantId: this.tenantId,
    };
  }
} 