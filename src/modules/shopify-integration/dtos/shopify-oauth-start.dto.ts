/**
 * File: src/modules/shopify-integration/dtos/shopify-oauth-start.dto.ts
 * Module: shopify-integration
 * Purpose: Query DTO for starting the Shopify OAuth install flow.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ShopifyOauthStartDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i, {
    message: 'shopDomain must be a valid *.myshopify.com domain',
  })
  shopDomain!: string;
}
