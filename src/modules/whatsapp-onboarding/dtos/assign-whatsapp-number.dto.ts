/**
 * File: src/modules/whatsapp-onboarding/dtos/assign-whatsapp-number.dto.ts
 * Module: whatsapp-onboarding
 * Purpose: Operator DTO for assigning managed numbers to tenants.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Drives assignment/reassignment decisions with audit reason.
 * - Supports optional immediate activation on assignment.
 */
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AssignWhatsAppNumberDto {
  @IsString()
  tenantId: string;

  @IsString()
  phoneNumberId: string;

  @IsOptional()
  @IsBoolean()
  forceReassign?: boolean;

  @IsOptional()
  @IsBoolean()
  activateNow?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
