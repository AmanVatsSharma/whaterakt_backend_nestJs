import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenantMiddleware } from '../core/middlewares/tenant.middleware';
import { PrismaService } from 'src/prisma.service';
import { TenantService } from './tenant.service';

@Module({
  providers: [PrismaService, TenantService],
  exports: [TenantService],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
} 