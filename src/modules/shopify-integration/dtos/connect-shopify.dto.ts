/**
 * File: src/modules/shopify-integration/dtos/connect-shopify.dto.ts
 * Module: shopify-integration
 * Purpose: DTO for connecting a Shopify store to tenant workspace.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Access token should come from secure OAuth flow in production.
 * - Kept minimal for current MVP integration endpoints.
 */

import { IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ConnectShopifyDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i, {
    message: 'shopDomain must be a valid *.myshopify.com domain',
  })
  shopDomain!: string;

  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}

