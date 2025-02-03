import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectQueue('messages') private readonly messageQueue: Queue,
  ) {}

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