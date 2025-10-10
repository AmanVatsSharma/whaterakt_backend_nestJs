import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma.service';
import { TenantAwareService } from '../core/services/tenant-aware.service';

@Injectable()
export class AIService extends TenantAwareService {
  private readonly apiUrl = this.config.get('DEEPSEEK_API_URL');

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    protected readonly prisma: PrismaService,
  ) {
    super(prisma);
  }

  async generateReplySuggestion(context: string) {
    const response = await firstValueFrom(
      this.http.post(this.apiUrl, {
        prompt: `Generate WhatsApp reply for: ${context}`,
        max_tokens: 60,
      })
    );

    const data: any = response.data ?? {};
    const suggestion = data?.choices?.[0]?.text || data?.reply || data?.content || '';
    return String(suggestion).trim();
  }
}
