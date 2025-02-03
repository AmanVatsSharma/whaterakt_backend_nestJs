import { Process } from '../core/decorators/queue-process.decorator';
import { Job } from 'bull';
import { WhatsAppService } from './whatsapp.service';
import { MetricsService } from '../metrics/metrics.service';

export class WhatsAppProcessor {
  constructor(
    private readonly whatsapp: WhatsAppService,
    private readonly metrics: MetricsService
  ) {}

  @Process('message')
  async handleMessage(job: Job<{ tenantId: string; payload: any }>) {
    await this.whatsapp.setTenantId(job.data.tenantId);
    const result = await this.whatsapp.sendMessage(job.data.payload);
    this.metrics.incrementTenantMessage(job.data.tenantId);
    return result;
  }
} 