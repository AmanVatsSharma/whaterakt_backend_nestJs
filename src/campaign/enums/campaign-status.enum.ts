/**
* File: src/campaign/enums/campaign-status.enum.ts
* Module: campaign
* Purpose: Campaign status enum shared by GraphQL and persistence.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Local enum keeps API values independent of ORM generators.
* - Registered in GraphQL schema for strong typing.
*/
import { registerEnumType } from '@nestjs/graphql';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

registerEnumType(CampaignStatus, {
  name: 'CampaignStatus',
  description: 'The status of a campaign',
});