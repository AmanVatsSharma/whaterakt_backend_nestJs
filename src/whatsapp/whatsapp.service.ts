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
      const jobData = { tenantId: this.tenantId, payload };
      if (process.env.REDIS_HOST) {
        await this.messageQueue.add('message', jobData);
        return { success: true, queued: true };
      }
      // Fallback: send immediately without queue
      const result = await this.adapter.sendMessage(payload, this.tenantId);
      return { success: true, queued: false, result };
    } catch (e) {
      this.logger.error(`Failed to queue message: ${e}`);
      return { success: false };
    }
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