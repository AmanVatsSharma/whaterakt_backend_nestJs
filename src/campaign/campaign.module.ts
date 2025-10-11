import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CampaignResolver } from './campaign.resolver';
import { CampaignService } from './campaign.service';
import { CampaignProcessor } from './campaign.processor';
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'campaigns' },
      { name: 'messages' },
    ),
  ],
  providers: [CampaignResolver, CampaignService, CampaignProcessor],
  exports: [CampaignService],
})
export class CampaignModule {}
