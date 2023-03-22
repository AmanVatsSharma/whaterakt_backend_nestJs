import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from 'src/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (e) {
      return this.getStatus(key, false, { error: e.message });
    }
  }
} 