import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly windowSeconds: number;
  private readonly maxRequests: number;
  private readonly failClosed: boolean;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: any,
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {
    this.windowSeconds = Number(this.config.get('RATE_LIMIT_WINDOW_SECONDS') || 60);
    this.maxRequests = Number(this.config.get('RATE_LIMIT_MAX_REQUESTS') || 100);
    this.failClosed = this.config.get<string>('RATE_LIMIT_FAIL_CLOSED') === 'true';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const gqlCtx = GqlExecutionContext.create(context);
      const req = gqlCtx.getContext()?.req || context.switchToHttp().getRequest();
      const tenantId = req.tenant?.id || 'public';
      const routeKey = (req.path || req?.route?.path || 'unknown').replace(/\//g, ':');
      const key = `rate_limit:${tenantId}:${routeKey}`;

      if (!this.redis || typeof this.redis.incr !== 'function') {
        this.logger.warn('Redis unavailable, rate limiting disabled');
        if (this.failClosed) {
          this.metrics.incrementRateLimitGuardDegraded('redis_unavailable');
          throw new ServiceUnavailableException('Rate limiting unavailable');
        }
        return true;
      }

      const current = await this.redis.incr(key);
      if (current > this.maxRequests) {
        await this.redis.decr(key);
        this.metrics.incrementRateLimitBlock(tenantId);
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      if (current === 1) {
        await this.redis.expire(key, this.windowSeconds);
      }

      return true;
    } catch (e) {
      if (e instanceof HttpException || e instanceof ServiceUnavailableException) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : 'unknown';
      this.logger.error(`Rate limit error: ${msg}`);
      if (this.failClosed) {
        this.metrics.incrementRateLimitGuardDegraded('redis_error');
        throw new ServiceUnavailableException('Rate limiting error');
      }
      return true;
    }
  }
} 