import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: any) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const gqlCtx = GqlExecutionContext.create(context);
      const req = (gqlCtx.getContext()?.req) || context.switchToHttp().getRequest();
      const tenantId = req.tenant?.id;
      const key = `rate_limit:${tenantId}`;

      // If Redis is unavailable, allow request
      if (!this.redis || typeof this.redis.incr !== 'function') {
        this.logger.warn('Redis unavailable, rate limiting disabled');
        return true;
      }

      const current = await this.redis.incr(key);
      if (current > 100) {
        await this.redis.decr(key);
        return false;
      }

      if (current === 1) {
        await this.redis.expire(key, 60);
      }

      return true;
    } catch (e) {
      this.logger.error(`Rate limit error: ${e.message}`);
      return true; // Fail open
    }
  }
} 