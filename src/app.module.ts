import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { MetricsModule } from './metrics/metrics.module';
import { SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_CONFIG } from './core/swagger/config';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

const logger = new Logger('BullModule');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: true,
      context: ({ req }) => {
        return {
          req,
          tenant: req.tenant
        };
      },
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
    AuthModule,
    CampaignModule,
    ContactModule,
    TemplateModule,
    AiModule,
    CoreModule,
    TenantModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => {
        if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
          logger.warn('Redis config missing - queue system disabled');
          return null;
        }
        
        return {
          redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
          }
        };
      }
    }),
    WhatsAppModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    PrismaService,
    InMemoryMessageQueue,
  ],
})
export class AppModule {}

async function bootstrap() {
  const app = await bootstrap(AppModule);
  
  // Add Swagger documentation
  const document = SwaggerModule.createDocument(app, SWAGGER_CONFIG);
  SwaggerModule.setup('api', app, document);

  // Add global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
