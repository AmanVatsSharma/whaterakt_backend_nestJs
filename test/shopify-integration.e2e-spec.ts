import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ShopifyIntegrationController } from '../src/modules/shopify-integration/controllers/shopify-integration.controller';
import { ShopifyIntegrationService } from '../src/modules/shopify-integration/services/shopify-integration.service';

describe('Shopify integration routes (e2e)', () => {
  let app: INestApplication;
  const serviceMock = {
    connectStore: jest.fn(async () => ({ ok: true })),
    syncOrders: jest.fn(async () => ({ ok: true, count: 4 })),
    syncCustomers: jest.fn(async () => ({ ok: true, count: 3 })),
    syncProducts: jest.fn(async () => ({ ok: true, count: 2 })),
    getStatus: jest.fn(async () => ({ connected: true })),
    getOauthStartUrl: jest.fn(async () => ({ authUrl: 'https://shop.test' })),
    handleOauthCallback: jest.fn(async () => ({ ok: true })),
    handleOrdersWebhook: jest.fn(async () => ({ ok: true })),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ShopifyIntegrationController],
      providers: [{ provide: ShopifyIntegrationService, useValue: serviceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('connects a store through REST endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/shopify/connect')
      .set('x-tenant-id', 'tenant-1')
      .send({
        shopDomain: 'demo.myshopify.com',
        accessToken: 'shpat_test',
      });
    expect(response.status).toBe(201);
    expect(serviceMock.connectStore).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ shopDomain: 'demo.myshopify.com' })
    );
  });

  it('syncs products through REST endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/shopify/sync/products')
      .set('x-tenant-id', 'tenant-1')
      .send({ limit: 25 });
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(serviceMock.syncProducts).toHaveBeenCalledWith('tenant-1', 25);
  });

  it('reads sync status through REST endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/shopify/status')
      .set('x-tenant-id', 'tenant-1');
    expect(response.status).toBe(200);
    expect(serviceMock.getStatus).toHaveBeenCalledWith('tenant-1');
  });
});
