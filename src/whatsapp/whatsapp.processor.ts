/**
* File: src/whatsapp/whatsapp.processor.ts
* Module: whatsapp
* Purpose: Queue processor for outbound WhatsApp message jobs.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Persists outbound message audit records after provider calls.
* - Uses Redis idempotency keys to reduce duplicate sends on retries.
*/
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MetricsService } from '../metrics/metrics.service';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MessageDirection, MessageOrmEntity, MessageStatus } from '../database/entities';
import { WhatsAppOnboardingService } from '../modules/whatsapp-onboarding';

@Processor('messages')
export class WhatsAppProcessor {
  constructor(
    private readonly adapter: WhatsAppAdapter,
    private readonly metrics: MetricsService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: any,
    private readonly onboardingService: WhatsAppOnboardingService,
  ) {}

  @Process('message')
  async handleMessage(job: Job<{ tenantId: string; payload: any; campaignId?: string }>) {
    const { tenantId, payload, campaignId } = job.data || { tenantId: undefined, payload: undefined, campaignId: undefined };
    const { campaignId: _omit, ...waPayload } = payload || {};
    try {
      const waiting = await job.queue.getWaitingCount();
      this.metrics.setQueueDepth('messages', waiting);
    } catch {}
    if (tenantId) {
      const readiness = await this.onboardingService.isTenantSendReady(tenantId);
      if (!readiness.ready) {
        this.metrics.incrementWhatsAppSendFailure(readiness.reason || 'channel_not_ready');
        return { success: false, blocked: true, reason: readiness.reason } as any;
      }
    }
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

    // Attach per-message idempotency if not present
    if (!waPayload.idempotencyKey) {
      try {
        const base = JSON.stringify({ to: waPayload?.to, type: waPayload?.type, tenantId, ts: Date.now() });
        (waPayload as any).idempotencyKey = Buffer.from(base).toString('base64').slice(0, 48);
      } catch {}
    }

    const result = await this.adapter.sendMessage(waPayload, tenantId);

    try {
      const waId = (result as any)?.messages?.[0]?.id;
      // Persist outbound message row for traceability
      await this.dataSource.getRepository(MessageOrmEntity).save(
        this.dataSource.getRepository(MessageOrmEntity).create({
          waMessageId: waId,
          content: waPayload?.text?.body || waPayload?.interactive?.body?.text || waPayload?.template?.name || JSON.stringify(waPayload).slice(0, 240),
          status: waId ? MessageStatus.SENT : MessageStatus.FAILED,
          direction: MessageDirection.OUTBOUND,
          to: waPayload?.to,
          tenantId,
          campaignId: campaignId,
        }),
      );
    } catch (e) {
      // swallow persistence errors to not fail job retry
    }

    if (tenantId) this.metrics.incrementTenantMessage(tenantId);
    return result;
  }
}