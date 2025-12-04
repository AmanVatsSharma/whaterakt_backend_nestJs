import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TenantService } from './tenant.service';
import { MetricsModule } from '../metrics/metrics.module';
import { DatabaseModule } from '../database/database.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [DatabaseModule, MetricsModule, RbacModule],
  providers: [PrismaService, TenantService],
  exports: [TenantService],
})
export class TenantModule {}