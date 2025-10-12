import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma.service';
import { TenantAwareService } from '../core/services/tenant-aware.service';

@Injectable()
export class AIService extends TenantAwareService {
  private readonly apiUrl = this.config.get('DEEPSEEK_API_URL');
  private readonly apiKey = this.config.get('DEEPSEEK_API_KEY');

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    protected readonly prisma: PrismaService,
  ) {
    super(prisma);
  }

  async generateReplySuggestion(context: string) {
    try {
      const response = await firstValueFrom(
        this.http.post(this.apiUrl, {
          prompt: `Generate a concise, safe WhatsApp reply for: ${context}. 120 chars max, no PII.`,
          max_tokens: 60,
          temperature: 0.5,
        }, {
          headers: {
            Authorization: this.apiKey ? `Bearer ${this.apiKey}` : undefined,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        })
      );

      const data: any = response.data ?? {};
      const suggestion = data?.choices?.[0]?.text || data?.reply || data?.content || '';
      return String(suggestion).trim().slice(0, 160);
    } catch (e: any) {
      // Graceful fallback
      return 'Thanks for reaching out! We will get back to you shortly.';
    }
  }
}

// Backward-compatible alias for tests
export { AIService as AiService };
