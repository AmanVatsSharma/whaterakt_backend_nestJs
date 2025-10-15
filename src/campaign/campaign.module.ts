import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CampaignResolver } from './campaign.resolver';
import { CampaignService } from './campaign.service';
import { CampaignProcessor } from './campaign.processor';
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'campaigns', defaultJobOptions: { attempts: 3, backoff: { type: 'fixed', delay: 5000 }, removeOnFail: 500 } },
      { name: 'messages' },
    ),
  ],
  providers: [CampaignResolver, CampaignService, CampaignProcessor],
  exports: [CampaignService],
})
export class CampaignModule {}
