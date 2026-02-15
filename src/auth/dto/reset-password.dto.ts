/**
 * File: src/auth/dto/reset-password.dto.ts
 * Module: auth
 * Purpose: DTO for password reset token consumption.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
