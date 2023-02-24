import { InputType, Field } from '@nestjs/graphql';
import { CampaignType } from '../enums';

@InputType()
export class CreateCampaignInput {
  @Field()
  name: string;
  
  @Field(() => CampaignType)
  type: CampaignType;

  @Field({ nullable: true })
  scheduledAt?: Date;

  @Field()
  userId: string;
} 