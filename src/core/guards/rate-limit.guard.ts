import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const req = context.switchToHttp().getRequest();
      const tenantId = req.tenant?.id;
      const key = `rate_limit:${tenantId}`;

      // If Redis is unavailable, allow request
      if (typeof this.redis.incr !== 'function') {
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