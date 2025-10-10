import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MetricsService } from '../metrics/metrics.service';
import { WhatsAppAdapter } from './whatsapp.adapter';

@Processor('messages')
export class WhatsAppProcessor {
  constructor(
    private readonly adapter: WhatsAppAdapter,
    private readonly metrics: MetricsService,
  ) {}

  @Process('message')
  async handleMessage(job: Job<{ tenantId: string; payload: any }>) {
    const { tenantId, payload } = job.data || { tenantId: undefined, payload: undefined };
    const result = await this.adapter.sendMessage(payload, tenantId);
    if (tenantId) this.metrics.incrementTenantMessage(tenantId);
    return result;
  }
}