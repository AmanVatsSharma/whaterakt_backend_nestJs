/**
 * File: src/modules/whatsapp-onboarding/dtos/upsert-whatsapp-onboarding.dto.ts
 * Module: whatsapp-onboarding
 * Purpose: Tenant-facing DTO for managed WhatsApp onboarding details.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Submitted by tenant admins from onboarding/settings UI.
 * - Used to move onboarding into review-ready states.
 */
import { IsEmail, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class UpsertWhatsAppOnboardingDto {
  @IsOptional()
  @IsString()
  businessLegalName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  website?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5_000_000)
  expectedDailyVolume?: number;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
