import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async syncTemplates(tenantId: string) {
    try {
      const apiUrl = this.config.get('WHATSAPP_API_URL');
      const token = this.config.get('WHATSAPP_ACCESS_TOKEN');
      const url = `${apiUrl?.replace(/\/messages$/, '')}/message_templates`; // crude derive
      const resp = await firstValueFrom(this.http.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      }));
      const templates = resp.data?.data || [];
      for (const t of templates) {
        await this.prisma.template.upsert({
          where: { id: t.id },
          update: { name: t.name, content: JSON.stringify(t), status: (t.status || 'APPROVED') },
          create: { id: t.id, name: t.name, content: JSON.stringify(t), category: 'MARKETING', status: (t.status || 'APPROVED'), userId: tenantId, tenantId },
        });
      }
      return { count: templates.length };
    } catch (e: any) {
      this.logger.error(`Template sync failed: ${e.message}`);
      return { count: 0 };
    }
  }
}
