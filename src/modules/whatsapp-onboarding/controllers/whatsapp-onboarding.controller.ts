/**
 * File: src/modules/whatsapp-onboarding/controllers/whatsapp-onboarding.controller.ts
 * Module: whatsapp-onboarding
 * Purpose: Tenant and operator APIs for managed WhatsApp onboarding flows.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Tenant endpoints expose onboarding status and profile submission.
 * - Operator endpoints manage number inventory and channel assignments.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { RestAuthGuard } from '../../../core/guards/rest-auth.guard';
import { RestTenantGuard } from '../../../core/guards/rest-tenant.guard';
import { RequirePermissions } from '../../../rbac/rbac.decorator';
import { RbacGuard } from '../../../rbac/rbac.guard';
import { AssignWhatsAppNumberDto } from '../dtos/assign-whatsapp-number.dto';
import { CreateWhatsAppManagedNumberDto } from '../dtos/create-whatsapp-managed-number.dto';
import { SetWhatsAppObaStatusDto } from '../dtos/set-whatsapp-oba-status.dto';
import { SetWhatsAppChannelStatusDto } from '../dtos/set-whatsapp-channel-status.dto';
import { UpsertWhatsAppOnboardingDto } from '../dtos/upsert-whatsapp-onboarding.dto';
import { WhatsAppOnboardingService } from '../services/whatsapp-onboarding.service';

type RequestWithTenant = Request & {
  tenant?: { id?: string };
};

@Controller('whatsapp-onboarding')
@UseGuards(RestAuthGuard, RestTenantGuard)
export class WhatsAppOnboardingController {
  constructor(
    private readonly onboardingService: WhatsAppOnboardingService,
  ) {}

  @Get('status')
  async getStatus(
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    return this.onboardingService.getTenantStatus(tenantId);
  }

  @Post('request')
  async submitOnboardingRequest(
    @Req() request: RequestWithTenant,
    @Body() body: UpsertWhatsAppOnboardingDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    return this.onboardingService.submitTenantRequest(tenantId, body);
  }

  @Get('operator/numbers')
  @UseGuards(RbacGuard)
  @RequirePermissions({ resource: 'operator', action: 'manage' })
  async listManagedNumbers(@Query('status') status?: string) {
    return this.onboardingService.listManagedNumbers(status);
  }

  @Post('operator/numbers')
  @UseGuards(RbacGuard)
  @RequirePermissions({ resource: 'operator', action: 'manage' })
  async upsertManagedNumber(
    @Body() body: CreateWhatsAppManagedNumberDto,
    @Headers('x-operator-id') operatorId?: string,
  ) {
    return this.onboardingService.upsertManagedNumber(body, operatorId);
  }

  @Post('operator/assign')
  @UseGuards(RbacGuard)
  @RequirePermissions({ resource: 'operator', action: 'manage' })
  async assignManagedNumber(
    @Body() body: AssignWhatsAppNumberDto,
    @Headers('x-operator-id') operatorId?: string,
  ) {
    return this.onboardingService.assignManagedNumber(body, operatorId);
  }

  @Post('operator/channel-status')
  @UseGuards(RbacGuard)
  @RequirePermissions({ resource: 'operator', action: 'manage' })
  async setChannelStatus(
    @Body() body: SetWhatsAppChannelStatusDto,
    @Headers('x-operator-id') operatorId?: string,
  ) {
    return this.onboardingService.updateChannelStatus(body, operatorId);
  }

  @Post('operator/oba-status')
  @UseGuards(RbacGuard)
  @RequirePermissions({ resource: 'operator', action: 'manage' })
  async setObaStatus(
    @Body() body: SetWhatsAppObaStatusDto,
    @Headers('x-operator-id') operatorId?: string,
  ) {
    return this.onboardingService.updateObaStatus(body, operatorId);
  }

  @Get('operator/channels')
  @UseGuards(RbacGuard)
  @RequirePermissions({ resource: 'operator', action: 'manage' })
  async listChannels(@Query('status') status?: string) {
    return this.onboardingService.listChannels(status);
  }

  @Get('operator/funnel')
  @UseGuards(RbacGuard)
  @RequirePermissions({ resource: 'operator', action: 'manage' })
  async getFunnel(
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('scope') scope?: string,
  ) {
    if (scope === 'global') {
      return this.onboardingService.getOnboardingFunnel();
    }
    const tenantId = this.resolveTenantId(request, tenantHeader);
    return this.onboardingService.getOnboardingFunnel(tenantId);
  }

  private resolveTenantId(request: RequestWithTenant, tenantHeader?: string) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    return tenantId;
  }
}
