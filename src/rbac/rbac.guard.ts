import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RbacService } from './rbac.service';

export const RBAC_META_KEY = 'rbac_permissions';

interface RbacRequirement {
  resource: string;
  action: string;
}

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private reflector: Reflector, private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.get<RbacRequirement[]>(RBAC_META_KEY, context.getHandler());
    if (!requirements || requirements.length === 0) {
      return true;
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext()?.req || context.switchToHttp().getRequest();
    const user = req?.user;

    if (!user?.sub) {
      throw new UnauthorizedException('Missing authenticated user for RBAC guard');
    }

    for (const permission of requirements) {
      const hasAccess = await this.rbacService.hasAccess(user.sub, permission.resource, permission.action);
      if (!hasAccess) {
        this.logger.warn(`RBAC denial user=${user.sub} resource=${permission.resource} action=${permission.action}`);
        throw new UnauthorizedException('Insufficient permissions');
      }
    }

    this.logger.debug(`RBAC granted for user ${user.sub}`);
    return true;
  }
}
