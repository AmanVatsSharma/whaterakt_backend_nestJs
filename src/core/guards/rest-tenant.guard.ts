/**
* File: src/core/guards/rest-tenant.guard.ts
* Module: core
* Purpose: Enforce tenant binding between JWT and request tenant context.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-16
* Notes:
* - Blocks x-tenant-id spoofing by requiring jwt.tenantId == resolved tenant.
* - Assumes tenant middleware has already attached request.tenant where required.
*/
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

type RequestWithTenant = Request & {
  user?: { tenantId?: string; userId?: string; sub?: string };
  tenant?: { id?: string };
};

@Injectable()
export class RestTenantGuard implements CanActivate {
  private readonly logger = new Logger(RestTenantGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const userTenantId = request.user?.tenantId || '';
    if (!userTenantId) {
      throw new UnauthorizedException('Authenticated tenant is missing');
    }

    const headerTenant = request.headers['x-tenant-id'];
    const headerTenantId = Array.isArray(headerTenant)
      ? headerTenant[0]
      : headerTenant;
    const resolvedTenantId = request.tenant?.id || headerTenantId || '';
    if (!resolvedTenantId) {
      throw new UnauthorizedException('Tenant context is missing');
    }

    if (resolvedTenantId !== userTenantId) {
      this.logger.warn(
        `Tenant mismatch userTenantId=${userTenantId} resolvedTenantId=${resolvedTenantId}`,
      );
      throw new UnauthorizedException('Tenant mismatch');
    }

    return true;
  }
}
