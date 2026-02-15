/**
 * File: src/modules/integrations/integrations.module.ts
 * Module: integrations
 * Purpose: Module wiring for external/inbound platform integration settings.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Exposes REST endpoints used by frontend BFF settings routes.
 * - Read IntegrationsController for API surface.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IntegrationsController } from './controllers/integrations.controller';
import { IntegrationsService } from './services/integrations.service';

@Module({
  imports: [DatabaseModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

