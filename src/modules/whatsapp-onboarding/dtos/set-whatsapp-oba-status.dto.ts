/**
 * File: src/modules/whatsapp-onboarding/dtos/set-whatsapp-oba-status.dto.ts
 * Module: whatsapp-onboarding
 * Purpose: Operator DTO for OBA (green tick) lifecycle status updates.
 * Author: BharatERP
 * created: 2026-02-16
 */
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WhatsAppObaStatus } from '../../../database/entities';

export class SetWhatsAppObaStatusDto {
  @IsString()
  tenantId: string;

  @IsEnum(WhatsAppObaStatus)
  obaStatus: WhatsAppObaStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
