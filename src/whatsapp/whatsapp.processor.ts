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
    // Capture outbound waMessageId if available in provider response
    const waId = (result as any)?.messages?.[0]?.id;
    if (waId && payload?.campaignId) {
      await (this as any).prisma?.message?.create?.({ data: { waMessageId: waId, status: 'SENT', direction: 'OUTBOUND', campaignId: payload.campaignId } });
    }
    if (tenantId) this.metrics.incrementTenantMessage(tenantId);
    return result;
  }
}