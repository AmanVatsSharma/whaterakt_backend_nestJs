import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Retry } from '../core/decorators/retry.decorator';
import { TenantAwareService } from '../core/tenant-aware.service';

@Injectable()
export class WhatsAppService extends TenantAwareService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectQueue('messages') private readonly messageQueue: Queue,
    protected readonly prisma: PrismaService,
  ) {
    super(prisma);
  }

  @Retry(3, 1000)
  async sendMessage(payload: any) {
    try {
      await this.messageQueue.add(payload);
      return { success: true };
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