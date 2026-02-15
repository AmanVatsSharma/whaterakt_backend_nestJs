/**
* File: src/template/template.service.ts
* Module: template
* Purpose: Syncs approved WhatsApp templates into local storage.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses TypeORM repository upsert semantics via find/save.
* - Stores full provider payload in content for troubleshooting.
*/
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { TemplateCategory, TemplateOrmEntity, TemplateStatus } from '../database/entities/template.entity';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
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
      const repository = this.dataSource.getRepository(TemplateOrmEntity);
      for (const t of templates) {
        const existing = await repository.findOne({ where: { id: t.id } });
        const template = repository.create({
          id: t.id,
          name: t.name,
          content: JSON.stringify(t),
          category: TemplateCategory.MARKETING,
          status: (t.status || TemplateStatus.APPROVED) as TemplateStatus,
          userId: existing?.userId ?? null,
          tenantId,
          createdAt: existing?.createdAt,
        });
        await repository.save(template);
      }
      return { count: templates.length };
    } catch (e: any) {
      this.logger.error(`Template sync failed: ${e.message}`);
      return { count: 0 };
    }
  }

  async listTemplates(tenantId: string) {
    if (!tenantId) {
      return [];
    }
    const repository = this.dataSource.getRepository(TemplateOrmEntity);
    const templates = await repository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      content: template.content,
      category: template.category,
      status: template.status,
      createdAt: template.createdAt?.toISOString?.() || null,
    }));
  }
}
