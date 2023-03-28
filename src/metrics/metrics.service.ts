import { Injectable, OnModuleInit } from '@nestjs/common';
import { Counter, Gauge, Registry } from 'prom-client';

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
  }

  onModuleInit() {
    // Clear default metrics registry
    this.registry.clear();
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
} 