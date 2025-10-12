import { Controller, Post, Body, Headers, Logger, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import * as crypto from 'crypto';

@ApiTags('WhatsApp')
@ApiSecurity('TenantAuth')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);
  constructor(private readonly prisma: PrismaService, private readonly metrics: MetricsService) {}

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
          const messages = value?.messages || [];
          const statuses = value?.statuses || [];

          for (const m of messages) {
            const waId = m?.id;
            const from = m?.from;
            const text = m?.text?.body || m?.interactive?.list_reply?.title || m?.interactive?.button_reply?.title || '';

            // link to contact
            const contact = from ? await this.prisma.contact.upsert({
              where: { phone: from },
              update: {},
              create: { phone: from, userId: 'system' },
            }) : null;

            // link to conversation by contact
            const conversation = contact ? await this.prisma.conversation.create({
              data: { contactId: contact.id },
            }) : null;

            if (waId) {
              await this.prisma.message.upsert({
                where: { waMessageId: waId },
                update: { content: text, direction: 'INBOUND', from },
                create: { content: text, status: 'SENT', direction: 'INBOUND', from, waMessageId: waId, conversationId: conversation?.id },
              });
            } else {
              await this.prisma.message.create({
                data: { content: text, status: 'SENT', direction: 'INBOUND', from, conversationId: conversation?.id },
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
