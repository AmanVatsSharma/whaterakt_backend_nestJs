/**
 * File: src/core/guards/metrics-bearer.guard.ts
 * Module: core
 * Purpose: Optionally protect /metrics with METRICS_BEARER_TOKEN when set.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-04-04
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class MetricsBearerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.METRICS_BEARER_TOKEN?.trim();
    if (!expected) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    const auth = String(req.headers?.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (token !== expected) {
      throw new UnauthorizedException('Metrics access denied');
    }
    return true;
  }
}
