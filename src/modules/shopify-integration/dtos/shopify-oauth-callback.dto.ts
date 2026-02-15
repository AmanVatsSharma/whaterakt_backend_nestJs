/**
 * File: src/modules/shopify-integration/dtos/shopify-oauth-callback.dto.ts
 * Module: shopify-integration
 * Purpose: Query DTO for Shopify OAuth callback payload.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ShopifyOauthCallbackDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i, {
    message: 'shop must be a valid *.myshopify.com domain',
  })
  shop!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  hmac!: string;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;
}
