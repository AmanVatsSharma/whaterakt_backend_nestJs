/**
* File: src/health/queue.health.ts
* Module: health
* Purpose: Queue health checker for Bull message queue connectivity.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses queue client's ping command to verify broker reachability.
* - Returns an up/down health payload consumed by health controller.
*/
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueHealthIndicator {
  constructor(
    @InjectQueue('messages')
    private readonly messageQueue: Queue,
  ) {}

  async isHealthy(key: string): Promise<Record<string, any>> {
    try {
      const isPing = await this.messageQueue.client.ping();
      const isHealthy = isPing === 'PONG';
      return { [key]: { status: isHealthy ? 'up' : 'down' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { [key]: { status: 'down', message } };
    }
  }
} 