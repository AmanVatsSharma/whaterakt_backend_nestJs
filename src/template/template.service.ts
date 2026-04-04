/**
 * File: src/template/template.service.ts
 * Module: template
 * Purpose: Syncs approved WhatsApp templates into local storage.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-04-04
 * Notes:
 * - Template list URL matches Graph send path: {graph}/{version}/{phoneNumberId}/message_templates.
 * - Optional WHATSAPP_API_URL (non-Graph) for local mocks implementing /message_templates.
 */
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { TemplateCategory, TemplateOrmEntity, TemplateStatus } from '../database/entities/template.entity';
import { WhatsAppOnboardingService } from '../modules/whatsapp-onboarding/services/whatsapp-onboarding.service';

type CreateTemplatePayload = {
  name: string;
  content: string;
  category?: string;
  status?: string;
};

type UpdateTemplatePayload = {
  name?: string;
  content?: string;
  category?: string;
  status?: string;
};

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly onboardingService: WhatsAppOnboardingService,
  ) {}

  /**
   * Resolves the message_templates list URL (Graph API or legacy mock base).
   */
  private async resolveMessageTemplatesListUrl(
    tenantId: string,
  ): Promise<string | null> {
    const legacy = this.config.get<string>('WHATSAPP_API_URL')?.trim();
    if (legacy && !legacy.includes('graph.facebook.com')) {
      const base = legacy.replace(/\/messages$/, '').replace(/\/send$/, '');
      return `${base}/message_templates`;
    }

    const graphBase =
      this.config.get<string>('WHATSAPP_GRAPH_BASE') ||
      'https://graph.facebook.com';
    const graphVersion =
      this.config.get<string>('WHATSAPP_GRAPH_VERSION') || 'v20.0';
    let phoneNumberId =
      (await this.onboardingService.resolvePhoneNumberIdByTenant(tenantId)) ||
      this.config.get<string>('WHATSAPP_DEFAULT_PHONE_NUMBER_ID');

    if (!phoneNumberId) {
      try {
        const mapRaw = process.env.WHATSAPP_TENANT_PHONE_MAP;
        if (tenantId && mapRaw) {
          const map = JSON.parse(mapRaw) as Record<string, string>;
          phoneNumberId = Object.entries(map).find(
            ([, t]) => t === tenantId,
          )?.[0];
        }
      } catch {
        /* ignore */
      }
    }

    if (!phoneNumberId) {
      this.logger.warn(
        'Template sync: no phone_number_id (onboarding, default, or env map)',
      );
      return null;
    }

    return `${graphBase}/${graphVersion}/${phoneNumberId}/message_templates`;
  }

  async syncTemplates(tenantId: string) {
    try {
      const token = this.config.get('WHATSAPP_ACCESS_TOKEN');
      const url = await this.resolveMessageTemplatesListUrl(tenantId);
      if (!url) {
        return { count: 0 };
      }
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

    return templates.map((template) => this.toTemplateView(template));
  }

  async createTemplate(
    tenantId: string,
    userId: string | null,
    payload: CreateTemplatePayload,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const name = String(payload?.name || '').trim();
    const content = String(payload?.content || '').trim();
    if (!name || !content) {
      throw new BadRequestException('Template name and content are required');
    }

    const repository = this.dataSource.getRepository(TemplateOrmEntity);
    const template = repository.create({
      id: `tpl_${randomUUID()}`,
      tenantId,
      userId: userId || null,
      name,
      content,
      category: this.parseCategory(payload.category),
      status: this.parseStatus(payload.status),
    });
    const saved = await repository.save(template);
    return this.toTemplateView(saved);
  }

  async updateTemplate(
    tenantId: string,
    templateId: string,
    payload: UpdateTemplatePayload,
  ) {
    const repository = this.dataSource.getRepository(TemplateOrmEntity);
    const existing = await repository.findOne({
      where: { id: templateId, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    const nextName = payload.name === undefined ? existing.name : payload.name.trim();
    const nextContent =
      payload.content === undefined ? existing.content : payload.content.trim();
    if (!nextName || !nextContent) {
      throw new BadRequestException('Template name and content cannot be empty');
    }

    const updated = repository.create({
      ...existing,
      name: nextName,
      content: nextContent,
      category:
        payload.category === undefined
          ? existing.category
          : this.parseCategory(payload.category),
      status:
        payload.status === undefined ? existing.status : this.parseStatus(payload.status),
    });
    const saved = await repository.save(updated);
    return this.toTemplateView(saved);
  }

  async setTemplateStatus(
    tenantId: string,
    templateId: string,
    status: string,
  ) {
    const repository = this.dataSource.getRepository(TemplateOrmEntity);
    const existing = await repository.findOne({
      where: { id: templateId, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Template not found');
    }
    existing.status = this.parseStatus(status);
    const saved = await repository.save(existing);
    return this.toTemplateView(saved);
  }

  async deleteTemplate(tenantId: string, templateId: string) {
    const repository = this.dataSource.getRepository(TemplateOrmEntity);
    const result = await repository.delete({ id: templateId, tenantId });
    return Number(result.affected || 0) > 0;
  }

  private parseStatus(status?: string) {
    const normalized = String(status || TemplateStatus.PENDING).toUpperCase();
    const values = Object.values(TemplateStatus);
    if (!values.includes(normalized as TemplateStatus)) {
      throw new BadRequestException(`Unsupported template status: ${status}`);
    }
    return normalized as TemplateStatus;
  }

  private parseCategory(category?: string) {
    const normalized = String(category || TemplateCategory.MARKETING).toUpperCase();
    const values = Object.values(TemplateCategory);
    if (!values.includes(normalized as TemplateCategory)) {
      throw new BadRequestException(`Unsupported template category: ${category}`);
    }
    return normalized as TemplateCategory;
  }

  private toTemplateView(template: TemplateOrmEntity) {
    return {
      id: template.id,
      name: template.name,
      content: template.content,
      category: template.category,
      status: template.status,
      createdAt: template.createdAt?.toISOString?.() || null,
    };
  }
}
