import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RbacPermissionRequirement } from './rbac.decorator';
import { RbacService } from './rbac.service';

export const RBAC_META_KEY = 'rbac_permissions';

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private reflector: Reflector, private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.get<RbacPermissionRequirement[]>(
      RBAC_META_KEY,
      context.getHandler(),
    );
    if (!requirements || requirements.length === 0) {
      return true;
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext()?.req || context.switchToHttp().getRequest();
    const gqlArgs = gqlCtx.getArgs?.() || {};
    const user = req?.user;

    if (!user?.sub) {
      throw new UnauthorizedException('Missing authenticated user for RBAC guard');
    }

    const tenantId =
      req?.tenant?.id ||
      req?.headers?.['x-tenant-id'] ||
      req?.headers?.['X-Tenant-Id'] ||
      user.tenantId;
    const attributes = {
      ...(typeof req?.params === 'object' ? req.params : {}),
      ...(typeof req?.query === 'object' ? req.query : {}),
      ...(typeof req?.body === 'object' ? req.body : {}),
      ...(typeof gqlArgs === 'object' ? gqlArgs : {}),
    };

    for (const permission of requirements) {
      const hasAccess = await this.rbacService.hasAccess(
        user.sub,
        permission.resource,
        permission.action,
        {
          tenantId,
          requiredPlan: permission.requiredPlan,
          attributes,
        },
      );
      if (!hasAccess) {
        this.logger.warn(`RBAC denial user=${user.sub} resource=${permission.resource} action=${permission.action}`);
        throw new UnauthorizedException('Insufficient permissions');
      }
    }

    this.logger.debug(`RBAC granted for user ${user.sub}`);
    return true;
  }
}
