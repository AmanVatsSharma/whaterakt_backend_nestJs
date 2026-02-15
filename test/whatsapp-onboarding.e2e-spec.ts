/**
 * File: test/whatsapp-onboarding.e2e-spec.ts
 * Module: whatsapp-onboarding
 * Purpose: E2E validation for managed onboarding and number assignment flow.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Verifies tenant onboarding request and operator assignment path.
 * - Uses AppModule with real middleware and TypeORM repositories.
 */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  TenantOrmEntity,
  WhatsAppAssignmentAuditOrmEntity,
  WhatsAppChannelOrmEntity,
  WhatsAppManagedNumberOrmEntity,
} from '../src/database/entities';

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDatabase('WhatsApp Onboarding Managed Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const tenantId = randomUUID();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = moduleRef.get(DataSource);
    await dataSource.getRepository(TenantOrmEntity).save({
      id: tenantId,
      name: `tenant-${tenantId.slice(0, 8)}`,
      plan: 'standard',
      status: 'active',
      region: 'global',
    });
  });

  afterAll(async () => {
    if (!dataSource) {
      await app?.close?.();
      return;
    }
    await dataSource.getRepository(WhatsAppAssignmentAuditOrmEntity).delete({
      tenantId,
    });
    await dataSource.getRepository(WhatsAppChannelOrmEntity).delete({
      tenantId,
    });
    await dataSource.getRepository(WhatsAppManagedNumberOrmEntity).delete({
      assignedTenantId: tenantId,
    });
    await dataSource.getRepository(TenantOrmEntity).delete({
      id: tenantId,
    });
    await app.close();
  });

  it('creates onboarding request and assigns managed number', async () => {
    const onboardingResponse = await request(app.getHttpServer())
      .post('/whatsapp-onboarding/request')
      .set('x-tenant-id', tenantId)
      .send({
        businessLegalName: 'Acme Pvt Ltd',
        contactEmail: 'ops@acme.example',
        contactPhone: '+919999999999',
      });
    expect(onboardingResponse.status).toBe(201);
    expect(onboardingResponse.body.status).toBeDefined();

    const managedNumberResponse = await request(app.getHttpServer())
      .post('/whatsapp-onboarding/operator/numbers')
      .set('x-tenant-id', tenantId)
      .send({
        phoneNumberId: 'phone-managed-1',
        displayPhoneNumber: '+919111111111',
      });
    expect(managedNumberResponse.status).toBe(201);

    const assignResponse = await request(app.getHttpServer())
      .post('/whatsapp-onboarding/operator/assign')
      .set('x-tenant-id', tenantId)
      .send({
        tenantId,
        phoneNumberId: 'phone-managed-1',
        activateNow: true,
      });
    expect(assignResponse.status).toBe(201);
    expect(assignResponse.body.phoneNumberId).toBe('phone-managed-1');
    expect(['NUMBER_ASSIGNED', 'ACTIVE']).toContain(assignResponse.body.status);
  });
});
