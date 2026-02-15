/**
* File: src/health/redis.health.ts
* Module: health
* Purpose: Redis health checker for cache and queue support connectivity.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses Redis ping command for liveness checks.
* - Returns an up/down health payload consumed by health controller.
*/
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Inject } from '@nestjs/common';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async isHealthy(key: string): Promise<Record<string, any>> {
    try {
      const result = await this.redis.ping();
      const isHealthy = result === 'PONG';
      return { [key]: { status: isHealthy ? 'up' : 'down' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { [key]: { status: 'down', message } };
    }
  }
} 