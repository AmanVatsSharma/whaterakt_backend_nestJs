import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { MetricsService } from '../metrics/metrics.service';
import { RbacService } from '../rbac/rbac.service';
import { TenantService } from '../tenant/tenant.service';

describe('AuthService', () => {
  let service: AuthService;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSignupOtpRequired = process.env.AUTH_SIGNUP_OTP_REQUIRED;
  const originalSignupOtpCode = process.env.AUTH_SIGNUP_OTP_CODE;

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
    process.env.NODE_ENV = 'test';
    process.env.AUTH_SIGNUP_OTP_REQUIRED = 'false';
    delete process.env.AUTH_SIGNUP_OTP_CODE;
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

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSignupOtpRequired === undefined) {
      delete process.env.AUTH_SIGNUP_OTP_REQUIRED;
    } else {
      process.env.AUTH_SIGNUP_OTP_REQUIRED = originalSignupOtpRequired;
    }
    if (originalSignupOtpCode === undefined) {
      delete process.env.AUTH_SIGNUP_OTP_CODE;
    } else {
      process.env.AUTH_SIGNUP_OTP_CODE = originalSignupOtpCode;
    }
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

  it('registerAndLogin should reject when OTP is required and missing', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SIGNUP_OTP_REQUIRED = 'true';
    process.env.AUTH_SIGNUP_OTP_CODE = '123456';

    await expect(
      service.registerAndLogin({
        email: 'owner@example.com',
        password: 'StrongPassword123!',
        tenantName: 'Acme',
      } as any),
    ).rejects.toThrow('Invalid signup OTP');
  });

  it('registerAndLogin should proceed when OTP is valid', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SIGNUP_OTP_REQUIRED = 'true';
    process.env.AUTH_SIGNUP_OTP_CODE = '123456';

    jest.spyOn(service as any, 'createTenantOwner').mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      password: 'hashed',
      tenantId: 'tenant-1',
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    });
    jest.spyOn(service as any, 'buildAuthPayload').mockResolvedValue({
      access_token: 'token',
      mfaRequired: false,
    });

    const result = await service.registerAndLogin({
      email: 'owner@example.com',
      password: 'StrongPassword123!',
      tenantName: 'Acme',
      otpCode: '123456',
    } as any);

    expect(result).toEqual({
      access_token: 'token',
      mfaRequired: false,
    });
  });
});
