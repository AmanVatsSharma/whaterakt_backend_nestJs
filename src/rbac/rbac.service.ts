import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppError } from '../common/errors';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';

type AccessEvaluationOptions = {
  tenantId?: string;
  requiredPlan?: string;
  attributes?: Record<string, unknown>;
};

type AccessCacheEntry = {
  allowed: boolean;
  expiresAt: number;
};

const DEFAULT_RBAC_CACHE_TTL_MS = 15_000;
const PLAN_RANK: Record<string, number> = {
  free: 0,
  standard: 1,
  starter: 1,
  growth: 2,
  pro: 3,
  enterprise: 4,
};

function resolveCacheTtlMs() {
  const parsed = Number(process.env.RBAC_CACHE_TTL_MS ?? DEFAULT_RBAC_CACHE_TTL_MS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_RBAC_CACHE_TTL_MS;
  }
  return parsed;
}

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly cacheTtlMs = resolveCacheTtlMs();
  private readonly accessCache = new Map<string, AccessCacheEntry>();

  constructor(
    @InjectRepository(RoleEntity) private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity) private readonly permissionRepo: Repository<PermissionEntity>,
    @InjectRepository(UserRoleEntity) private readonly userRoleRepo: Repository<UserRoleEntity>,
  ) {}

  /**
   * Assigns a role to a user within a tenant boundary.
   */
  async assignRole(tenantId: string, userId: string, roleName: string) {
    this.logger.log(`Assigning role ${roleName} to user ${userId} in tenant ${tenantId}`);
    const role = await this.roleRepo.findOne({ where: { tenantId, name: roleName } });
    if (!role) {
      throw new AppError(
        'RBAC_ROLE_NOT_FOUND',
        `Role ${roleName} not found for tenant ${tenantId}`,
        404,
        { tenantId, roleName },
      );
    }

    const existingAssignment = await this.userRoleRepo.findOne({
      where: { userId, roleId: role.id },
    });
    if (existingAssignment) {
      return existingAssignment;
    }

    const assignment = this.userRoleRepo.create({
      userId,
      roleId: role.id,
    });
    const saved = await this.userRoleRepo.save(assignment);
    this.clearUserAccessCache(userId);
    return saved;
  }

  /**
   * Evaluates whether a user has access to a resource/action combo.
   * Supports plan entitlement checks, attribute constraints, and short-lived caching.
   */
  async hasAccess(
    userId: string,
    resource: string,
    action: string,
    options: AccessEvaluationOptions = {},
  ) {
    const cacheKey = this.buildCacheKey(userId, resource, action, options);
    const cachedDecision = this.getCachedDecision(cacheKey);
    if (cachedDecision !== null) {
      return cachedDecision;
    }

    this.logger.log(`Evaluating RBAC for user=${userId} resource=${resource} action=${action}`);
    const permission = await this.permissionRepo.findOne({ where: { resource, action } });
    if (!permission) {
      this.setCachedDecision(cacheKey, false);
      return false;
    }

    const assignments = await this.userRoleRepo
      .createQueryBuilder('userRole')
      .innerJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.tenant', 'tenant')
      .innerJoin('role.rolePermissions', 'rolePermission')
      .where('userRole.userId = :userId', { userId })
      .andWhere('rolePermission.permissionId = :permissionId', {
        permissionId: permission.id,
      })
      .getMany();

    const allowed = assignments.some((assignment) =>
      this.matchesAssignmentPolicies(assignment, options),
    );

    this.setCachedDecision(cacheKey, allowed);
    return allowed;
  }

  private matchesAssignmentPolicies(
    assignment: UserRoleEntity,
    options: AccessEvaluationOptions,
  ) {
    if (!assignment.role) {
      return false;
    }

    if (options.tenantId && assignment.role.tenantId !== options.tenantId) {
      return false;
    }

    const rolePlan = this.normalizePlan(
      assignment.role.tenant?.plan || assignment.role.metadata?.planTier,
    );
    if (!this.satisfiesPlanRequirement(options.requiredPlan, rolePlan)) {
      return false;
    }

    return this.satisfiesAttributeConstraints(assignment.constraints, options.attributes);
  }

  private satisfiesPlanRequirement(requiredPlan?: string, assignmentPlan?: string) {
    if (!requiredPlan) {
      return true;
    }
    const requiredRank = this.planRank(requiredPlan);
    const assignmentRank = this.planRank(assignmentPlan || 'standard');
    return assignmentRank >= requiredRank;
  }

  private planRank(plan: string) {
    const normalized = this.normalizePlan(plan);
    return PLAN_RANK[normalized] ?? PLAN_RANK.standard;
  }

  private normalizePlan(plan?: string | null) {
    return String(plan || 'standard').trim().toLowerCase();
  }

  private satisfiesAttributeConstraints(
    constraints?: Record<string, any>,
    attributes?: Record<string, unknown>,
  ) {
    if (!constraints || Object.keys(constraints).length === 0) {
      return true;
    }

    const attributeBag = attributes || {};
    return Object.entries(constraints).every(([key, expected]) => {
      const actual = this.resolveAttribute(attributeBag, key);

      if (Array.isArray(expected)) {
        return expected.includes(actual);
      }
      if (expected && typeof expected === 'object' && Array.isArray(expected.in)) {
        return expected.in.includes(actual);
      }
      return actual === expected;
    });
  }

  private resolveAttribute(
    attributes: Record<string, unknown>,
    dottedPath: string,
  ): unknown {
    return dottedPath.split('.').reduce<unknown>((current, segment) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, attributes);
  }

  private buildCacheKey(
    userId: string,
    resource: string,
    action: string,
    options: AccessEvaluationOptions,
  ) {
    return [
      userId,
      resource,
      action,
      options.tenantId || '-',
      this.normalizePlan(options.requiredPlan || '-'),
      this.serializeAttributes(options.attributes),
    ].join('::');
  }

  private getCachedDecision(cacheKey: string): boolean | null {
    const cached = this.accessCache.get(cacheKey);
    if (!cached) {
      return null;
    }
    if (Date.now() > cached.expiresAt) {
      this.accessCache.delete(cacheKey);
      return null;
    }
    return cached.allowed;
  }

  private setCachedDecision(cacheKey: string, allowed: boolean) {
    this.accessCache.set(cacheKey, {
      allowed,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private clearUserAccessCache(userId: string) {
    const cachePrefix = `${userId}::`;
    for (const key of this.accessCache.keys()) {
      if (key.startsWith(cachePrefix)) {
        this.accessCache.delete(key);
      }
    }
  }

  private serializeAttributes(attributes?: Record<string, unknown>) {
    if (!attributes || Object.keys(attributes).length === 0) {
      return '-';
    }
    const normalized = Object.keys(attributes)
      .sort()
      .map((key) => [key, attributes[key]]);
    return JSON.stringify(normalized);
  }
}
