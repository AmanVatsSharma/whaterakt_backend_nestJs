/**
 * File: src/modules/integrations/dtos/validate-webhook.dto.ts
 * Module: integrations
 * Purpose: DTO for webhook validation requests.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-04-04
 * Notes:
 * - `secret` is accepted for BFF parity; validation is URL-only today.
 * - `require_tld: false` allows localhost and internal hostnames in dev.
 */

import { IsOptional, IsString, IsUrl } from 'class-validator';

export class ValidateWebhookDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  secret?: string;
}
