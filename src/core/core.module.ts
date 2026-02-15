/**
* File: src/core/core.module.ts
* Module: core
* Purpose: Shared global guards/cache providers for backend modules.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Database access is provided by DatabaseModule/TypeORM.
* - Core keeps cross-cutting guards and Redis provider global.
*/
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantGuard } from './guards/tenant.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { RedisProvider } from './cache/redis.provider';
import { MetricsModule } from '../metrics/metrics.module';
import { LoggerService } from 'src/shared/logger.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MetricsModule,
  ],
  providers: [
    LoggerService,
    TenantGuard,
    RateLimitGuard,
    RedisProvider
  ],
  exports: [
    LoggerService,
    TenantGuard,
    RateLimitGuard,
    RedisProvider
  ],
})
export class CoreModule {} 