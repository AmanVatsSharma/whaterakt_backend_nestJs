import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { TenantGuard } from './guards/tenant.guard';
import { RedisProvider } from './cache/redis.provider';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [PrismaService, TenantGuard, RedisProvider],
  exports: [PrismaService, TenantGuard, RedisProvider],
})
export class CoreModule {} 