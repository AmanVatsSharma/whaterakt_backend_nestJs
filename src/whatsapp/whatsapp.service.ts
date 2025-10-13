import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Retry } from '../core/decorators/retry.decorator';
import { TenantAwareService } from '../core/services/tenant-aware.service';
import { WhatsAppAdapter } from './whatsapp.adapter';

@Injectable()
export class WhatsAppService extends TenantAwareService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectQueue('messages') private readonly messageQueue: Queue,
    protected readonly prisma: PrismaService,
    private readonly adapter: WhatsAppAdapter,
  ) {
    super(prisma);
  }

  @Retry(3, 1000)
  async sendMessage(payload: any) {
    try {
      // Validate template usage for approved templates
      if (payload?.templateName && this.tenantId) {
        await this.validateTemplate(payload.templateName, this.tenantId);
      }
      // Normalize payload into WhatsApp Cloud API format, including optional quick replies
      const normalized = this.buildMessagePayload(payload);
      const jobData = { tenantId: this.tenantId, payload: normalized };
      if (process.env.REDIS_HOST) {
        await this.messageQueue.add('message', jobData);
        return { success: true, queued: true };
      }
      // Fallback: send immediately without queue
      const result = await this.adapter.sendMessage(normalized, this.tenantId);
      return { success: true, queued: false, result };
    } catch (e) {
      this.logger.error(`Failed to queue message: ${e}`);
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
    const template = await this.prisma.template.findFirst({
      where: { 
        name: templateName,
        tenantId,
        status: 'APPROVED'
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