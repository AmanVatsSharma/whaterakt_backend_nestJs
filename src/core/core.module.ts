import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { TenantGuard } from './guards/tenant.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { RedisProvider } from './cache/redis.provider';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [
    PrismaService,
    TenantGuard,
    RateLimitGuard,
    RedisProvider
  ],
  exports: [
    PrismaService,
    TenantGuard,
    RateLimitGuard,
    RedisProvider
  ],
})
export class CoreModule {} 