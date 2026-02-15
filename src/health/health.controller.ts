/**
* File: src/health/health.controller.ts
* Module: health
* Purpose: HTTP endpoint returning aggregate subsystem health.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Aggregates database, Redis, and queue status checks.
* - Designed for readiness/liveness probes.
*/
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseHealthIndicator } from './database.health';
import { QueueHealthIndicator } from './queue.health';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private database: DatabaseHealthIndicator,
    private redis: RedisHealthIndicator,
    private queue: QueueHealthIndicator
  ) {}

  @Get()
  @ApiOperation({ summary: 'Comprehensive health check (DB, Redis, Queue)' })
  @ApiOkResponse({ description: 'Service health status returned' })
  async check() {
    const [database, redis, queue] = await Promise.all([
      this.database.isHealthy('database'),
      this.redis.isHealthy('redis'),
      this.queue.isHealthy('queue'),
    ]);

    const details = {
      ...database,
      ...redis,
      ...queue,
    };
    const isUp = Object.values(details).every(
      (entry) => (entry as { status?: string }).status === 'up',
    );
    const info = isUp ? details : {};
    const error = isUp ? {} : details;

    return {
      status: isUp ? 'ok' : 'error',
      info,
      error,
      details,
      timestamp: new Date().toISOString(),
    };
  }
} 