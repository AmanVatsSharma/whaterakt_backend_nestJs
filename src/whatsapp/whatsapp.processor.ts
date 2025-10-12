import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MetricsService } from '../metrics/metrics.service';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { PrismaService } from 'src/prisma.service';

@Processor('messages')
export class WhatsAppProcessor {
  constructor(
    private readonly adapter: WhatsAppAdapter,
    private readonly metrics: MetricsService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('message')
  async handleMessage(job: Job<{ tenantId: string; payload: any; campaignId?: string }>) {
    const { tenantId, payload, campaignId } = job.data || { tenantId: undefined, payload: undefined, campaignId: undefined };
    const { campaignId: _omit, ...waPayload } = payload || {};
    const result = await this.adapter.sendMessage(waPayload, tenantId);

    try {
      const waId = (result as any)?.messages?.[0]?.id;
      // Persist outbound message row for traceability
      await this.prisma.message.create({
        data: {
          waMessageId: waId,
          content: waPayload?.text?.body || waPayload?.interactive?.body?.text || waPayload?.template?.name || JSON.stringify(waPayload).slice(0, 240),
          status: waId ? 'SENT' : 'FAILED',
          direction: 'OUTBOUND',
          to: waPayload?.to,
          tenantId,
          campaignId: campaignId,
        },
      });
    } catch (e) {
      // swallow persistence errors to not fail job retry
    }

    if (tenantId) this.metrics.incrementTenantMessage(tenantId);
    return result;
  }
}