import { Controller, Post, Body, Headers, Logger, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import * as crypto from 'crypto';

@ApiTags('WhatsApp')
@ApiSecurity('TenantAuth')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

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
      // TODO: parse events, update message status, persist inbound messages
      return { ok: true };
    } catch (e: any) {
      this.logger.error(`Webhook processing error: ${e.message}`);
      return { ok: false };
    }
  }
}
