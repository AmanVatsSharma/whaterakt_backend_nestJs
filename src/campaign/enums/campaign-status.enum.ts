import { registerEnumType } from '@nestjs/graphql';
import { CampaignStatus } from '@prisma/client';

registerEnumType(CampaignStatus, {
  name: 'CampaignStatus',
  description: 'The status of a campaign',
});

export { CampaignStatus }; 