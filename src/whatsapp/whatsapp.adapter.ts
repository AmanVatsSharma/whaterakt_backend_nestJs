import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppAdapter {
  private readonly logger = new Logger(WhatsAppAdapter.name);
  private readonly apiUrl: string;
  private readonly accessToken: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiUrl = this.config.get<string>('WHATSAPP_API_URL')!;
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN')!;
  }

  async sendMessage(payload: any, tenantId?: string) {
    try {
      const idBase = JSON.stringify({ to: payload?.to, type: payload?.type, ts: Date.now() });
      const idempotencyKey = payload?.idempotencyKey || Buffer.from(idBase).toString('base64').slice(0, 48);
      const response = await firstValueFrom(this.http.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'X-Tenant-ID': tenantId ?? '',
          'X-Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
      }));
      const data = response.data ?? { success: true };
      if (!data || data.error) {
        this.logger.error(`WhatsApp error: ${JSON.stringify(data?.error || data)}`);
        return { success: false, error: data?.error };
      }
      return data;
    } catch (e: any) {
      this.logger.error(`WhatsApp API error: ${e?.message}`);
      return { success: false, error: e?.message };
    }
  }
}
