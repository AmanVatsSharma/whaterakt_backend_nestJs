import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { MetricsService } from '../metrics/metrics.service';
import { RbacService } from '../rbac/rbac.service';
import { TenantService } from '../tenant/tenant.service';

describe('AuthService', () => {
  let service: AuthService;

  const userRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const dataSourceMock = {
    getRepository: jest.fn(() => userRepository),
    transaction: jest.fn(),
    query: jest.fn(),
  };

  const tenantServiceMock = {
    findById: jest.fn(),
  };

  const metricsMock = {
    incrementAuthEvent: jest.fn(),
  };

  const mfaServiceMock = {
    decryptSecret: jest.fn(),
    verifyToken: jest.fn(),
    generateArtifacts: jest.fn(),
    renderQrFromSecret: jest.fn(),
  };

  const rbacServiceMock = {
    assignRole: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    dataSourceMock.getRepository.mockImplementation(() => userRepository);
    service = new AuthService(
      dataSourceMock as any,
      { sign: jest.fn().mockReturnValue('token') } as unknown as JwtService,
      tenantServiceMock as unknown as TenantService,
      metricsMock as unknown as MetricsService,
      mfaServiceMock as unknown as MfaService,
      rbacServiceMock as unknown as RbacService,
      null,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('loginWithPassword should throw when user does not exist', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);
    await expect(
      service.loginWithPassword({
        email: 'missing@example.com',
        password: 'AnyPassword123!',
      }),
    ).rejects.toThrow('Invalid credentials');
  });
});
