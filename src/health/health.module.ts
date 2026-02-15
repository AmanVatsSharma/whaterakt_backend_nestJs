/**
* File: src/health/health.module.ts
* Module: health
* Purpose: Health module exposing DB/Redis/Queue probes.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Database health is backed by TypeORM DataSource checks.
* - Queue and Redis indicators remain unchanged.
*/
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DatabaseHealthIndicator } from './database.health';
import { QueueHealthIndicator } from './queue.health';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'messages',
    }),
  ],
  controllers: [HealthController],
  providers: [
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    QueueHealthIndicator,
  ]
})
export class HealthModule {} 