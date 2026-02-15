/**
* File: src/campaign/enums/campaign-type.enum.ts
* Module: campaign
* Purpose: Campaign type enum shared by GraphQL and persistence.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Declared locally to keep enum values framework-agnostic.
* - Values remain stable for API compatibility.
*/
import { registerEnumType } from '@nestjs/graphql';

export enum CampaignType {
  BROADCAST = 'BROADCAST',
  TRIGGERED = 'TRIGGERED',
  SEQUENCE = 'SEQUENCE',
}

registerEnumType(CampaignType, {
  name: 'CampaignType',
  description: 'The type of campaign',
});