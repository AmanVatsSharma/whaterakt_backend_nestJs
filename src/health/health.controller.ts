/**
 * File: src/health/health.controller.ts
 * Module: health
 * Purpose: HTTP endpoints for liveness vs readiness probes.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-04-04
 * Notes:
 * - GET /health/live — always 200 when the process responds (liveness).
 * - GET /health/ready and GET /health — 503 when DB, Redis, or queue checks fail (readiness).
 */
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DatabaseHealthIndicator } from './database.health';
import { QueueHealthIndicator } from './queue.health';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private database: DatabaseHealthIndicator,
    private redis: RedisHealthIndicator,
    private queue: QueueHealthIndicator,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness — process is accepting HTTP (always 200)' })
  @ApiOkResponse({ description: 'Process is up' })
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness — DB, Redis, and message queue must be healthy',
  })
  @ApiOkResponse({ description: 'All readiness checks passed' })
  @ApiServiceUnavailableResponse({ description: 'One or more checks failed' })
  async ready() {
    return this.runReadinessCheck();
  }

  @Get()
  @ApiOperation({
    summary: 'Readiness (alias of /health/ready) — HTTP 503 if a dependency is down',
  })
  @ApiOkResponse({ description: 'All readiness checks passed' })
  @ApiServiceUnavailableResponse({ description: 'One or more checks failed' })
  async check() {
    return this.runReadinessCheck();
  }

  private async runReadinessCheck() {
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
    const body = {
      status: isUp ? 'ok' : 'error',
      info: isUp ? details : {},
      error: isUp ? {} : details,
      details,
      timestamp: new Date().toISOString(),
    };

    if (!isUp) {
      throw new ServiceUnavailableException(body);
    }

    return body;
  }
}
