import { Injectable, OnModuleInit } from '@nestjs/common';
import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private requestCounter: Counter;
  private activeUsersGauge: Gauge;
  private readonly tenantMessagesCounter = new Counter({
    name: 'tenant_messages_total',
    help: 'Messages sent per tenant',
    labelNames: ['tenantId']
  });

  private readonly campaignDeliveryCounter = new Counter({
    name: 'campaign_delivery_total',
    help: 'Delivered/Read message counts per campaign',
    labelNames: ['campaignId', 'status']
  });

  private readonly rateLimitBlocksCounter = new Counter({
    name: 'rate_limit_blocks_total',
    help: 'Number of rate-limited requests per tenant',
    labelNames: ['tenantId']
  });


  private readonly dualWriteFailureCounter = new Counter({
    name: 'dual_write_failures_total',
    help: 'Number of failed Prisma -> TypeORM mirrors',
    labelNames: ['entity']
  });

  private readonly authEventsCounter = new Counter({
    name: 'auth_events_total',
    help: 'Authentication events grouped by operation',
    labelNames: ['event']
  });

  constructor() {
    this.registry = new Registry();
    
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'status', 'path']
    });

    this.activeUsersGauge = new Gauge({
      name: 'active_users',
      help: 'Number of currently active users'
    });

    this.registry.registerMetric(this.requestCounter);
    this.registry.registerMetric(this.activeUsersGauge);
    this.registry.registerMetric(this.tenantMessagesCounter);
    this.registry.registerMetric(this.campaignDeliveryCounter);
    this.registry.registerMetric(this.rateLimitBlocksCounter);
    this.registry.registerMetric(this.authEventsCounter);
    this.registry.registerMetric(this.dualWriteFailureCounter);

    // Default Node.js/process metrics
    collectDefaultMetrics({ register: this.registry });
  }

  onModuleInit() {
    // No-op; metrics are already registered to this.registry
  }

  incrementRequestCount(method: string, status: number, path: string) {
    this.requestCounter.inc({ method, status: status.toString(), path });
  }

  setActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }

  incrementTenantMessage(tenantId: string) {
    this.tenantMessagesCounter.inc({ tenantId });
  }

  async getMetrics() {
    return this.registry.metrics();
  }

  incrementCampaignDelivery(campaignId: string, status: 'DELIVERED' | 'READ' | 'FAILED') {
    this.campaignDeliveryCounter.inc({ campaignId, status });
  }

  incrementRateLimitBlock(tenantId: string) {
    this.rateLimitBlocksCounter.inc({ tenantId });
  }

  incrementAuthEvent(event: 'register' | 'login' | 'mfa_challenge' | 'mfa_verified') {
    this.authEventsCounter.inc({ event });
  }

  incrementDualWriteFailure(entity: 'tenant' | 'user') {
    this.dualWriteFailureCounter.inc({ entity });
  }
} 