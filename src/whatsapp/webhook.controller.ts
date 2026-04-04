/**
* File: src/whatsapp/webhook.controller.ts
* Module: whatsapp
* Purpose: Receives and processes WhatsApp provider webhook events.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Verifies signatures, upserts contacts/messages, and records consent events.
* - Uses TypeORM repositories for all persistence operations.
*/
import { Body, Controller, Get, Headers, Logger, Post, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { Request } from 'express';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import { AutomationsService } from '../automations/automations.service';
import {
  ConsentLogOrmEntity,
  ContactOrmEntity,
  ConversationOrmEntity,
  MessageDirection,
  MessageOrmEntity,
  MessageStatus,
  UserOrmEntity,
} from '../database/entities';
import { MetricsService } from '../metrics/metrics.service';
import { WhatsAppOnboardingService } from '../modules/whatsapp-onboarding';

@ApiTags('WhatsApp')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly metrics: MetricsService,
    private readonly automations: AutomationsService,
    private readonly onboardingService: WhatsAppOnboardingService,
  ) {}

  private async resolveTenantIdFromWebhook(value: any): Promise<string | undefined> {
    try {
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (phoneNumberId) {
        // Prefer DB-backed mapping from onboarding assignment domain.
        const tenantIdFromDb = await this.onboardingService.resolveTenantByPhoneNumberId(
          phoneNumberId,
        );
        if (tenantIdFromDb) {
          return tenantIdFromDb;
        }
      }
      const mapRaw = process.env.WHATSAPP_TENANT_PHONE_MAP;
      if (!phoneNumberId || !mapRaw) {
        this.logger.warn('Tenant mapping missing: phone_number_id or WHATSAPP_TENANT_PHONE_MAP');
        return undefined;
      }
      const map = JSON.parse(mapRaw) as Record<string, string>;
      const tenantId = map[phoneNumberId];
      if (!tenantId) {
        this.logger.warn(`No tenant mapped for phone_number_id=${phoneNumberId}`);
      }
      return tenantId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed parsing WHATSAPP_TENANT_PHONE_MAP: ${message}`);
      return undefined;
    }
  }

  private isProductionWebhookStrict(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private logWebhookReceipt(signature: string | undefined, entryCount: number) {
    const preview = this.isProductionWebhookStrict()
      ? `entries=${entryCount} signaturePresent=${Boolean(signature)}`
      : `entries=${entryCount}`;
    this.logger.log(`WhatsApp webhook received (${preview})`);
  }

  private async ensureSystemUserId(tenantId?: string): Promise<string | undefined> {
    if (!tenantId) {
      return undefined;
    }

    const userRepository = this.dataSource.getRepository(UserOrmEntity);
    const existing = await userRepository.findOne({
      where: { tenantId },
      select: { id: true },
    });
    if (existing?.id) {
      return existing.id;
    }

    try {
      const hashed = await bcrypt.hash(Math.random().toString(36).slice(2), 10);
      const created = await userRepository.save(
        userRepository.create({
          email: `system+${tenantId}@local`,
          password: hashed,
          tenantId,
        }),
      );
      return created.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create system user for tenant ${tenantId}: ${message}`);
      return undefined;
    }
  }

  @Get()
  @ApiOperation({ summary: 'WhatsApp webhook verification' })
  @ApiOkResponse({ description: 'Verification responded' })
  @ApiQuery({ name: 'hub.mode', required: false })
  @ApiQuery({ name: 'hub.verify_token', required: false })
  @ApiQuery({ name: 'hub.challenge', required: false })
  async verifyWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN;
    if (this.isProductionWebhookStrict() && !expected) {
      this.logger.error('WHATSAPP_VERIFY_TOKEN is required in production for webhook verification');
      this.metrics.incrementWhatsAppWebhookEvent('rejected_misconfigured');
      return 'Forbidden';
    }
    if (mode === 'subscribe' && token && expected && token === expected) {
      this.logger.log('Webhook verified successfully');
      return challenge ?? 'OK';
    }
    this.logger.warn('Webhook verification failed');
    return 'Forbidden';
  }

  @Post()
  @ApiOperation({ summary: 'WhatsApp webhook receiver' })
  @ApiOkResponse({ description: 'Webhook accepted' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature?: string,
    @Req() req?: Request & { rawBody?: string },
  ) {
    try {
      const contactRepository = this.dataSource.getRepository(ContactOrmEntity);
      const conversationRepository = this.dataSource.getRepository(ConversationOrmEntity);
      const messageRepository = this.dataSource.getRepository(MessageOrmEntity);
      const consentLogRepository = this.dataSource.getRepository(ConsentLogOrmEntity);

      const secret = process.env.WHATSAPP_APP_SECRET;
      const strict = this.isProductionWebhookStrict();

      if (strict) {
        if (!secret) {
          this.logger.error('WHATSAPP_APP_SECRET is required in production to accept webhooks');
          this.metrics.incrementWhatsAppWebhookEvent('rejected_misconfigured');
          return { ok: false };
        }
        if (!signature) {
          this.logger.warn('Missing x-hub-signature-256 in production');
          this.metrics.incrementWhatsAppWebhookEvent('rejected_unverified');
          return { ok: false };
        }
      }

      if (secret && signature) {
        const raw = req?.rawBody ?? JSON.stringify(body);
        const hmac = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
        const expectedSig = `sha256=${hmac}`;
        if (expectedSig !== signature) {
          this.logger.warn('Invalid webhook signature');
          this.metrics.incrementWhatsAppWebhookEvent('invalid_signature');
          return { ok: false };
        }
      }

      const entries = body?.entry ?? [];
      this.logWebhookReceipt(signature, Array.isArray(entries) ? entries.length : 0);
      for (const entry of entries) {
        const changes = entry?.changes ?? [];
        for (const change of changes) {
          const value = change?.value || {};
          const tenantId = await this.resolveTenantIdFromWebhook(value);
          await this.onboardingService.markWebhookVerified(value?.metadata?.phone_number_id);
          const messages = value?.messages || [];
          const statuses = value?.statuses || [];

          for (const messagePayload of messages) {
            const waId = messagePayload?.id;
            const from = messagePayload?.from;
            const text =
              messagePayload?.text?.body ||
              messagePayload?.interactive?.list_reply?.title ||
              messagePayload?.interactive?.button_reply?.title ||
              '';

            let contact: ContactOrmEntity | null = null;
            if (from && tenantId) {
              const userId = await this.ensureSystemUserId(tenantId);
              if (userId) {
                contact = await contactRepository.findOne({
                  where: { tenantId, phone: from },
                });
                if (!contact) {
                  contact = await contactRepository.save(
                    contactRepository.create({ phone: from, userId, tenantId }),
                  );
                }
              } else {
                this.logger.warn(`Skipping contact creation: no user found for tenant ${tenantId}`);
              }
            }

            const conversation =
              contact &&
              ((await conversationRepository.findOne({
                where: { contactId: contact.id, tenantId },
                order: { lastMessage: 'DESC' },
              })) ||
                (await conversationRepository.save(
                  conversationRepository.create({ contactId: contact.id, tenantId }),
                )));

            if (waId) {
              const existing = await messageRepository.findOne({ where: { waMessageId: waId } });
              if (existing) {
                await messageRepository.update(
                  { id: existing.id },
                  {
                    content: text,
                    direction: MessageDirection.INBOUND,
                    from,
                    tenantId,
                    conversationId: conversation?.id,
                  },
                );
              } else {
                await messageRepository.save(
                  messageRepository.create({
                    content: text,
                    status: MessageStatus.SENT,
                    direction: MessageDirection.INBOUND,
                    from,
                    waMessageId: waId,
                    conversationId: conversation?.id,
                    tenantId,
                  }),
                );
              }
            } else {
              await messageRepository.save(
                messageRepository.create({
                  content: text,
                  status: MessageStatus.SENT,
                  direction: MessageDirection.INBOUND,
                  from,
                  conversationId: conversation?.id,
                  tenantId,
                }),
              );
            }

            if (conversation) {
              await conversationRepository.update({ id: conversation.id }, { lastMessage: new Date() });
            }

            try {
              const features = process.env;
              const lower = (text || '').trim().toLowerCase();
              if (tenantId && from && lower) {
                if (!features.FEATURE_COMPLIANCE_ENABLED || features.FEATURE_COMPLIANCE_ENABLED === 'true') {
                  if ((lower === 'stop' || lower === 'unsubscribe') && contact?.id) {
                    await consentLogRepository.save(
                      consentLogRepository.create({
                        tenantId,
                        contactId: contact.id,
                        type: 'OPT_OUT',
                        channel: 'WHATSAPP',
                      }),
                    );
                    await contactRepository.update({ id: contact.id }, { subscribed: false });
                  } else if ((lower === 'start' || lower === 'subscribe') && contact?.id) {
                    await consentLogRepository.save(
                      consentLogRepository.create({
                        tenantId,
                        contactId: contact.id,
                        type: 'OPT_IN',
                        channel: 'WHATSAPP',
                      }),
                    );
                    await contactRepository.update({ id: contact.id }, { subscribed: true });
                  }
                }
                if (!features.FEATURE_AUTOMATIONS_ENABLED || features.FEATURE_AUTOMATIONS_ENABLED === 'true') {
                  await this.automations.handleInboundKeyword(tenantId, from, lower);
                }
              }
            } catch {}
          }

          for (const statusPayload of statuses) {
            const waId = statusPayload?.id;
            const status = statusPayload?.status?.toUpperCase();
            if (waId) {
              await messageRepository.update(
                { waMessageId: waId },
                { status: status === 'DELIVERED' || status === 'READ' ? MessageStatus.SENT : MessageStatus.FAILED },
              );
              const message = await messageRepository.findOne({ where: { waMessageId: waId } });
              if (message?.campaignId) {
                this.metrics.incrementCampaignDelivery(
                  message.campaignId,
                  (status === 'READ' ? 'READ' : status === 'DELIVERED' ? 'DELIVERED' : 'FAILED') as
                    | 'DELIVERED'
                    | 'READ'
                    | 'FAILED',
                );
              }
            }
          }
        }
      }
      this.metrics.incrementWhatsAppWebhookEvent('accepted');
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook processing error: ${message}`);
      this.metrics.incrementWhatsAppWebhookEvent('failed');
      return { ok: false };
    }
  }
}
