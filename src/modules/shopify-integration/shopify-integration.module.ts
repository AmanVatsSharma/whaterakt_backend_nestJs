/**
 * File: src/modules/shopify-integration/shopify-integration.module.ts
 * Module: shopify-integration
 * Purpose: Wire Shopify integration controller/service for tenant sync workflows.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - This module is HTTP-first for BFF consumption.
 * - Read controller endpoints for entrypoints.
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../../database/database.module';
import { AutomationsModule } from '../../automations/automations.module';
import { ShopifyIntegrationController } from './controllers/shopify-integration.controller';
import { ShopifyIntegrationService } from './services/shopify-integration.service';

@Module({
  imports: [DatabaseModule, HttpModule, AutomationsModule],
  controllers: [ShopifyIntegrationController],
  providers: [ShopifyIntegrationService],
  exports: [ShopifyIntegrationService],
})
export class ShopifyIntegrationModule {}

