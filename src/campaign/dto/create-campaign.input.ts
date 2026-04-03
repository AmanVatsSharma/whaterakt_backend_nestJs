/**
* File: src/campaign/dto/create-campaign.input.ts
* Module: campaign
* Purpose: GraphQL input for creating a campaign.
* Author: BharatERP
* created: 2026-02-16
*/
import { Field, InputType } from '@nestjs/graphql';
import { CampaignType } from '../enums';

@InputType({ description: 'Create a campaign which will schedule/broadcast messages' })
export class CreateCampaignInput {
  @Field({ description: 'Human-friendly campaign name' })
  name: string;

  @Field(() => CampaignType, { description: 'Campaign type (BROADCAST, TRIGGERED, SEQUENCE)' })
  type: CampaignType;

  @Field({
    nullable: true,
    description: 'Optional ISO datetime to schedule (immediate if omitted)',
  })
  scheduledAt?: Date;

  @Field({
    nullable: true,
    description: 'User ID who owns this campaign (auto-derived from auth context when omitted)',
  })
  userId?: string;

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