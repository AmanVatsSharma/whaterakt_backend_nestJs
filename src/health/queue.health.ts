import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueHealthIndicator extends HealthIndicator {
  constructor(
    @InjectQueue('messages')
    private readonly messageQueue: Queue,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isPing = await this.messageQueue.client.ping();
      const isHealthy = isPing === 'PONG';
      return this.getStatus(key, isHealthy);
    } catch (e) {
      return this.getStatus(key, false, { message: e.message });
    }
  }
} 