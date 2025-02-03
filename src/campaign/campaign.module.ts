import { Module } from '@nestjs/common';
import { CampaignResolver } from './campaign.resolver';
import { CampaignService } from './campaign.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [CampaignResolver, CampaignService, PrismaService],
  exports: [CampaignService],
})
export class CampaignModule {}
