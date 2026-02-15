/**
* File: src/core/guards/rest-auth.guard.ts
* Module: core
* Purpose: Enforce JWT authentication for REST controllers.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-16
* Notes:
* - Wraps passport jwt strategy for HTTP-only routes.
* - Returns consistent UnauthorizedException on missing/invalid tokens.
*/
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RestAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }

  handleRequest<TUser = any>(
    error: unknown,
    user: TUser,
  ): TUser {
    if (error || !user) {
      throw error || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
