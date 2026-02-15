/**
* File: src/whatsapp/whatsapp.service.ts
* Module: whatsapp
* Purpose: Outbound WhatsApp orchestration and compliance checks.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Validates template/session/subscription constraints before queueing.
* - Uses per-request tenantId arguments to avoid shared mutable state.
*/
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, MoreThan } from 'typeorm';
import { Retry } from '../core/decorators/retry.decorator';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { ContactOrmEntity, MessageDirection, MessageOrmEntity, TemplateOrmEntity, TemplateStatus } from '../database/entities';
import { MetricsService } from '../metrics/metrics.service';
import { WhatsAppOnboardingService } from '../modules/whatsapp-onboarding';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectQueue('messages') private readonly messageQueue: Queue,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly adapter: WhatsAppAdapter,
    private readonly onboardingService: WhatsAppOnboardingService,
    private readonly metrics: MetricsService,
  ) {}

  @Retry(3, 1000)
  async sendMessage(payload: any, tenantId?: string) {
    try {
      if (tenantId) {
        const readiness = await this.onboardingService.isTenantSendReady(tenantId);
        if (!readiness.ready) {
          this.logger.warn(
            `Blocked send due onboarding gate tenant=${tenantId} reason=${readiness.reason}`,
          );
          this.metrics.incrementWhatsAppSendFailure(
            readiness.reason || 'channel_not_ready',
          );
          return {
            success: false,
            blocked: true,
            reason: readiness.reason || 'channel_not_ready',
          };
        }
      }
      if (tenantId) {
        const perTenantDailyLimit = Number(
          process.env.WHATSAPP_TENANT_DAILY_SEND_LIMIT || '0',
        );
        if (perTenantDailyLimit > 0) {
          const sentInWindow = await this.dataSource.getRepository(MessageOrmEntity).count({
            where: {
              tenantId,
              direction: MessageDirection.OUTBOUND,
              createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
            },
          });
          if (sentInWindow >= perTenantDailyLimit) {
            this.logger.warn(`Blocked send daily cap tenant=${tenantId} cap=${perTenantDailyLimit}`);
            this.metrics.incrementWhatsAppSendFailure('daily_send_limit_reached');
            return { success: false, blocked: true, reason: 'daily_send_limit_reached' };
          }
        }
      }
      // Block sends to unsubscribed contacts when to maps to a contact
      if (tenantId && payload?.to) {
        const existing = await this.dataSource.getRepository(ContactOrmEntity).findOne({
          where: { tenantId, phone: payload.to },
        });
        if (existing && existing.subscribed === false) {
          this.logger.warn(`Blocked send to unsubscribed contact ${payload.to} tenant=${tenantId}`);
          this.metrics.incrementWhatsAppSendFailure('unsubscribed');
          return { success: false, blocked: true, reason: 'unsubscribed' };
        }
      }
      // Validate template usage for approved templates
      if (payload?.templateName && tenantId) {
        await this.validateTemplate(payload.templateName, tenantId);
      }
      // Enforce 24h session for non-template messages based on last inbound
      if (!payload?.templateName && !payload?.template && payload?.type !== 'template' && tenantId && payload?.to) {
        const lastInbound = await this.dataSource.getRepository(MessageOrmEntity).findOne({
          where: { tenantId, from: payload.to, direction: MessageDirection.INBOUND },
          order: { createdAt: 'DESC' },
        });
        const within24h = lastInbound ? (Date.now() - new Date(lastInbound.createdAt).getTime()) <= 24 * 60 * 60 * 1000 : false;
        if (!within24h) {
          this.logger.warn(`Blocked non-template message outside 24h window to ${payload.to}`);
          this.metrics.incrementWhatsAppSendFailure('session_expired');
          return { success: false, blocked: true, reason: 'session_expired' };
        }
      }
      // Normalize payload into WhatsApp Cloud API format, including optional quick replies
      const normalized = this.buildMessagePayload(payload);
      // Ensure required Graph API key: phone_number_id can be provided or resolved in adapter
      if (payload?.phone_number_id) {
        (normalized as any).phone_number_id = payload.phone_number_id;
      }
      const jobData = { tenantId, payload: normalized, campaignId: payload?.campaignId };
      if (process.env.REDIS_HOST) {
        await this.messageQueue.add('message', jobData);
        return { success: true, queued: true };
      }
      // Fallback: send immediately without queue
      const result = await this.adapter.sendMessage(normalized, tenantId);
      return { success: true, queued: false, result };
    } catch (e) {
      this.logger.error(`Failed to queue message: ${e}`);
      this.metrics.incrementWhatsAppSendFailure('queue_or_adapter_error');
      return { success: false };
    }
  }

  private buildMessagePayload(input: any) {
    // Media message support
    if (input?.mediaType && input?.mediaUrl) {
      const base = {
        messaging_product: 'whatsapp',
        to: input.to,
        type: input.mediaType,
      } as any;
      base[input.mediaType] = {
        link: input.mediaUrl,
        caption: input.mediaCaption,
        filename: input.mediaFilename,
      };
      return base;
    }

    // If quickReplies provided, build interactive reply buttons (max 3)
    if (Array.isArray(input?.quickReplies) && input.quickReplies.length > 0) {
      const buttons = input.quickReplies.slice(0, 3).map((title: string, index: number) => ({
        type: 'reply',
        reply: { id: `qr_${index + 1}`, title },
      }));
      return {
        messaging_product: 'whatsapp',
        to: input.to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: input.message || 'Choose an option:' },
          action: { buttons },
        },
      };
    }

    // If listSections provided, build interactive list payload
    if (Array.isArray(input?.listSections) && input.listSections.length > 0) {
      return {
        messaging_product: 'whatsapp',
        to: input.to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: input.message || 'Choose an option:' },
          action: {
            button: 'Select',
            sections: input.listSections.map((s: any) => ({
              title: s.title,
              rows: s.rows.map((r: any) => ({ id: r.id, title: r.title, description: r.description }))
            }))
          }
        }
      };
    }

    // If templateName provided, build template payload
    if (input?.templateName) {
      return {
        messaging_product: 'whatsapp',
        to: input.to,
        type: 'template',
        template: {
          name: input.templateName,
          language: { code: 'en_US' },
          components: input.templateParams ? [
            {
              type: 'body',
              parameters: input.templateParams.map((p: string) => ({ type: 'text', text: p }))
            }
          ] : undefined,
        }
      };
    }

    // Default simple text message
    return {
      messaging_product: 'whatsapp',
      to: input.to,
      type: 'text',
      text: { body: String(input.message || '') },
    };
  }

  async validateTemplate(templateName: string, tenantId: string) {
    const template = await this.dataSource.getRepository(TemplateOrmEntity).findOne({
      where: {
        name: templateName,
        tenantId,
        status: TemplateStatus.APPROVED,
      }
    });
    
    if (!template) {
      throw new BadRequestException('Invalid template');
    }
    return template;
  }
} 

// Backward-compatible export for tests referencing old name
export { WhatsAppService as WhatsappService };