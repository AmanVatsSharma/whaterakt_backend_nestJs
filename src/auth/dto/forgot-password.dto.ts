/**
 * File: src/auth/dto/forgot-password.dto.ts
 * Module: auth
 * Purpose: DTO for password reset token request.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
