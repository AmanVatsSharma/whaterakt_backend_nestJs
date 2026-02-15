import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RbacGuard } from './rbac.guard';
import { RbacService } from './rbac.service';

const reflectorMock = {
  get: jest.fn(),
} as unknown as Reflector;

const rbacServiceMock = {
  hasAccess: jest.fn(),
} as unknown as RbacService;

const createExecutionContext = () =>
  ({
    getHandler: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({}) }),
  } as any);

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let gqlCreateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RbacGuard(reflectorMock, rbacServiceMock);
    gqlCreateSpy = jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user: { sub: 'user-1' } } }),
      getArgs: () => ({}),
    } as any);
  });

  afterEach(() => {
    gqlCreateSpy.mockRestore();
  });

  it('allows execution when no permissions metadata is present', async () => {
    (reflectorMock.get as jest.Mock).mockReturnValue(undefined);
    const result = await guard.canActivate(createExecutionContext());
    expect(result).toBe(true);
    expect(rbacServiceMock.hasAccess).not.toHaveBeenCalled();
  });

  it('grants access when RBAC service approves all permissions', async () => {
    (reflectorMock.get as jest.Mock).mockReturnValue([{ resource: 'campaign', action: 'publish' }]);
    (rbacServiceMock.hasAccess as jest.Mock).mockResolvedValue(true);

    const result = await guard.canActivate(createExecutionContext());
    expect(result).toBe(true);
    expect(rbacServiceMock.hasAccess).toHaveBeenCalledWith('user-1', 'campaign', 'publish', {
      tenantId: undefined,
      requiredPlan: undefined,
      attributes: {},
    });
  });

  it('throws UnauthorizedException when RBAC service denies access', async () => {
    (reflectorMock.get as jest.Mock).mockReturnValue([{ resource: 'campaign', action: 'publish' }]);
    (rbacServiceMock.hasAccess as jest.Mock).mockResolvedValue(false);

    await expect(guard.canActivate(createExecutionContext())).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when request user is missing', async () => {
    gqlCreateSpy.mockReturnValueOnce({
      getContext: () => ({ req: {} }),
    } as any);
    (reflectorMock.get as jest.Mock).mockReturnValue([{ resource: 'campaign', action: 'publish' }]);

    await expect(guard.canActivate(createExecutionContext())).rejects.toThrow(UnauthorizedException);
  });
});
