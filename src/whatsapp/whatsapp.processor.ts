import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MetricsService } from '../metrics/metrics.service';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { PrismaService } from 'src/prisma.service';
import { Inject } from '@nestjs/common';
import * as crypto from 'crypto';

@Processor('messages')
export class WhatsAppProcessor {
  constructor(
    private readonly adapter: WhatsAppAdapter,
    private readonly metrics: MetricsService,
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  @Process('message')
  async handleMessage(job: Job<{ tenantId: string; payload: any; campaignId?: string }>) {
    const { tenantId, payload, campaignId } = job.data || { tenantId: undefined, payload: undefined, campaignId: undefined };
    const { campaignId: _omit, ...waPayload } = payload || {};
    // Idempotency dedupe: avoid duplicate sends of the same payload quickly retried
    const idemKey = (() => {
      try {
        const base = JSON.stringify({ to: waPayload?.to, type: waPayload?.type, body: waPayload?.text?.body, tmpl: waPayload?.template?.name, tenantId });
        return `idem:${tenantId || 'public'}:${crypto.createHash('sha1').update(base).digest('hex')}`;
      } catch {
        return undefined;
      }
    })();

    if (this.redis && idemKey) {
      try {
        const res = await this.redis.set(idemKey, '1', 'NX', 'EX', 300);
        if (res !== 'OK') {
          // Duplicate within window; skip provider call, but still record metric
          if (tenantId) this.metrics.incrementTenantMessage(tenantId);
          return { success: true, deduped: true } as any;
        }
      } catch {}
    }

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