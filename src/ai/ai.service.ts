import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { TenantAwareService } from '../core/services/tenant-aware.service';

@Injectable()
export class AIService extends TenantAwareService {
  private readonly apiUrl = this.config.get('DEEPSEEK_API_URL');

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService
  ) {
    super();
  }

  async generateReplySuggestion(context: string) {
    const { data } = await this.http.post(this.apiUrl, {
      prompt: `Generate WhatsApp reply for: ${context}`,
      max_tokens: 60
    }).toPromise();

    return data.choices[0].text.trim();
  }
}
