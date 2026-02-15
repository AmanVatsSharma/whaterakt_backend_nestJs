/**
 * File: src/modules/integrations/services/integrations.service.ts
 * Module: integrations
 * Purpose: Business logic for webhook validation and tenant API key rotation.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Persists generated API keys against tenant when tenantId is present.
 * - Read validateWebhook then generateApiKey.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource } from 'typeorm';
import { TenantOrmEntity } from '../../../database/entities';
import { IntegrationResult } from '../entities/integration-result.entity';
import { WorkspaceSettingsDto } from '../dtos/workspace-settings.dto';

@Injectable()
export class IntegrationsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  validateWebhook(url: string): IntegrationResult {
    if (!url) {
      throw new BadRequestException('Webhook url is required');
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Webhook url is invalid');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BadRequestException('Webhook url must be http or https');
    }

    return {
      ok: true,
      message: 'Webhook url is valid',
      normalizedUrl: parsed.toString(),
    };
  }

  async generateApiKey(tenantId?: string) {
    const key = `sk_live_${randomBytes(16).toString('hex')}`;
    if (tenantId) {
      await this.dataSource.getRepository(TenantOrmEntity).update(
        { id: tenantId },
        { apiKey: key },
      );
    }
    return { key };
  }

  async getWorkspaceSettings(tenantId?: string) {
    if (!tenantId) {
      return {};
    }
    const tenant = await this.dataSource.getRepository(TenantOrmEntity).findOne({
      where: { id: tenantId },
      select: { id: true, featureFlags: true },
    });
    if (!tenant?.featureFlags || typeof tenant.featureFlags !== 'object') {
      return {};
    }
    const settings = (tenant.featureFlags as Record<string, unknown>).workspaceSettings;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return {};
    }
    return settings;
  }

  async saveWorkspaceSettings(tenantId: string, input: WorkspaceSettingsDto) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const repository = this.dataSource.getRepository(TenantOrmEntity);
    const tenant = await repository.findOne({
      where: { id: tenantId },
      select: { id: true, featureFlags: true },
    });
    if (!tenant) {
      throw new BadRequestException('tenant not found');
    }

    const existingFeatureFlags =
      tenant.featureFlags && typeof tenant.featureFlags === 'object'
        ? tenant.featureFlags
        : {};
    const existingSettings = (existingFeatureFlags as Record<string, unknown>).workspaceSettings;
    const mergedSettings = {
      ...(existingSettings && typeof existingSettings === 'object' ? existingSettings : {}),
      ...input,
    };

    await repository.update(
      { id: tenantId },
      {
        featureFlags: {
          ...existingFeatureFlags,
          workspaceSettings: mergedSettings,
        },
      },
    );
    return mergedSettings;
  }
}

