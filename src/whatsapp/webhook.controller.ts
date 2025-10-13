import { Controller, Post, Body, Headers, Logger, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@ApiTags('WhatsApp')
@ApiSecurity('TenantAuth')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);
  constructor(private readonly prisma: PrismaService, private readonly metrics: MetricsService) {}

  private resolveTenantIdFromWebhook(value: any): string | undefined {
    try {
      const phoneNumberId = value?.metadata?.phone_number_id;
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
    } catch (e: any) {
      this.logger.error(`Failed parsing WHATSAPP_TENANT_PHONE_MAP: ${e.message}`);
      return undefined;
    }
  }

  private async ensureSystemUserId(tenantId?: string): Promise<string | undefined> {
    if (!tenantId) return undefined;
    const existing = await this.prisma.user.findFirst({ where: { tenantId }, select: { id: true } });
    if (existing?.id) return existing.id;
    try {
      const hashed = await bcrypt.hash(Math.random().toString(36).slice(2), 10);
      const created = await this.prisma.user.create({
        data: {
          email: `system+${tenantId}@local`,
          password: hashed,
          tenantId,
        },
        select: { id: true },
      });
      return created.id;
    } catch (e) {
      this.logger.error(`Failed to create system user for tenant ${tenantId}: ${e.message}`);
      return undefined;
    }
  }

  @Get()
  @ApiOperation({ summary: 'WhatsApp webhook verification' })
  @ApiOkResponse({ description: 'Verification responded' })
  @ApiQuery({ name: 'hub.mode', required: false })
  @ApiQuery({ name: 'hub.verify_token', required: false })
  @ApiQuery({ name: 'hub.challenge', required: false })
  async verifyWebhook(@Query('hub.mode') mode?: string, @Query('hub.verify_token') token?: string, @Query('hub.challenge') challenge?: string) {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN;
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
  async handleWebhook(@Body() body: any, @Headers('x-hub-signature-256') signature?: string, @Req() req?: Request & { rawBody?: string }) {
    try {
      // Verify signature if secret present
      const secret = process.env.WHATSAPP_APP_SECRET;
      if (secret && signature) {
        const raw = (req as any)?.rawBody ? (req as any).rawBody : JSON.stringify(body);
        const hmac = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
        const expected = `sha256=${hmac}`;
        if (expected !== signature) {
          this.logger.warn('Invalid webhook signature');
          return { ok: false };
        }
      }

      this.logger.log(`Received WhatsApp webhook: ${JSON.stringify({ signature, body })}`);
      // Minimal parser for inbound messages and status updates
      const entries = body?.entry ?? [];
      for (const entry of entries) {
        const changes = entry?.changes ?? [];
        for (const change of changes) {
          const value = change?.value || {};
          const tenantId = this.resolveTenantIdFromWebhook(value);
          const messages = value?.messages || [];
          const statuses = value?.statuses || [];

          for (const m of messages) {
            const waId = m?.id;
            const from = m?.from;
            const text = m?.text?.body || m?.interactive?.list_reply?.title || m?.interactive?.button_reply?.title || '';

            // link to contact (requires valid tenant and a user in that tenant)
            let contact = null as any;
            if (from && tenantId) {
              const userId = await this.ensureSystemUserId(tenantId);
              if (userId) {
                contact = await this.prisma.contact.upsert({
                  where: { tenantId_phone: { tenantId, phone: from } },
                  update: {},
                  create: { phone: from, userId, tenantId },
                });
              } else {
                this.logger.warn(`Skipping contact creation: no user found for tenant ${tenantId}`);
              }
            }

            // link to conversation by contact within tenant
            const conversation = contact ? (await this.prisma.conversation.findFirst({
              where: { contactId: contact.id, tenantId: tenantId },
              orderBy: { lastMessage: 'desc' },
            }) || await this.prisma.conversation.create({
              data: { contactId: contact.id, tenantId: tenantId },
            })) : null;

            if (waId) {
              await this.prisma.message.upsert({
                where: { waMessageId: waId },
                update: { content: text, direction: 'INBOUND', from, tenantId: tenantId, conversationId: conversation?.id },
                create: { content: text, status: 'SENT', direction: 'INBOUND', from, waMessageId: waId, conversationId: conversation?.id, tenantId: tenantId },
              });
            } else {
              await this.prisma.message.create({
                data: { content: text, status: 'SENT', direction: 'INBOUND', from, conversationId: conversation?.id, tenantId: tenantId },
              });
            }
          }

          for (const s of statuses) {
            const waId = s?.id;
            const status = s?.status?.toUpperCase();
            if (waId) {
              await this.prisma.message.updateMany({
                where: { waMessageId: waId },
                data: { status: status === 'DELIVERED' || status === 'READ' ? 'SENT' : 'FAILED' },
              });
              const msg = await this.prisma.message.findFirst({ where: { waMessageId: waId } });
              if (msg?.campaignId) this.metrics.incrementCampaignDelivery(msg.campaignId, (status === 'READ' ? 'READ' : status === 'DELIVERED' ? 'DELIVERED' : 'FAILED') as any);
            }
          }
        }
      }
      return { ok: true };
    } catch (e: any) {
      this.logger.error(`Webhook processing error: ${e.message}`);
      return { ok: false };
    }
  }
}
