/**
 * File: src/modules/team-onboarding/team-onboarding.module.ts
 * Module: team-onboarding
 * Purpose: Wire team creation, invite, and membership APIs.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Supports both ecommerce and non-ecommerce company onboarding.
 * - Controller exposes REST endpoints for frontend BFF flows.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TeamOnboardingController } from './controllers/team-onboarding.controller';
import { TeamOnboardingService } from './services/team-onboarding.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TeamOnboardingController],
  providers: [TeamOnboardingService],
  exports: [TeamOnboardingService],
})
export class TeamOnboardingModule {}

