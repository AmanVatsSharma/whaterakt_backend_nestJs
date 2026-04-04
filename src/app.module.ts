/**
* File: src/app.module.ts
* Module: app
* Purpose: Root Nest module wiring API, workers, security, and data layers.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - TypeORM is initialized via DatabaseModule as the only ORM.
* - Tenant and request-id middleware run globally except webhook/system endpoints.
*/
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { AuthModule } from './auth/auth.module';
import { CampaignModule } from './campaign/campaign.module';
import { ContactModule } from './contact/contact.module';
import { TemplateModule } from './template/template.module';
import { AiModule } from './ai/ai.module';
import { AutomationsModule } from './automations/automations.module';
import { InboxModule } from './inbox/inbox.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CoreModule } from './core/core.module';
import { TenantModule } from './tenant/tenant.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
// inbox and automations will be conditionally imported via OPTIONAL_MODULES
import { Logger } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { RedisProvider } from './core/cache/redis.provider';
import { MetricsModule } from './metrics/metrics.module';
import { AIService } from './ai/ai.service';
import { HttpModule } from '@nestjs/axios';
import { SecurityMiddleware } from './core/middlewares/security.middleware';
import { TenantMiddleware } from './core/middlewares/tenant.middleware';
import { RequestIdMiddleware } from './core/middlewares/request-id.middleware';
import { DatabaseModule } from './database/database.module';
import { RbacModule } from './rbac/rbac.module';
import { IntegrationsModule } from './modules/integrations';
import { ShopifyIntegrationModule } from './modules/shopify-integration';
import { TeamOnboardingModule } from './modules/team-onboarding';
import { WhatsAppOnboardingModule } from './modules/whatsapp-onboarding';
import { SupportModule } from './support/support.module';

const logger = new Logger('BullModule');

const FEATURE_INBOX_ENABLED = process.env.FEATURE_INBOX_ENABLED !== 'false';
const FEATURE_AUTOMATIONS_ENABLED = process.env.FEATURE_AUTOMATIONS_ENABLED !== 'false';
const OPTIONAL_MODULES: any[] = [
  ...(FEATURE_INBOX_ENABLED ? [InboxModule] : []),
  ...(FEATURE_AUTOMATIONS_ENABLED ? [AutomationsModule] : []),
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRootAsync<YogaDriverConfig>({
      driver: YogaDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        const graphiqlEnabled = config.get<string>('GRAPHQL_IDE_ENABLED') === 'true';
        const graphiql =
          !isProd || graphiqlEnabled
            ? {
                title: 'WhatsApp Marketing API Playground',
                headers: JSON.stringify({
                  Authorization: 'Bearer <paste-jwt>',
                  'X-Tenant-Id': '<tenant-uuid>',
                }),
              }
            : false;
        return {
          autoSchemaFile: true,
          context: ({ req }) => ({
            req,
            tenant: req.tenant,
          }),
          subscriptions: {
            'graphql-ws': {
              path: '/graphql',
              onConnect: (context: Record<string, unknown>) => ({ ...context }),
            },
          },
          graphiql,
        };
      },
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
    DatabaseModule,
    AuthModule,
    CampaignModule,
    ContactModule,
    TemplateModule,
    AiModule,
    CoreModule,
    TenantModule,
    ScheduleModule.forRoot(),
    WhatsAppModule,
    AnalyticsModule,
    HealthModule,
    MetricsModule,
    RbacModule,
    IntegrationsModule,
    ShopifyIntegrationModule,
    TeamOnboardingModule,
    WhatsAppOnboardingModule,
    SupportModule,
    HttpModule,
    ...OPTIONAL_MODULES,
  ],
  providers: [RedisProvider, AIService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, SecurityMiddleware)
      .forRoutes('*');

    // Ensure tenant is resolved for all GraphQL and API requests.
    // Exclude provider webhooks that may not use tenant scoping.
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'webhooks/whatsapp', method: RequestMethod.ALL },
        { path: 'shopify/oauth/callback', method: RequestMethod.ALL },
        { path: 'shopify/webhook/orders', method: RequestMethod.ALL },
        { path: 'shopify/webhook/customers', method: RequestMethod.ALL },
        { path: 'shopify/webhook/products', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/live', method: RequestMethod.ALL },
        { path: 'health/ready', method: RequestMethod.ALL },
        { path: 'metrics', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
