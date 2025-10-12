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
  async handleMessage(job: Job<{ tenantId: string; payload: any }>) {
    const { tenantId, payload } = job.data || { tenantId: undefined, payload: undefined };
    const result = await this.adapter.sendMessage(payload, tenantId);

    try {
      const waId = (result as any)?.messages?.[0]?.id;
      // Persist outbound message row for traceability
      await this.prisma.message.create({
        data: {
          waMessageId: waId,
          content: payload?.text?.body || payload?.interactive?.body?.text || payload?.template?.name || JSON.stringify(payload).slice(0, 240),
          status: waId ? 'SENT' : 'FAILED',
          direction: 'OUTBOUND',
          to: payload?.to,
          tenantId,
          campaignId: payload?.campaignId,
        },
      });
    } catch (e) {
      // swallow persistence errors to not fail job retry
    }

    if (tenantId) this.metrics.incrementTenantMessage(tenantId);
    return result;
  }
}