import { Resolver, Query } from '@nestjs/graphql';
import { ApiTags } from '@nestjs/swagger';
import { Health } from './entities/health.entity';

@Resolver(() => Health)
export class HealthResolver {
  @Query(() => Health)
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
} 