import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CampaignType, CampaignStatus } from '@prisma/client';

@ObjectType({ description: 'A campaign aggregates and schedules WhatsApp messages' })
export class Campaign {
  @Field(() => ID, { description: 'Unique campaign identifier' })
  id: string;

  @Field({ description: 'Campaign name' })
  name: string;

  @Field(() => CampaignType, { description: 'Campaign type (BROADCAST, TRIGGERED, SEQUENCE)' })
  type: CampaignType;

  @Field(() => CampaignStatus, { description: 'Current campaign status' })
  status: CampaignStatus;

  @Field({ nullable: true, description: 'Planned schedule datetime (if any)' })
  scheduledAt?: Date;

  @Field({ description: 'Creation timestamp' })
  createdAt: Date;
} 