import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { WhatsAppOnboardingService } from '../modules/whatsapp-onboarding';

@Injectable()
export class WhatsAppAdapter {
  private readonly logger = new Logger(WhatsAppAdapter.name);
  private readonly accessToken: string;
  private readonly graphBase: string;
  private readonly graphVersion: string;
  private readonly defaultPhoneNumberId?: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly onboardingService: WhatsAppOnboardingService,
  ) {
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN')!;
    this.graphBase = this.config.get<string>('WHATSAPP_GRAPH_BASE') || 'https://graph.facebook.com';
    this.graphVersion = this.config.get<string>('WHATSAPP_GRAPH_VERSION') || 'v20.0';
    this.defaultPhoneNumberId = this.config.get<string>('WHATSAPP_DEFAULT_PHONE_NUMBER_ID');
  }

  private async resolvePhoneNumberId(
    tenantId?: string,
    explicit?: string,
  ): Promise<string | undefined> {
    if (explicit) return explicit;
    if (tenantId) {
      const mapped = await this.onboardingService.resolvePhoneNumberIdByTenant(tenantId);
      if (mapped) {
        return mapped;
      }
    }
    // Fallback to env map for emergency/manual overrides.
    try {
      const mapRaw = process.env.WHATSAPP_TENANT_PHONE_MAP;
      if (tenantId && mapRaw) {
        const map = JSON.parse(mapRaw) as Record<string, string>; // phone_number_id -> tenantId
        const found = Object.entries(map).find(([, t]) => t === tenantId)?.[0];
        if (found) return found;
      }
    } catch {}
    return this.defaultPhoneNumberId;
  }

  async sendMessage(payload: any, tenantId?: string) {
    try {
      const idBase = JSON.stringify({ to: payload?.to, type: payload?.type, ts: Date.now() });
      const idempotencyKey = payload?.idempotencyKey || Buffer.from(idBase).toString('base64').slice(0, 48);
      const phoneNumberId = await this.resolvePhoneNumberId(tenantId, payload?.phone_number_id);
      if (!phoneNumberId) {
        this.logger.error('Missing phone_number_id for WhatsApp send');
        return { success: false, error: 'missing_phone_number_id' } as any;
      }
      const url = `${this.graphBase}/${this.graphVersion}/${phoneNumberId}/messages`;
      const response = await firstValueFrom(this.http.post(url, payload, {
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
