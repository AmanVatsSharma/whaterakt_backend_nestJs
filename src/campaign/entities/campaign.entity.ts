import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CampaignType, CampaignStatus } from '@prisma/client';

@ObjectType()
export class Campaign {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => CampaignType)
  type: CampaignType;

  @Field(() => CampaignStatus)
  status: CampaignStatus;

  @Field({ nullable: true })
  scheduledAt?: Date;

  @Field()
  createdAt: Date;
} 