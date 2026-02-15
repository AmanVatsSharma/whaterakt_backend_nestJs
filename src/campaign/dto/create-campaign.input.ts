import { InputType, Field } from '@nestjs/graphql';
import { CampaignType } from '../enums';

@InputType({ description: 'Create a campaign which will schedule/broadcast messages' })
export class CreateCampaignInput {
  @Field({ description: 'Human-friendly campaign name' })
  name: string;
  
  @Field(() => CampaignType, { description: 'Campaign type (BROADCAST, TRIGGERED, SEQUENCE)' })
  type: CampaignType;

  @Field({ nullable: true, description: 'Optional ISO datetime to schedule (immediate if omitted)' })
  scheduledAt?: Date;

  @Field({ nullable: true, description: 'User ID who owns this campaign (auto-derived from auth context when omitted)' })
  userId?: string;
} 