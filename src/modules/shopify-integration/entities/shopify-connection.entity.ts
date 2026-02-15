/**
 * File: src/modules/shopify-integration/entities/shopify-connection.entity.ts
 * Module: shopify-integration
 * Purpose: Shared response type for Shopify connection health.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Mirrors key fields from persistence model without exposing tokens.
 * - Used in controller status responses.
 */

export interface ShopifyConnectionEntity {
  id: string;
  tenantId: string;
  shopDomain: string;
  isActive: boolean;
  connectedAt: Date;
}

