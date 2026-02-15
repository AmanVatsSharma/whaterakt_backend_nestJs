/**
 * File: src/modules/integrations/dtos/workspace-settings.dto.ts
 * Module: integrations
 * Purpose: Tenant workspace settings payload for settings persistence APIs.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class WorkspaceSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  dateFormat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  autoReply?: boolean;

  @IsOptional()
  @IsBoolean()
  analyticsEnabled?: boolean;
}
