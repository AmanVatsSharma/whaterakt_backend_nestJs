/**
 * File: src/modules/shopify-integration/services/shopify-integration.service.ts
 * Module: shopify-integration
 * Purpose: Core Shopify integration logic for OAuth, webhook verification, and data sync.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Uses TypeORM as source-of-truth for synced records.
 * - Supports incremental order/customer sync via connection sync cursors.
 */

import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import {
  AutomationOrmEntity,
  ShopifyConnectionOrmEntity,
  ShopifyCustomerOrmEntity,
  ShopifyOrderOrmEntity,
  ShopifyProductOrmEntity,
  ShopifySyncLogOrmEntity,
} from '../../../database/entities';
import { AutomationsService } from '../../../automations/automations.service';
import { ConnectShopifyDto } from '../dtos/connect-shopify.dto';

type ShopifyOAuthStatePayload = {
  tenantId: string;
  shopDomain: string;
  nonce: string;
  issuedAt: number;
};

type ShopifyOrderResponse = {
  orders?: Array<Record<string, unknown>>;
};

type ShopifyCustomerResponse = {
  customers?: Array<Record<string, unknown>>;
};

type ShopifyProductResponse = {
  products?: Array<Record<string, unknown>>;
};

type ShopifyTokenResponse = {
  access_token: string;
  scope?: string;
};

type ShopifyOauthCallbackQuery = {
  shop?: string;
  code?: string;
  state?: string;
  hmac?: string;
  host?: string;
  timestamp?: string;
};

