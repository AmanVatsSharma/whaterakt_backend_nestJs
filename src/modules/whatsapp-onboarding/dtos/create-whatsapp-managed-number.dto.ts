/**
 * File: src/modules/whatsapp-onboarding/dtos/create-whatsapp-managed-number.dto.ts
 * Module: whatsapp-onboarding
 * Purpose: Operator DTO for managed WhatsApp number inventory rows.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Used to add or update managed-number inventory records.
 * - Supports optional metadata fields from Meta/WABA backoffice.
 */
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { WhatsAppManagedNumberStatus } from '../../../database/entities';

export class CreateWhatsAppManagedNumberDto {
  @IsString()
  phoneNumberId: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,20}$/)
  displayPhoneNumber: string;

  @IsOptional()
  @IsEnum(WhatsAppManagedNumberStatus)
  status?: WhatsAppManagedNumberStatus;

  @IsOptional()
  @IsString()
  wabaId?: string;

  @IsOptional()
  @IsString()
  businessAccountId?: string;

  @IsOptional()
  @IsString()
  qualityRating?: string;
}
