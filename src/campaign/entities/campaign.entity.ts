/**
* File: src/campaign/entities/campaign.entity.ts
* Module: campaign
* Purpose: GraphQL campaign object type.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses local campaign enums registered in GraphQL.
* - Mirrors the fields returned by campaign service queries.
*/
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CampaignStatus } from '../enums/campaign-status.enum';
import { CampaignType } from '../enums/campaign-type.enum';

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

  @Field({ nullable: true, description: 'Outbound message body for text campaigns' })
  messageBody?: string;

  @Field({ nullable: true, description: 'Template name for template-based campaigns' })
  templateName?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Optional explicit audience contact ids for targeted campaigns',
  })
  audienceContactIds?: string[];

  @Field({ description: 'Creation timestamp' })
  createdAt: Date;
} 