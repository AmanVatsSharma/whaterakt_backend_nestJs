/**
 * File: test/security-authorization.e2e-spec.ts
 * Module: security
 * Purpose: Validate REST auth, tenant isolation, and operator RBAC controls.
 * Author: BharatERP
 * created: 2026-02-16
 */
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  TenantOrmEntity,
  UserOrmEntity,
  WhatsAppAssignmentAuditOrmEntity,
  WhatsAppChannelOrmEntity,
  WhatsAppManagedNumberOrmEntity,
} from '../src/database/entities';
import { seedRbacDefaults } from '../src/rbac/rbac.seed';
import { RbacService } from '../src/rbac/rbac.service';

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;

type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
};

describeWithDatabase('Security authorization (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let rbacService: RbacService;
  let tenantAId: string;
  let tenantBId: string;
  let ownerUser: AuthUser;
  let memberUser: AuthUser;

  const signToken = (user: AuthUser) =>
    jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    });

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = moduleRef.get(DataSource);
    jwtService = moduleRef.get(JwtService);
    rbacService = moduleRef.get(RbacService);

    tenantAId = randomUUID();
    tenantBId = randomUUID();
    await dataSource.getRepository(TenantOrmEntity).save([
      {
        id: tenantAId,
        name: `tenant-a-${tenantAId.slice(0, 6)}`,
        plan: 'standard',
        status: 'active',
        region: 'global',
      },
      {
        id: tenantBId,
        name: `tenant-b-${tenantBId.slice(0, 6)}`,
        plan: 'standard',
        status: 'active',
        region: 'global',
      },
    ]);

    const users = await dataSource.getRepository(UserOrmEntity).save([
      {
        email: `owner-${tenantAId.slice(0, 6)}@example.com`,
        password: 'hashed-password',
        tenantId: tenantAId,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      },
      {
        email: `member-${tenantAId.slice(0, 6)}@example.com`,
        password: 'hashed-password',
        tenantId: tenantAId,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      },
    ]);
    ownerUser = {
      id: users[0].id,
      tenantId: users[0].tenantId,
      email: users[0].email,
    };
    memberUser = {
      id: users[1].id,
      tenantId: users[1].tenantId,
      email: users[1].email,
    };

    await seedRbacDefaults(dataSource, tenantAId);
    await rbacService.assignRole(tenantAId, ownerUser.id, 'Owner');
  });

  afterAll(async () => {
    if (!dataSource) {
      await app?.close?.();
      return;
    }
    await dataSource.getRepository(WhatsAppAssignmentAuditOrmEntity).delete({
      tenantId: tenantAId,
    });
    await dataSource.getRepository(WhatsAppChannelOrmEntity).delete({
      tenantId: tenantAId,
    });
    await dataSource.getRepository(WhatsAppManagedNumberOrmEntity).delete({
      assignedTenantId: tenantAId,
    });
    await dataSource.getRepository(UserOrmEntity).delete({ tenantId: tenantAId });
    await dataSource.getRepository(TenantOrmEntity).delete({ id: tenantAId });
    await dataSource.getRepository(TenantOrmEntity).delete({ id: tenantBId });
    await app.close();
  });

  it('rejects operator endpoint without JWT token', async () => {
    const response = await request(app.getHttpServer())
      .get('/whatsapp-onboarding/operator/numbers')
      .set('x-tenant-id', tenantAId);

    expect(response.status).toBe(401);
  });

  it('rejects tenant spoofing when JWT tenant and header tenant mismatch', async () => {
    const response = await request(app.getHttpServer())
      .get('/whatsapp-onboarding/operator/numbers')
      .set('x-tenant-id', tenantBId)
      .set('authorization', `Bearer ${signToken(ownerUser)}`);

    expect(response.status).toBe(401);
  });

  it('rejects operator endpoint when user lacks operator permissions', async () => {
    const response = await request(app.getHttpServer())
      .get('/whatsapp-onboarding/operator/numbers')
      .set('x-tenant-id', tenantAId)
      .set('authorization', `Bearer ${signToken(memberUser)}`);

    expect(response.status).toBe(401);
  });

  it('allows operator endpoint when owner has seeded permissions', async () => {
    const response = await request(app.getHttpServer())
      .get('/whatsapp-onboarding/operator/numbers')
      .set('x-tenant-id', tenantAId)
      .set('authorization', `Bearer ${signToken(ownerUser)}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
