import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { CampaignStatus } from './enums/campaign-status.enum';
import { UseGuards } from '@nestjs/common';
import { TenantGuard } from '../core/guards/tenant.guard';
import { Tenant } from '../tenant/entities/tenant.entity';
import { CampaignService } from './campaign.service';
import { PrismaService } from 'src/prisma.service';

@Resolver(() => Campaign)
@UseGuards(TenantGuard)
export class CampaignResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignService: CampaignService
  ) {}

  @Query(() => [Campaign])
  async campaigns() {
    return this.prisma.campaign.findMany({
      include: { messages: true },
    });
  }

  @Mutation(() => Campaign)
  async createCampaign(
    @Args('input') input: CreateCampaignInput,
    @Context() context: { tenant: Tenant }
  ) {
    return this.campaignService
      .setTenantId(context.tenant.id)
      .createCampaign(input);
  }
}
