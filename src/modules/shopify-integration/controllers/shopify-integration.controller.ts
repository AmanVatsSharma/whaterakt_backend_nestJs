/**
 * File: src/modules/shopify-integration/controllers/shopify-integration.controller.ts
 * Module: shopify-integration
 * Purpose: HTTP endpoints for Shopify OAuth/connect/sync/webhook flows.
 * Author: Aman Sharma / Novologic/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Tenant id is resolved from middleware context or header fallback.
 * - Keep payload contracts stable for frontend BFF routes.
 */

import { Body, Controller, Get, Headers, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ConnectShopifyDto } from '../dtos/connect-shopify.dto';
import { ShopifyOauthCallbackDto } from '../dtos/shopify-oauth-callback.dto';
import { ShopifyOauthStartDto } from '../dtos/shopify-oauth-start.dto';
import { SyncShopifyDto } from '../dtos/sync-shopify.dto';
import { ShopifyIntegrationService } from '../services/shopify-integration.service';

type RequestWithTenant = Request & {
  tenant?: { id?: string };
  rawBody?: string;
};

@Controller('shopify')
export class ShopifyIntegrationController {
  constructor(
    private readonly shopifyIntegrationService: ShopifyIntegrationService
  ) {}

  @Get('oauth/start')
  async oauthStart(
    @Query() query: ShopifyOauthStartDto,
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.getOauthStartUrl(tenantId, query.shopDomain);
  }

  @Get('oauth/callback')
  async oauthCallback(
    @Req() request: RequestWithTenant,
    @Query() query: ShopifyOauthCallbackDto
  ) {
    const rawQuery = request.originalUrl.includes('?')
      ? request.originalUrl.split('?')[1]
      : '';
    return this.shopifyIntegrationService.handleOauthCallback(rawQuery, query);
  }

  @Post('connect')
  async connectStore(
    @Body() body: ConnectShopifyDto,
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.connectStore(tenantId, body);
  }

  @Post('sync/orders')
  async syncOrders(
    @Body() body: SyncShopifyDto,
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.syncOrders(tenantId, body?.limit);
  }

  @Post('sync/customers')
  async syncCustomers(
    @Body() body: SyncShopifyDto,
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.syncCustomers(tenantId, body?.limit);
  }

  @Post('sync/products')
  async syncProducts(
    @Body() body: SyncShopifyDto,
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.syncProducts(tenantId, body?.limit);
  }

  @Post('webhook/orders')
  async ordersWebhook(
    @Body() body: Record<string, unknown>,
    @Req() request: RequestWithTenant,
    @Headers('x-shopify-hmac-sha256') signature?: string,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
    @Headers('x-shopify-webhook-id') webhookId?: string,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.handleOrdersWebhook(tenantId, body, {
      signature,
      rawBody: request.rawBody,
      shopDomain,
      webhookId,
    });
  }

  @Post('webhook/customers')
  async customersWebhook(
    @Body() body: Record<string, unknown>,
    @Req() request: RequestWithTenant,
    @Headers('x-shopify-hmac-sha256') signature?: string,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
    @Headers('x-shopify-webhook-id') webhookId?: string,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.handleCustomersWebhook(tenantId, body, {
      signature,
      rawBody: request.rawBody,
      shopDomain,
      webhookId,
    });
  }

  @Post('webhook/products')
  async productsWebhook(
    @Body() body: Record<string, unknown>,
    @Req() request: RequestWithTenant,
    @Headers('x-shopify-hmac-sha256') signature?: string,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
    @Headers('x-shopify-webhook-id') webhookId?: string,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.handleProductsWebhook(tenantId, body, {
      signature,
      rawBody: request.rawBody,
      shopDomain,
      webhookId,
    });
  }

  @Get('status')
  async status(
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    const tenantId = request.tenant?.id || tenantHeader || '';
    return this.shopifyIntegrationService.getStatus(tenantId);
  }
}

