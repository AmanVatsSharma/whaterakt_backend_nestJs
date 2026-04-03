/**
 * File: src/modules/team-onboarding/controllers/team-onboarding.controller.ts
 * Module: team-onboarding
 * Purpose: REST endpoints for company/team onboarding operations.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Endpoints are tenant-aware through middleware/header fallback.
 * - Read inviteMember and acceptInvite for the onboarding flow.
 */

import { Body, Controller, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RestAuthGuard } from '../../../core/guards/rest-auth.guard';
import { RestTenantGuard } from '../../../core/guards/rest-tenant.guard';
import { AcceptTeamInviteDto } from '../dtos/accept-team-invite.dto';
import { CreateTeamDto } from '../dtos/create-team.dto';
import { InviteTeamMemberDto } from '../dtos/invite-team-member.dto';
import { TeamOnboardingService } from '../services/team-onboarding.service';

type RequestWithContext = Request & {
  tenant?: { id?: string };
  user?: { userId?: string };
};

@Controller('team-onboarding')
export class TeamOnboardingController {
  constructor(private readonly teamOnboardingService: TeamOnboardingService) {}

  @Post('team')
  @UseGuards(RestAuthGuard, RestTenantGuard)
  async createTeam(
    @Body() body: CreateTeamDto,
    @Req() request: RequestWithContext,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.teamOnboardingService.createTeam(tenantId, body);
  }

  @Post('invites')
  @UseGuards(RestAuthGuard, RestTenantGuard)
  async inviteMember(
    @Body() body: InviteTeamMemberDto,
    @Req() request: RequestWithContext,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    const invitedByUserId = request.user?.userId;
    return this.teamOnboardingService.inviteMember(tenantId, body, invitedByUserId);
  }

  @Post('invites/accept')
  async acceptInvite(@Body() body: AcceptTeamInviteDto) {
    return this.teamOnboardingService.acceptInvite(body);
  }

  @Get('members')
  @UseGuards(RestAuthGuard, RestTenantGuard)
  async listMembers(
    @Req() request: RequestWithContext,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('teamId') teamId?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.teamOnboardingService.listMembers(tenantId, teamId);
  }
}

