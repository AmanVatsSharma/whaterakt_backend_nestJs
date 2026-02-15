/**
 * File: src/modules/whatsapp-onboarding/dtos/set-whatsapp-channel-status.dto.ts
 * Module: whatsapp-onboarding
 * Purpose: Operator DTO for channel status transitions and review metadata.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Allows activation/suspension/review status updates.
 * - Used by operator control panel and operational tooling.
 */
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WhatsAppChannelStatus } from '../../../database/entities';

export class SetWhatsAppChannelStatusDto {
  @IsString()
  tenantId: string;

  @IsEnum(WhatsAppChannelStatus)
  status: WhatsAppChannelStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  displayNameStatus?: string;

  @IsOptional()
  @IsString()
  qualityRating?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
