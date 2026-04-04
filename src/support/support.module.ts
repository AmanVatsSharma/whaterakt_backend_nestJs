/**
 * File: src/support/support.module.ts
 * Module: support
 * Purpose: Wires support REST surface for feedback ingestion.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-04-04
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupportController } from './support.controller';

@Module({
  imports: [AuthModule],
  controllers: [SupportController],
})
export class SupportModule {}
