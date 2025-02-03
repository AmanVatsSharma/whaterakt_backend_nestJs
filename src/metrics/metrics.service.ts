import { Injectable } from '@nestjs/common';
import { Counter, Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly messageQueueSize: Gauge<string>;
  readonly sentMessages: Counter<string>;
  readonly failedMessages: Counter<string>;

  constructor() {
    this.messageQueueSize = new Gauge({
      name: 'message_queue_size',
      help: 'Current number of messages in queue'
    });

    this.sentMessages = new Counter({
      name: 'messages_sent_total',
      help: 'Total number of sent messages'
    });

    this.failedMessages = new Counter({
      name: 'messages_failed_total',
      help: 'Total number of failed messages'
    });
  }

  async getMetrics() {
    return register.metrics();
  }
} 