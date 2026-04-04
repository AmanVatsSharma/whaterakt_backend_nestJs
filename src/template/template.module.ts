/**
* File: src/template/template.module.ts
* Module: template
* Purpose: Template module for syncing and validating WhatsApp templates.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Service persists provider templates through TypeORM.
* - Resolver remains thin and delegates template operations.
*/
import { Module } from '@nestjs/common';
import { TemplateResolver } from './template.resolver';
import { TemplateService } from './template.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppOnboardingModule } from '../modules/whatsapp-onboarding/whatsapp-onboarding.module';

@Module({
  imports: [HttpModule, ConfigModule, WhatsAppOnboardingModule],
  providers: [TemplateResolver, TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
