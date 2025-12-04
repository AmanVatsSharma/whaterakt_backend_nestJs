import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '../tenant/tenant.service';
import { PrismaService } from 'src/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { MfaService } from './mfa.service';
import * as bcrypt from 'bcryptjs';

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const tenantServiceMock = {
  createTenant: jest.fn(),
  findById: jest.fn(),
};

const metricsMock = {
  incrementAuthEvent: jest.fn(),
};

const mfaServiceMock = {
  generateArtifacts: jest.fn(),
  renderQrFromSecret: jest.fn(),
  decryptSecret: jest.fn(),
  verifyToken: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
        { provide: TenantService, useValue: tenantServiceMock },
        { provide: MetricsService, useValue: metricsMock },
        { provide: MfaService, useValue: mfaServiceMock },
        { provide: 'REDIS_CLIENT', useValue: null },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registerTenantOwner should create a user and emit metrics', async () => {
    tenantServiceMock.createTenant.mockResolvedValueOnce({ id: 'tenant-1', name: 'Tenant' });
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 'user-1',
      email: 'owner@example.com',
      password: 'hashed',
      tenantId: 'tenant-1',
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    });

    const payload = await service.registerTenantOwner({
      email: 'owner@example.com',
      password: 'Secret123!',
      tenantName: 'Tenant',
    });

    expect(payload).toEqual({
      userId: 'user-1',
      email: 'owner@example.com',
      tenantId: 'tenant-1',
    });
    expect(metricsMock.incrementAuthEvent).toHaveBeenCalledWith('register');
  });

  it('loginWithPassword should return auth payload when credentials are valid and MFA disabled', async () => {
    const hashed = await bcrypt.hash('Secret123!', 12);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-2',
      email: 'login@example.com',
      password: hashed,
      tenantId: 'tenant-2',
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    });
    tenantServiceMock.findById.mockResolvedValueOnce({ id: 'tenant-2', name: 'Tenant' });

    const payload = await service.loginWithPassword({
      email: 'login@example.com',
      password: 'Secret123!',
    });

    expect(payload.access_token).toEqual('token');
    expect(payload.mfaRequired).toBe(false);
    expect(metricsMock.incrementAuthEvent).toHaveBeenCalledWith('login');
  });

  it('loginWithPassword should throw when password mismatches', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-3',
      email: 'login@example.com',
      password: await bcrypt.hash('AnotherSecret!', 12),
      tenantId: 'tenant-3',
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    });

    await expect(
      service.loginWithPassword({
        email: 'login@example.com',
        password: 'WrongPassword',
      }),
    ).rejects.toThrow('Invalid credentials');
  });
});
