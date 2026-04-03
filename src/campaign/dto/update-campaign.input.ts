/**
* File: src/campaign/dto/update-campaign.input.ts
* Module: campaign
* Purpose: GraphQL input for updating campaign properties.
* Author: BharatERP
* created: 2026-02-16
*/
import { Field, InputType } from '@nestjs/graphql';
import { CampaignType } from '../enums';

@InputType({ description: 'Update campaign composition and targeting fields' })
export class UpdateCampaignInput {
  @Field({ nullable: true, description: 'Campaign display name' })
  name?: string;

  @Field(() => CampaignType, {
    nullable: true,
    description: 'Campaign type (BROADCAST, TRIGGERED, SEQUENCE)',
  })
  type?: CampaignType;

  @Field({
    nullable: true,
    description: 'Optional ISO datetime to schedule campaign',
  })
  scheduledAt?: Date | null;

  @Field({
    nullable: true,
    description: 'Text message body for non-template campaigns',
  })
  messageBody?: string;

  @Field({
    nullable: true,
    description: 'Template name for template campaigns',
  })
  templateName?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Optional explicit audience contact ids',
  })
  audienceContactIds?: string[];
}
