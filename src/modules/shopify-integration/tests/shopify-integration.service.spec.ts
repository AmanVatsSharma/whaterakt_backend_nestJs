/**
 * File: src/modules/shopify-integration/tests/shopify-integration.service.spec.ts
 * Module: shopify-integration
 * Purpose: Unit coverage for Shopify integration service basics.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Mocks TypeORM repositories for deterministic service checks.
 * - Keeps contract behavior validated for connect flow.
 */

import { ShopifyIntegrationService } from '../services/shopify-integration.service';
import {
  ShopifyConnectionOrmEntity,
  ShopifyCustomerOrmEntity,
  ShopifyProductOrmEntity,
} from '../../../database/entities';

describe('ShopifyIntegrationService', () => {
  const connectionRepository = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn(),
  };
  const customerRepository = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn(),
  };
  const productRepository = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn(),
  };
  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === ShopifyConnectionOrmEntity) {
        return connectionRepository;
      }
      if (entity === ShopifyCustomerOrmEntity) {
        return customerRepository;
      }
      if (entity === ShopifyProductOrmEntity) {
        return productRepository;
      }
      return connectionRepository;
    }),
  } as any;
  const httpService = {} as any;
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'SHOPIFY_CLIENT_ID') return 'client-id';
      if (key === 'SHOPIFY_CLIENT_SECRET') return 'client-secret';
      if (key === 'JWT_SECRET') return 'jwt-secret';
      return undefined;
    }),
  } as any;
  const automationsService = {
    ensureDefaultShopifyJourneys: jest.fn(async () => ({ ok: true })),
    handleShopifyEvent: jest.fn(async () => ({ matched: 0, queued: 0 })),
  } as any;
  const service = new ShopifyIntegrationService(
    dataSource,
    httpService,
    config,
    automationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connectStore upserts connection', async () => {
    connectionRepository.findOne.mockResolvedValue(null);
    connectionRepository.save.mockResolvedValue({
      id: 'conn-1',
      tenantId: 'tenant-1',
      shopDomain: 'demo.myshopify.com',
      isActive: true,
      connectedAt: new Date(),
    });

    const result = await service.connectStore('tenant-1', {
      shopDomain: 'demo.myshopify.com',
      accessToken: 'token-1',
    });

    expect(result.shopDomain).toBe('demo.myshopify.com');
    expect(connectionRepository.save).toHaveBeenCalled();
  });

  it('builds OAuth start URL for tenant install flow', async () => {
    const result = await service.getOauthStartUrl(
      'tenant-1',
      'demo.myshopify.com'
    );

    expect(result.shopDomain).toBe('demo.myshopify.com');
    expect(result.state).toBeTruthy();
    expect(result.authUrl).toContain(
      'https://demo.myshopify.com/admin/oauth/authorize?'
    );
  });

  it('upserts customer webhook payload and dedupes repeated webhook id', async () => {
    customerRepository.findOne.mockResolvedValue(null);
    customerRepository.save.mockResolvedValue({ id: 'customer-row' });
    await service.handleCustomersWebhook(
      'tenant-1',
      { id: 'cust-1', email: 'hello@example.com' },
      { webhookId: 'wh-customer-1' },
    );
    await service.handleCustomersWebhook(
      'tenant-1',
      { id: 'cust-1', email: 'hello@example.com' },
      { webhookId: 'wh-customer-1' },
    );

    expect(customerRepository.save).toHaveBeenCalledTimes(1);
  });

  it('upserts product webhook payload', async () => {
    productRepository.findOne.mockResolvedValue(null);
    productRepository.save.mockResolvedValue({ id: 'product-row' });

    await service.handleProductsWebhook(
      'tenant-1',
      { id: 'prod-1', title: 'Product 1', status: 'active' },
      { webhookId: 'wh-product-1' },
    );

    expect(productRepository.save).toHaveBeenCalledTimes(1);
  });
});

