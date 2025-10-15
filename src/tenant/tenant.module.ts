import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TenantService } from './tenant.service';

@Module({
  providers: [PrismaService, TenantService],
  exports: [TenantService],
})
export class TenantModule {}