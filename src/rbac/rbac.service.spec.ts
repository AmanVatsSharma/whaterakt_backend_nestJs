import { AppError } from '../common/errors';
import { RbacService } from './rbac.service';

describe('RbacService', () => {
  const roleRepo = {
    findOne: jest.fn(),
  };
  const permissionRepo = {
    findOne: jest.fn(),
  };
  const queryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };
  const userRoleRepo = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };

  const originalCacheTtl = process.env.RBAC_CACHE_TTL_MS;
  let service: RbacService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RBAC_CACHE_TTL_MS = '60000';
    service = new RbacService(roleRepo as any, permissionRepo as any, userRoleRepo as any);
  });

  afterAll(() => {
    process.env.RBAC_CACHE_TTL_MS = originalCacheTtl;
  });

  it('throws AppError when assigning a missing role', async () => {
    roleRepo.findOne.mockResolvedValue(null);

    await expect(service.assignRole('tenant-1', 'user-1', 'Owner')).rejects.toBeInstanceOf(
      AppError,
    );
    expect(userRoleRepo.save).not.toHaveBeenCalled();
  });

  it('returns existing assignment without duplicate inserts', async () => {
    roleRepo.findOne.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1', name: 'Owner' });
    userRoleRepo.findOne.mockResolvedValue({ id: 'existing-assignment' });

    const assignment = await service.assignRole('tenant-1', 'user-1', 'Owner');

    expect(assignment).toEqual({ id: 'existing-assignment' });
    expect(userRoleRepo.save).not.toHaveBeenCalled();
  });

  it('caches hasAccess evaluation per policy context', async () => {
    permissionRepo.findOne.mockResolvedValue({ id: 'permission-1' });
    queryBuilder.getMany.mockResolvedValue([
      {
        role: {
          tenantId: 'tenant-1',
          tenant: { plan: 'pro' },
          metadata: {},
        },
        constraints: {},
      },
    ]);

    const first = await service.hasAccess('user-1', 'campaign', 'publish', {
      tenantId: 'tenant-1',
      requiredPlan: 'growth',
      attributes: { input: { campaignId: 'c1' } },
    });
    const second = await service.hasAccess('user-1', 'campaign', 'publish', {
      tenantId: 'tenant-1',
      requiredPlan: 'growth',
      attributes: { input: { campaignId: 'c1' } },
    });

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
  });

  it('enforces attribute-based constraints', async () => {
    permissionRepo.findOne.mockResolvedValue({ id: 'permission-2' });
    queryBuilder.getMany.mockResolvedValue([
      {
        role: {
          tenantId: 'tenant-1',
          tenant: { plan: 'enterprise' },
          metadata: {},
        },
        constraints: {
          'input.contactId': 'contact-123',
        },
      },
    ]);

    const denied = await service.hasAccess('user-2', 'campaign', 'publish', {
      tenantId: 'tenant-1',
      attributes: {
        input: {
          contactId: 'contact-999',
        },
      },
    });
    const granted = await service.hasAccess('user-2', 'campaign', 'publish', {
      tenantId: 'tenant-1',
      attributes: {
        input: {
          contactId: 'contact-123',
        },
      },
    });

    expect(denied).toBe(false);
    expect(granted).toBe(true);
  });

  it('enforces required plan entitlement checks', async () => {
    permissionRepo.findOne.mockResolvedValue({ id: 'permission-3' });
    queryBuilder.getMany.mockResolvedValue([
      {
        role: {
          tenantId: 'tenant-1',
          tenant: { plan: 'starter' },
          metadata: {},
        },
        constraints: {},
      },
    ]);

    const denied = await service.hasAccess('user-3', 'campaign', 'publish', {
      tenantId: 'tenant-1',
      requiredPlan: 'pro',
    });

    queryBuilder.getMany.mockResolvedValueOnce([
      {
        role: {
          tenantId: 'tenant-1',
          tenant: { plan: 'enterprise' },
          metadata: {},
        },
        constraints: {},
      },
    ]);

    const granted = await service.hasAccess('user-3', 'campaign', 'publish', {
      tenantId: 'tenant-1',
      requiredPlan: 'pro',
      attributes: { context: 'different-cache-key' },
    });

    expect(denied).toBe(false);
    expect(granted).toBe(true);
  });
});