@Injectable()
export class ShopifyIntegrationService {
  private readonly logger = new Logger(ShopifyIntegrationService.name);
  private readonly oauthStateTtlMs = 10 * 60 * 1000;
  private readonly webhookIdTtlMs = 30 * 60 * 1000;
  private readonly processedWebhookIds = new Map<string, number>();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly automationsService: AutomationsService,
  ) {}

  private isProduction(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  private verifyShopifyWebhookSignature(
    signature: string | undefined,
    payload: Record<string, unknown>,
    rawBody?: string,
  ): void {
    if (this.isProduction()) {
      if (!signature) {
        throw new UnauthorizedException('Shopify webhook signature required in production');
      }
      this.assertWebhookSignature(signature, rawBody || JSON.stringify(payload));
      return;
    }
    if (signature) {
      this.assertWebhookSignature(signature, rawBody || JSON.stringify(payload));
    }
  }

  async connectStore(tenantId: string, input: ConnectShopifyDto) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    if (!input.shopDomain || !input.accessToken) {
      throw new BadRequestException('shopDomain and accessToken are required');
    }
    const shopDomain = this.normalizeShopDomain(input.shopDomain);

    const connectionRepository = this.dataSource.getRepository(ShopifyConnectionOrmEntity);
    const existing = await connectionRepository.findOne({
      where: { tenantId, shopDomain },
    });
    const connection = await connectionRepository.save(
      connectionRepository.create({
        id: existing?.id,
        tenantId,
        shopDomain,
        accessToken: input.accessToken,
        scopes: input.scopes || [],
        isActive: true,
        connectedAt: existing?.connectedAt,
        lastOrdersSyncAt: existing?.lastOrdersSyncAt ?? null,
        lastCustomersSyncAt: existing?.lastCustomersSyncAt ?? null,
        lastProductsSyncAt: existing?.lastProductsSyncAt ?? null,
      }),
    );
    try {
      await this.automationsService.ensureDefaultShopifyJourneys(tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to seed default Shopify journeys for tenant ${tenantId}: ${message}`);
    }

    return {
      id: connection.id,
      tenantId: connection.tenantId,
      shopDomain: connection.shopDomain,
      isActive: connection.isActive,
      connectedAt: connection.connectedAt,
      lastOrdersSyncAt: connection.lastOrdersSyncAt ?? null,
      lastCustomersSyncAt: connection.lastCustomersSyncAt ?? null,
      lastProductsSyncAt: connection.lastProductsSyncAt ?? null,
    };
  }

  async getOauthStartUrl(tenantId: string, shopDomain: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    if (!shopDomain) {
      throw new BadRequestException('shopDomain is required');
    }

    const normalizedShopDomain = this.normalizeShopDomain(shopDomain);
    const clientId = this.config.get<string>('SHOPIFY_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('SHOPIFY_CLIENT_ID is not configured');
    }
    const scopes =
      this.config.get<string>('SHOPIFY_SCOPES') || 'read_orders,read_customers,read_products';
    const state = this.createOauthStateToken({
      tenantId,
      shopDomain: normalizedShopDomain,
      nonce: randomBytes(8).toString('hex'),
      issuedAt: Date.now(),
    });
    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: this.getOauthCallbackUrl(),
      state,
    });

    return {
      authUrl: `https://${normalizedShopDomain}/admin/oauth/authorize?${params.toString()}`,
      state,
      shopDomain: normalizedShopDomain,
    };
  }

  async handleOauthCallback(rawQuery: string, query: ShopifyOauthCallbackQuery) {
    const code = String(query.code || '');
    const hmac = String(query.hmac || '');
    const state = String(query.state || '');
    const rawShop = String(query.shop || '');
    if (!code || !hmac || !state || !rawShop) {
      throw new BadRequestException('shop, code, state and hmac are required');
    }

    const shopDomain = this.normalizeShopDomain(rawShop);
    this.assertOauthHmac(rawQuery, hmac);
    const statePayload = this.verifyOauthStateToken(state, shopDomain);

    const tokenResult = await this.exchangeShopifyAccessToken(shopDomain, code);
    const scopes = tokenResult.scope
      ? tokenResult.scope.split(',').map((scope) => scope.trim()).filter(Boolean)
      : [];

    const connection = await this.connectStore(statePayload.tenantId, {
      shopDomain,
      accessToken: tokenResult.access_token,
      scopes,
    });

    return {
      ok: true,
      tenantId: statePayload.tenantId,
      shopDomain,
      connection,
    };
  }

  async syncOrders(tenantId: string, limit = 25) {
    return this.runSync(tenantId, 'ORDERS', async () => {
      const connection = await this.getActiveConnection(tenantId);
      const orders = await this.fetchOrders(connection, limit);
      const orderRepository = this.dataSource.getRepository(ShopifyOrderOrmEntity);
      const timestamps: Date[] = [];

      for (const order of orders) {
        const shopifyOrderId = String(order.id || '');
        if (!shopifyOrderId) {
          continue;
        }
        const existing = await orderRepository.findOne({
          where: { tenantId, shopifyOrderId },
        });
        const orderTimestamp = this.readTimestamp(order.updated_at || order.created_at);
        if (orderTimestamp) {
          timestamps.push(orderTimestamp);
        }
        await orderRepository.save(
          orderRepository.create({
            id: existing?.id,
            tenantId,
            shopifyOrderId,
            orderNumber: String(order.name || order.order_number || shopifyOrderId),
            totalPrice: order.total_price ? String(order.total_price) : null,
            currency: order.currency ? String(order.currency) : null,
            status: order.financial_status ? String(order.financial_status) : null,
            placedAt: this.readTimestamp(order.created_at),
            raw: order as Record<string, unknown>,
            createdAt: existing?.createdAt,
            updatedAt: existing?.updatedAt,
          }),
        );
      }

      await this.updateOrdersSyncCursor(connection.id, timestamps);
      return orders.length;
    });
  }

  async syncCustomers(tenantId: string, limit = 25) {
    return this.runSync(tenantId, 'CUSTOMERS', async () => {
      const connection = await this.getActiveConnection(tenantId);
      const customers = await this.fetchCustomers(connection, limit);
      const customerRepository = this.dataSource.getRepository(ShopifyCustomerOrmEntity);
      const timestamps: Date[] = [];

      for (const customer of customers) {
        const shopifyCustomerId = String(customer.id || '');
        if (!shopifyCustomerId) {
          continue;
        }
        const existing = await customerRepository.findOne({
          where: { tenantId, shopifyCustomerId },
        });
        const customerTimestamp = this.readTimestamp(customer.updated_at);
        if (customerTimestamp) {
          timestamps.push(customerTimestamp);
        }
        await customerRepository.save(
          customerRepository.create({
            id: existing?.id,
            tenantId,
            shopifyCustomerId,
            email: customer.email ? String(customer.email) : null,
            firstName: customer.first_name ? String(customer.first_name) : null,
            lastName: customer.last_name ? String(customer.last_name) : null,
            raw: customer as Record<string, unknown>,
            createdAt: existing?.createdAt,
            updatedAt: existing?.updatedAt,
          }),
        );
      }

      await this.updateCustomersSyncCursor(connection.id, timestamps);
      return customers.length;
    });
  }

  async syncProducts(tenantId: string, limit = 25) {
    return this.runSync(tenantId, 'PRODUCTS', async () => {
      const connection = await this.getActiveConnection(tenantId);
      const products = await this.fetchProducts(connection, limit);
      const productRepository = this.dataSource.getRepository(ShopifyProductOrmEntity);
      const timestamps: Date[] = [];

      for (const product of products) {
        const shopifyProductId = String(product.id || '');
        if (!shopifyProductId) {
          continue;
        }
        const existing = await productRepository.findOne({
          where: { tenantId, shopifyProductId },
        });
        const productTimestamp = this.readTimestamp(product.updated_at || product.created_at);
        if (productTimestamp) {
          timestamps.push(productTimestamp);
        }
        await productRepository.save(
          productRepository.create({
            id: existing?.id,
            tenantId,
            shopifyProductId,
            title: String(product.title || `Product ${shopifyProductId}`),
            vendor: product.vendor ? String(product.vendor) : null,
            status: product.status ? String(product.status) : null,
            updatedAtShopify: this.readTimestamp(product.updated_at),
            raw: product as Record<string, unknown>,
            createdAt: existing?.createdAt,
            updatedAt: existing?.updatedAt,
          }),
        );
      }

      await this.updateProductsSyncCursor(connection.id, timestamps);
      return products.length;
    });
  }

  async handleOrdersWebhook(
    tenantId: string,
    payload: Record<string, unknown>,
    options?: { signature?: string; rawBody?: string; shopDomain?: string; webhookId?: string }
  ) {
    if (this.isDuplicateWebhook(options?.webhookId)) {
      return { ok: true, deduped: true };
    }
    this.verifyShopifyWebhookSignature(options?.signature, payload, options?.rawBody);

    const resolvedTenantId = tenantId || (await this.resolveTenantFromShop(options?.shopDomain));
    const rawOrderId = String(payload?.id || '');
    if (!resolvedTenantId || !rawOrderId) {
      throw new BadRequestException('tenantId and payload.id are required');
    }

    const orderRepository = this.dataSource.getRepository(ShopifyOrderOrmEntity);
    const existing = await orderRepository.findOne({
      where: { tenantId: resolvedTenantId, shopifyOrderId: rawOrderId },
    });
    await orderRepository.save(
      orderRepository.create({
        id: existing?.id,
        tenantId: resolvedTenantId,
        shopifyOrderId: rawOrderId,
        orderNumber: String(payload?.order_number || ''),
        totalPrice: payload?.total_price ? String(payload.total_price) : null,
        currency: String(payload?.currency || ''),
        status: String(payload?.financial_status || ''),
        placedAt: payload?.created_at ? new Date(String(payload.created_at)) : null,
        raw: payload as object,
        createdAt: existing?.createdAt,
        updatedAt: existing?.updatedAt,
      }),
    );
    const customer = (payload?.customer || {}) as Record<string, unknown>;
    const shippingAddress = (payload?.shipping_address || {}) as Record<string, unknown>;
    await this.automationsService.handleShopifyEvent(
      resolvedTenantId,
      this.resolveOrderEvent(payload),
      {
        firstName:
          String(customer.first_name || shippingAddress.first_name || '').trim() ||
          'there',
        orderNumber: String(payload?.name || payload?.order_number || rawOrderId),
        phone:
          String(customer.phone || shippingAddress.phone || payload?.phone || '').trim(),
        customerPhone: String(customer.phone || '').trim(),
        shippingPhone: String(shippingAddress.phone || '').trim(),
      },
    );

    return { ok: true, tenantId: resolvedTenantId };
  }

  async handleCustomersWebhook(
    tenantId: string,
    payload: Record<string, unknown>,
    options?: { signature?: string; rawBody?: string; shopDomain?: string; webhookId?: string }
  ) {
    if (this.isDuplicateWebhook(options?.webhookId)) {
      return { ok: true, deduped: true };
    }
    this.verifyShopifyWebhookSignature(options?.signature, payload, options?.rawBody);
    const resolvedTenantId = tenantId || (await this.resolveTenantFromShop(options?.shopDomain));
    const rawCustomerId = String(payload?.id || '');
    if (!resolvedTenantId || !rawCustomerId) {
      throw new BadRequestException('tenantId and payload.id are required');
    }
    const repository = this.dataSource.getRepository(ShopifyCustomerOrmEntity);
    const existing = await repository.findOne({
      where: { tenantId: resolvedTenantId, shopifyCustomerId: rawCustomerId },
    });
    await repository.save(
      repository.create({
        id: existing?.id,
        tenantId: resolvedTenantId,
        shopifyCustomerId: rawCustomerId,
        email: payload?.email ? String(payload.email) : null,
        firstName: payload?.first_name ? String(payload.first_name) : null,
        lastName: payload?.last_name ? String(payload.last_name) : null,
        raw: payload as object,
        createdAt: existing?.createdAt,
        updatedAt: existing?.updatedAt,
      }),
    );
    await this.automationsService.handleShopifyEvent(resolvedTenantId, 'CUSTOMER_UPDATED', {
      firstName: String(payload?.first_name || '').trim() || 'there',
      phone: String(payload?.phone || '').trim(),
      customerPhone: String(payload?.phone || '').trim(),
    });
    return { ok: true, tenantId: resolvedTenantId };
  }

  async handleProductsWebhook(
    tenantId: string,
    payload: Record<string, unknown>,
    options?: { signature?: string; rawBody?: string; shopDomain?: string; webhookId?: string }
  ) {
    if (this.isDuplicateWebhook(options?.webhookId)) {
      return { ok: true, deduped: true };
    }
    this.verifyShopifyWebhookSignature(options?.signature, payload, options?.rawBody);
    const resolvedTenantId = tenantId || (await this.resolveTenantFromShop(options?.shopDomain));
    const rawProductId = String(payload?.id || '');
    if (!resolvedTenantId || !rawProductId) {
      throw new BadRequestException('tenantId and payload.id are required');
    }
    const repository = this.dataSource.getRepository(ShopifyProductOrmEntity);
    const existing = await repository.findOne({
      where: { tenantId: resolvedTenantId, shopifyProductId: rawProductId },
    });
    await repository.save(
      repository.create({
        id: existing?.id,
        tenantId: resolvedTenantId,
        shopifyProductId: rawProductId,
        title: String(payload?.title || `Product ${rawProductId}`),
        vendor: payload?.vendor ? String(payload.vendor) : null,
        status: payload?.status ? String(payload.status) : null,
        updatedAtShopify: this.readTimestamp(payload?.updated_at),
        raw: payload as object,
        createdAt: existing?.createdAt,
        updatedAt: existing?.updatedAt,
      }),
    );
    await this.automationsService.handleShopifyEvent(resolvedTenantId, 'PRODUCT_UPDATED', {
      productTitle: String(payload?.title || ''),
      productStatus: String(payload?.status || ''),
    });
    return { ok: true, tenantId: resolvedTenantId };
  }

  async getStatus(tenantId: string) {
    const connectionRepository = this.dataSource.getRepository(ShopifyConnectionOrmEntity);
    const orderRepository = this.dataSource.getRepository(ShopifyOrderOrmEntity);
    const customerRepository = this.dataSource.getRepository(ShopifyCustomerOrmEntity);
    const productRepository = this.dataSource.getRepository(ShopifyProductOrmEntity);

    const [connection, orders, customers, products, commerceJourneys] = await Promise.all([
      connectionRepository.findOne({
        where: { tenantId, isActive: true },
      }),
      orderRepository.count({ where: { tenantId } }),
      customerRepository.count({ where: { tenantId } }),
      productRepository.count({ where: { tenantId } }),
      this.dataSource.getRepository(AutomationOrmEntity).count({
        where: { tenantId, type: 'SHOPIFY_EVENT', enabled: true },
      }),
    ]);

    return {
      connected: Boolean(connection),
      shopDomain: connection?.shopDomain || null,
      orders,
      customers,
      products,
      commerceJourneys,
      lastOrdersSyncAt: connection?.lastOrdersSyncAt ?? null,
      lastCustomersSyncAt: connection?.lastCustomersSyncAt ?? null,
      lastProductsSyncAt: connection?.lastProductsSyncAt ?? null,
    };
  }

  private async runSync(
    tenantId: string,
    resource: 'ORDERS' | 'CUSTOMERS' | 'PRODUCTS',
    syncFn: () => Promise<number>
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const logRepository = this.dataSource.getRepository(ShopifySyncLogOrmEntity);
    const log = await logRepository.save(
      logRepository.create({
        tenantId,
        resource,
        status: 'STARTED',
      }),
    );

    try {
      const count = await syncFn();
      await logRepository.update(
        { id: log.id },
        {
          status: 'COMPLETED',
          message: `${resource.toLowerCase()} sync completed`,
          finishedAt: new Date(),
        },
      );
      return { ok: true, count };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await logRepository.update(
        { id: log.id },
        {
          status: 'FAILED',
          message,
          finishedAt: new Date(),
        },
      );
      throw error;
    }
  }

  private normalizeShopDomain(shopDomain: string): string {
    const trimmed = shopDomain.trim().toLowerCase();
    const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
    const domainOnly = withoutProtocol.split('/')[0];
    if (!domainOnly.endsWith('.myshopify.com')) {
      throw new BadRequestException('shopDomain must end with .myshopify.com');
    }
    return domainOnly;
  }

  private createOauthStateToken(payload: ShopifyOAuthStatePayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const secret = this.getOauthStateSecret();
    const signature = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  private verifyOauthStateToken(token: string, expectedShopDomain: string): ShopifyOAuthStatePayload {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const secret = this.getOauthStateSecret();
    const expectedSignature = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');
    if (!this.safeEqual(signature, expectedSignature)) {
      throw new UnauthorizedException('OAuth state signature mismatch');
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as ShopifyOAuthStatePayload;

    if (Date.now() - payload.issuedAt > this.oauthStateTtlMs) {
      throw new UnauthorizedException('OAuth state expired');
    }
    if (payload.shopDomain !== expectedShopDomain) {
      throw new UnauthorizedException('OAuth state shop mismatch');
    }
    if (!payload.tenantId) {
      throw new UnauthorizedException('OAuth state tenant missing');
    }
    return payload;
  }

  private getOauthStateSecret(): string {
    const secret =
      this.config.get<string>('SHOPIFY_OAUTH_STATE_SECRET') ||
      this.config.get<string>('JWT_SECRET') ||
      this.config.get<string>('SHOPIFY_CLIENT_SECRET');
    if (!secret) {
      throw new BadRequestException(
        'SHOPIFY_OAUTH_STATE_SECRET (or JWT_SECRET/SHOPIFY_CLIENT_SECRET) is required'
      );
    }
    return secret;
  }

  private getOauthCallbackUrl(): string {
    const explicit = this.config.get<string>('SHOPIFY_OAUTH_REDIRECT_URI');
    if (explicit) {
      return explicit;
    }
    const base =
      this.config.get<string>('BACKEND_PUBLIC_URL') ||
      this.config.get<string>('BACKEND_API_URL') ||
      `http://localhost:${this.config.get<number>('PORT') || 3000}`;
    return `${base.replace(/\/$/, '')}/shopify/oauth/callback`;
  }

  private assertOauthHmac(rawQuery: string, providedHmac: string) {
    const secret = this.config.get<string>('SHOPIFY_CLIENT_SECRET');
    if (!secret) {
      throw new BadRequestException('SHOPIFY_CLIENT_SECRET is required');
    }
    const baseString = rawQuery
      .split('&')
      .filter(Boolean)
      .filter((part) => !part.startsWith('hmac=') && !part.startsWith('signature='))
      .sort()
      .join('&');
    const expectedHmac = createHmac('sha256', secret).update(baseString).digest('hex');
    if (!this.safeEqual(providedHmac, expectedHmac)) {
      throw new UnauthorizedException('Invalid Shopify OAuth signature');
    }
  }

  private assertWebhookSignature(signature: string, rawBody: string) {
    const webhookSecret = this.config.get<string>('SHOPIFY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('SHOPIFY_WEBHOOK_SECRET is required');
    }
    const expected = createHmac('sha256', webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');
    if (!this.safeEqual(signature, expected)) {
      throw new UnauthorizedException('Invalid Shopify webhook signature');
    }
  }

  private safeEqual(value: string, expected: string): boolean {
    const left = Buffer.from(value);
    const right = Buffer.from(expected);
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }

  private async exchangeShopifyAccessToken(shopDomain: string, code: string) {
    const clientId = this.config.get<string>('SHOPIFY_CLIENT_ID');
    const clientSecret = this.config.get<string>('SHOPIFY_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new BadRequestException('SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are required');
    }

    const url = `https://${shopDomain}/admin/oauth/access_token`;
    const response = await firstValueFrom(
      this.httpService.post<ShopifyTokenResponse>(
        url,
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        { timeout: 15_000 }
      )
    );

    if (!response.data?.access_token) {
      throw new BadRequestException('Shopify token exchange returned empty access token');
    }
    return response.data;
  }

  private async getActiveConnection(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const repository = this.dataSource.getRepository(ShopifyConnectionOrmEntity);
    const connection = await repository.findOne({
      where: {
        tenantId,
        isActive: true,
      },
      order: { connectedAt: 'DESC' },
    });
    if (!connection) {
      throw new BadRequestException('Active Shopify connection not found for tenant');
    }
    return connection;
  }

  private async fetchOrders(connection: ShopifyConnectionOrmEntity, limit: number) {
    const target = this.clampLimit(limit);
    const rows: Array<Record<string, unknown>> = [];
    let pageInfo: string | undefined;
    let page = 0;

    while (rows.length < target && page < 10) {
      const requestLimit = Math.min(100, target - rows.length);
      const params = new URLSearchParams({
        status: 'any',
        order: 'updated_at asc',
        limit: String(requestLimit),
      });
      if (pageInfo) {
        params.set('page_info', pageInfo);
      } else if (connection.lastOrdersSyncAt) {
        params.set('updated_at_min', connection.lastOrdersSyncAt.toISOString());
      }
      const path = `/admin/api/${this.getShopifyApiVersion()}/orders.json?${params.toString()}`;
      const { data, nextPageInfo } = await this.shopifyGet<ShopifyOrderResponse>(connection, path);
      rows.push(...(data.orders || []));
      pageInfo = nextPageInfo;
      if (!pageInfo) {
        break;
      }
      page += 1;
    }

    return rows.slice(0, target);
  }

  private async fetchCustomers(connection: ShopifyConnectionOrmEntity, limit: number) {
    const target = this.clampLimit(limit);
    const rows: Array<Record<string, unknown>> = [];
    let pageInfo: string | undefined;
    let page = 0;

    while (rows.length < target && page < 10) {
      const requestLimit = Math.min(100, target - rows.length);
      const params = new URLSearchParams({
        order: 'updated_at asc',
        limit: String(requestLimit),
      });
      if (pageInfo) {
        params.set('page_info', pageInfo);
      } else if (connection.lastCustomersSyncAt) {
        params.set('updated_at_min', connection.lastCustomersSyncAt.toISOString());
      }
      const path = `/admin/api/${this.getShopifyApiVersion()}/customers.json?${params.toString()}`;
      const { data, nextPageInfo } = await this.shopifyGet<ShopifyCustomerResponse>(connection, path);
      rows.push(...(data.customers || []));
      pageInfo = nextPageInfo;
      if (!pageInfo) {
        break;
      }
      page += 1;
    }

    return rows.slice(0, target);
  }

  private async fetchProducts(connection: ShopifyConnectionOrmEntity, limit: number) {
    const target = this.clampLimit(limit);
    const rows: Array<Record<string, unknown>> = [];
    let pageInfo: string | undefined;
    let page = 0;

    while (rows.length < target && page < 10) {
      const requestLimit = Math.min(100, target - rows.length);
      const params = new URLSearchParams({
        order: 'updated_at asc',
        limit: String(requestLimit),
      });
      if (pageInfo) {
        params.set('page_info', pageInfo);
      } else if (connection.lastProductsSyncAt) {
        params.set('updated_at_min', connection.lastProductsSyncAt.toISOString());
      }
      const path = `/admin/api/${this.getShopifyApiVersion()}/products.json?${params.toString()}`;
      const { data, nextPageInfo } = await this.shopifyGet<ShopifyProductResponse>(connection, path);
      rows.push(...(data.products || []));
      pageInfo = nextPageInfo;
      if (!pageInfo) {
        break;
      }
      page += 1;
    }

    return rows.slice(0, target);
  }

  private getShopifyApiVersion() {
    return this.config.get<string>('SHOPIFY_API_VERSION') || '2024-10';
  }

  private async shopifyGet<T>(connection: ShopifyConnectionOrmEntity, path: string) {
    const url = `https://${connection.shopDomain}${path}`;
    const attempts = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<T>(url, {
            headers: {
              'X-Shopify-Access-Token': connection.accessToken,
              'Content-Type': 'application/json',
            },
            timeout: 20_000,
          })
        );
        return {
          data: response.data,
          nextPageInfo: this.parseNextPageInfo(response.headers?.link as string | undefined),
        };
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          this.logger.warn(
            `Shopify GET retry ${attempt}/${attempts - 1} for ${connection.shopDomain}${path}`
          );
          await this.sleep(attempt * 700);
          continue;
        }
      }
    }
    const message = lastError instanceof Error ? lastError.message : 'Unknown Shopify API error';
    this.logger.error(`Shopify GET failed (${connection.shopDomain} ${path}): ${message}`);
    throw new BadRequestException('Shopify API request failed');
  }

  private parseNextPageInfo(linkHeader?: string) {
    if (!linkHeader) {
      return undefined;
    }
    const nextChunk = linkHeader
      .split(',')
      .map((item) => item.trim())
      .find((item) => item.includes('rel="next"'));
    if (!nextChunk) {
      return undefined;
    }
    const match = nextChunk.match(/[?&]page_info=([^&>]+)/);
    if (!match?.[1]) {
      return undefined;
    }
    return decodeURIComponent(match[1]);
  }

  private readTimestamp(raw: unknown): Date | null {
    if (!raw) {
      return null;
    }
    const timestamp = new Date(String(raw));
    if (Number.isNaN(timestamp.getTime())) {
      return null;
    }
    return timestamp;
  }

  private async updateOrdersSyncCursor(connectionId: string, timestamps: Date[]) {
    const lastSyncedAt = timestamps.length
      ? new Date(Math.max(...timestamps.map((timestamp) => timestamp.getTime())))
      : new Date();
    await this.dataSource.getRepository(ShopifyConnectionOrmEntity).update(
      { id: connectionId },
      { lastOrdersSyncAt: lastSyncedAt }
    );
  }

  private async updateCustomersSyncCursor(connectionId: string, timestamps: Date[]) {
    const lastSyncedAt = timestamps.length
      ? new Date(Math.max(...timestamps.map((timestamp) => timestamp.getTime())))
      : new Date();
    await this.dataSource.getRepository(ShopifyConnectionOrmEntity).update(
      { id: connectionId },
      { lastCustomersSyncAt: lastSyncedAt }
    );
  }

  private async updateProductsSyncCursor(connectionId: string, timestamps: Date[]) {
    const lastSyncedAt = timestamps.length
      ? new Date(Math.max(...timestamps.map((timestamp) => timestamp.getTime())))
      : new Date();
    await this.dataSource.getRepository(ShopifyConnectionOrmEntity).update(
      { id: connectionId },
      { lastProductsSyncAt: lastSyncedAt }
    );
  }

  private clampLimit(limit?: number) {
    const parsed = Number(limit);
    if (!Number.isFinite(parsed)) {
      return 25;
    }
    return Math.max(1, Math.min(250, Math.floor(parsed)));
  }

  private async resolveTenantFromShop(shopDomain?: string) {
    if (!shopDomain) {
      return '';
    }
    const normalizedShopDomain = this.normalizeShopDomain(shopDomain);
    const connection = await this.dataSource.getRepository(ShopifyConnectionOrmEntity).findOne({
      where: {
        shopDomain: normalizedShopDomain,
        isActive: true,
      },
      order: { connectedAt: 'DESC' },
    });
    return connection?.tenantId || '';
  }

  private isDuplicateWebhook(webhookId?: string) {
    if (!webhookId) {
      return false;
    }
    const now = Date.now();
    for (const [key, expiresAt] of this.processedWebhookIds.entries()) {
      if (expiresAt <= now) {
        this.processedWebhookIds.delete(key);
      }
    }
    const existingExpiry = this.processedWebhookIds.get(webhookId);
    if (existingExpiry && existingExpiry > now) {
      return true;
    }
    this.processedWebhookIds.set(webhookId, now + this.webhookIdTtlMs);
    return false;
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private resolveOrderEvent(payload: Record<string, unknown>) {
    const fulfillment = String(payload?.fulfillment_status || '').toLowerCase();
    if (fulfillment === 'fulfilled' || fulfillment === 'partial') {
      return 'ORDER_FULFILLED';
    }
    return 'ORDER_CREATED';
  }
}

