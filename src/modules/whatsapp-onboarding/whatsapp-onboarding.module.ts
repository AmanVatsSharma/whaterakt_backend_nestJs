/**
 * File: src/modules/whatsapp-onboarding/whatsapp-onboarding.module.ts
 * Module: whatsapp-onboarding
 * Purpose: Module wiring for managed WhatsApp onboarding and assignment APIs.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Exports service for WhatsApp send/webhook runtime lookups.
 * - Backed by TypeORM via the shared DatabaseModule.
 */
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WhatsAppOnboardingController } from './controllers/whatsapp-onboarding.controller';
import { WhatsAppOnboardingService } from './services/whatsapp-onboarding.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WhatsAppOnboardingController],
  providers: [WhatsAppOnboardingService],
  exports: [WhatsAppOnboardingService],
})
export class WhatsAppOnboardingModule {}
