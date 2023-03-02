import { registerEnumType } from '@nestjs/graphql';
import { CampaignType } from '@prisma/client';

registerEnumType(CampaignType, {
  name: 'CampaignType',
  description: 'The type of campaign',
});

export { CampaignType }; 