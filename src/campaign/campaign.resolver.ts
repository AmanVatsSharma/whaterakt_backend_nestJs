/**
* File: src/campaign/campaign.resolver.ts
* Module: campaign
* Purpose: GraphQL resolver for campaign query and creation.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses service-only data access for better module boundaries.
* - Applies tenant scoping on every operation.
*/
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { UseGuards } from '@nestjs/common';
import { TenantGuard } from '../core/guards/tenant.guard';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { RateLimitGuard } from '../core/guards/rate-limit.guard';
import { Tenant } from '../tenant/entities/tenant.entity';
import { CampaignService } from './campaign.service';

@Resolver(() => Campaign)
@UseGuards(GqlAuthGuard, TenantGuard, RateLimitGuard)
export class CampaignResolver {
  constructor(private readonly campaignService: CampaignService) {}

  @Query(() => [Campaign])
  async campaigns(@Context() context: { tenant: Tenant }) {
    return this.campaignService.findAll(context?.tenant?.id);
  }

  @Mutation(() => Campaign)
  async createCampaign(
    @Args('input') input: CreateCampaignInput,
    @Context() context: { tenant: Tenant }
  ) {
    return this.campaignService.createCampaign(input, context.tenant.id);
  }
}
