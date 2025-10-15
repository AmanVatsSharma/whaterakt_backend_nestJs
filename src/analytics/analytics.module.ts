import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AnalyticsResolver } from './analytics.resolver';

@Module({
  providers: [PrismaService, AnalyticsResolver],
})
export class AnalyticsModule {}
