import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

function sign(body: any, secret: string) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret).update(JSON.stringify(body), 'utf8').digest('hex');
  return `sha256=${hmac}`;
}

describe('WhatsApp Webhook (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.WHATSAPP_APP_SECRET = 'secret';
    process.env.WHATSAPP_TENANT_PHONE_MAP = JSON.stringify({ '111': 'tenant-1' });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('verifies GET challenge', async () => {
    const res = await request(app.getHttpServer())
      .get('/webhooks/whatsapp')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'token', 'hub.challenge': 'CHALL' });
    expect(res.status).toBe(200);
  });

  it('rejects invalid signature', async () => {
    const body = { entry: [{ changes: [{ value: { metadata: { phone_number_id: '111' }, messages: [] } }] }] };
    const res = await request(app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('x-hub-signature-256', 'sha256=bad')
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(false);
  });

  it('accepts valid signature and persists', async () => {
    const body = { entry: [{ changes: [{ value: { metadata: { phone_number_id: '111' }, messages: [{ id: 'wa1', from: '123', text: { body: 'hi' } }] } }] }] };
    const sig = sign(body, 'secret');
    const res = await request(app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('x-hub-signature-256', sig)
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });
});
