import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { RateLimitGuard } from '../core/guards/rate-limit.guard';
import { MetricsService } from '../metrics/metrics.service';

const serviceMock = {
  registerTenantOwner: jest.fn(),
  registerAndLogin: jest.fn(),
  loginWithPassword: jest.fn(),
  completeMfaChallenge: jest.fn(),
  beginMfaEnrollment: jest.fn(),
  verifyMfaEnrollment: jest.fn(),
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: serviceMock },
        { provide: RateLimitGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
        { provide: 'REDIS_CLIENT', useValue: null },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MetricsService, useValue: { incrementRateLimitBlock: jest.fn() } },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  it('registerTenantOwner delegates to service', async () => {
    serviceMock.registerTenantOwner.mockResolvedValueOnce({ userId: 'user-1' });
    const result = await resolver.registerTenantOwner({
      email: 'demo@example.com',
      password: 'Secret123!',
      tenantName: 'Tenant',
    });
    expect(result).toEqual({ userId: 'user-1' });
    expect(serviceMock.registerTenantOwner).toHaveBeenCalled();
  });

  it('login mutation proxies to service', async () => {
    serviceMock.loginWithPassword.mockResolvedValueOnce({ access_token: 'token' });
    const response = await resolver.login({ email: 'demo@example.com', password: 'Secret123!' });
    expect(response).toEqual({ access_token: 'token' });
    expect(serviceMock.loginWithPassword).toHaveBeenCalled();
  });

  it('completeMfaLogin delegates challenge completion', async () => {
    serviceMock.completeMfaChallenge.mockResolvedValueOnce({ access_token: 'token' });
    const payload = await resolver.completeMfaLogin({ challengeId: 'challenge-1', token: '123456' });
    expect(payload).toEqual({ access_token: 'token' });
    expect(serviceMock.completeMfaChallenge).toHaveBeenCalledWith({ challengeId: 'challenge-1', token: '123456' });
  });
});
