/**
 * File: src/support/dto/submit-feedback.dto.ts
 * Module: support
 * Purpose: Validates inbound support feedback from the BFF.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-04-04
 */
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum FeedbackType {
  GENERAL = 'general',
  BUG = 'bug',
  FEATURE = 'feature',
  INCIDENT = 'incident',
}

export class SubmitFeedbackDto {
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @IsString()
  @MinLength(10)
  message!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;
}
