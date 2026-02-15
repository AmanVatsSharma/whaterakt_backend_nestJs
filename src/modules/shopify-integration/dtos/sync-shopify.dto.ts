/**
 * File: src/modules/shopify-integration/dtos/sync-shopify.dto.ts
 * Module: shopify-integration
 * Purpose: DTO for sync trigger payloads.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - limit helps with controlled batch syncing.
 * - keep optional to allow default behavior.
 */

import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class SyncShopifyDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(250)
  limit?: number;
}

