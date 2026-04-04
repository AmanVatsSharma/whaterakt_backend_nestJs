/**
 * @file graphql-smoke.e2e-spec.ts
 * @module test
 * @description Minimal CI smoke: GraphQL `healthCheck` with tenant header (DB tenant inserted for middleware).
 * @author Whaterakt
 * @created 2026-04-04
 */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TenantOrmEntity } from '../src/database/entities/tenant.entity';

describe('GraphQL smoke (e2e)', () => {
  let app: INestApplication;
  let tenantId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const ds = app.get(DataSource);
    const repo = ds.getRepository(TenantOrmEntity);
    const row = repo.create({ name: `ci-graphql-smoke-${Date.now()}` });
    await repo.save(row);
    tenantId = row.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /graphql healthCheck returns OK', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('x-tenant-id', tenantId)
      .send({
        query: '{ healthCheck { status timestamp } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.healthCheck?.status).toBe('OK');
    expect(typeof res.body.data?.healthCheck?.timestamp).toBe('string');
  });
});
