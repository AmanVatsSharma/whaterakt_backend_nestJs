import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly windowSeconds: number;
  private readonly maxRequests: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: any,
    private readonly config: ConfigService,
  ) {
    this.windowSeconds = Number(this.config.get('RATE_LIMIT_WINDOW_SECONDS') || 60);
    this.maxRequests = Number(this.config.get('RATE_LIMIT_MAX_REQUESTS') || 100);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const gqlCtx = GqlExecutionContext.create(context);
      const req = (gqlCtx.getContext()?.req) || context.switchToHttp().getRequest();
      const tenantId = req.tenant?.id || 'public';
      const routeKey = req.path?.replace(/\//g, ':') || 'unknown';
      const key = `rate_limit:${tenantId}:${routeKey}`;

      // If Redis is unavailable, allow request
      if (!this.redis || typeof this.redis.incr !== 'function') {
        this.logger.warn('Redis unavailable, rate limiting disabled');
        return true;
      }

      const current = await this.redis.incr(key);
      if (current > this.maxRequests) {
        await this.redis.decr(key);
        return false;
      }

      if (current === 1) {
        await this.redis.expire(key, this.windowSeconds);
      }

      return true;
    } catch (e) {
      this.logger.error(`Rate limit error: ${e.message}`);
      return true; // Fail open
    }
  }
} 