/**
* File: src/automations/automations.module.ts
* Module: automations
* Purpose: Automation module for inbound keyword reaction workflows.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Service now reads automation rules from TypeORM entities.
* - Exported for webhook processor integration.
*/
import { Module } from '@nestjs/common';
import { AutomationsResolver } from './automations.resolver';
import { AutomationsService } from './automations.service';

@Module({
  providers: [AutomationsService, AutomationsResolver],
  exports: [AutomationsService],
})
export class AutomationsModule {}
