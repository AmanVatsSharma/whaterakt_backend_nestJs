import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { AuthModule } from './auth/auth.module';
import { CampaignModule } from './campaign/campaign.module';
import { ContactModule } from './contact/contact.module';
import { TemplateModule } from './template/template.module';
import { PrismaService } from './prisma.service';
import { AiModule } from './ai/ai.module';
import { CoreModule } from './core/core.module';
import { TenantModule } from './tenant/tenant.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { Logger } from '@nestjs/common';
import { InMemoryMessageQueue } from './core/queues/in-memory.queue';
import { HealthModule } from './health/health.module';
import { RedisProvider } from './core/cache/redis.provider';
import { MetricsModule } from './metrics/metrics.module';
import { AIService } from './ai/ai.service';
import { HttpModule } from '@nestjs/axios';
import { SecurityMiddleware } from './core/middlewares/security.middleware';

const logger = new Logger('BullModule');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: true,
      context: ({ req }) => ({
        req,
        tenant: req.tenant
      }),
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
          onConnect: (context) => ({ ...context }),
        }
      },
      graphiql: {
        title: 'WhatsApp Marketing API Playground',
        headers: JSON.stringify({
          'X-API-KEY': 'development',
        }),
      }
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('REDIS_HOST') ? {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        } : undefined,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    CampaignModule,
    ContactModule,
    TemplateModule,
    AiModule,
    CoreModule,
    TenantModule,
    ScheduleModule.forRoot(),
    WhatsAppModule,
    HealthModule,
    MetricsModule,
    HttpModule,
  ],
  providers: [
    PrismaService,
    InMemoryMessageQueue,
    RedisProvider,
    AIService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}
