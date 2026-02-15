/**
 * File: src/modules/integrations/controllers/integrations.controller.ts
 * Module: integrations
 * Purpose: REST API for frontend settings integration operations.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Works with tenant middleware for tenant-aware API key rotation.
 * - Read validateWebhook and rotateApiKey first.
 */

import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ValidateWebhookDto } from '../dtos/validate-webhook.dto';
import { IntegrationsService } from '../services/integrations.service';
import { WorkspaceSettingsDto } from '../dtos/workspace-settings.dto';

type RequestWithTenant = Request & {
  tenant?: { id?: string };
};

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  private resolveTenantId(request: RequestWithTenant, tenantHeader?: string) {
    return (
      request.tenant?.id ||
      tenantHeader ||
      (request.headers['x-tenant-id'] as string | undefined)
    );
  }

  @Post('webhook/validate')
  validateWebhook(@Body() body: ValidateWebhookDto) {
    return this.integrationsService.validateWebhook(body?.url);
  }

  @Post('api-keys/generate')
  async rotateApiKey(
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    return this.integrationsService.generateApiKey(tenantId);
  }

  @Get('workspace-settings')
  async getWorkspaceSettings(
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    return this.integrationsService.getWorkspaceSettings(tenantId);
  }

  @Post('workspace-settings')
  async saveWorkspaceSettings(
    @Req() request: RequestWithTenant,
    @Body() body: WorkspaceSettingsDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader) || '';
    return this.integrationsService.saveWorkspaceSettings(tenantId, body);
  }
}

