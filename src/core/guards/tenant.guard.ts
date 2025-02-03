import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Tenant } from '../tenant/entities/tenant.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    
    if (!req.tenant || !(req.tenant instanceof Tenant)) {
      throw new Error('Invalid tenant context');
    }
    
    return true;
  }
} 