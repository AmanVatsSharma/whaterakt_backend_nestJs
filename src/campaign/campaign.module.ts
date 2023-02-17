import { Module } from '@nestjs/common';
import { CampaignResolver } from './campaign.resolver';
import { CampaignService } from './campaign.service';
@Module({
  providers: [CampaignResolver, CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
