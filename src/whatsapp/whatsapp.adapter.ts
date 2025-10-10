import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppAdapter {
  private readonly logger = new Logger(WhatsAppAdapter.name);

  constructor(private readonly http: HttpService) {}

  async sendMessage(payload: any, tenantId?: string) {
    try {
      // Placeholder for Meta WhatsApp Cloud API integration
      const response = await firstValueFrom(this.http.post(process.env.WHATSAPP_API_URL!, payload, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'X-Tenant-ID': tenantId ?? '',
        },
      }));
      return response.data ?? { success: true };
    } catch (e: any) {
      this.logger.error(`WhatsApp API error: ${e?.message}`);
      return { success: false };
    }
  }
}
