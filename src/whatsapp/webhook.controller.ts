import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('WhatsApp')
@ApiSecurity('TenantAuth')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  @Post()
  @ApiOperation({ summary: 'WhatsApp webhook receiver' })
  @ApiOkResponse({ description: 'Webhook accepted' })
  async handleWebhook(@Body() body: any, @Headers('x-hub-signature-256') signature?: string) {
    this.logger.log(`Received WhatsApp webhook: ${JSON.stringify({ signature, body })}`);
    // TODO: verify signature, update message delivery status
    return { ok: true };
  }
}
