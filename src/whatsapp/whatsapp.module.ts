import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppResolver } from './whatsapp.resolver';
import { PrismaService } from 'src/prisma.service';
import { WhatsAppProcessor } from './whatsapp.processor';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { WhatsAppWebhookController } from './webhook.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forFeature(() => ({
      whatsapp: {
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        graphBase: process.env.WHATSAPP_GRAPH_BASE,
        graphVersion: process.env.WHATSAPP_GRAPH_VERSION,
        defaultPhoneNumberId: process.env.WHATSAPP_DEFAULT_PHONE_NUMBER_ID,
      },
    })),
    BullModule.registerQueue({
      name: 'messages',
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
      // global limiter to avoid provider rate limits (can be tuned)
      limiter: {
        max: Number(process.env.MESSAGES_QUEUE_LIMIT_MAX || 1200),
        duration: Number(process.env.MESSAGES_QUEUE_LIMIT_DURATION || 60000),
      },
    }),
  ],
  providers: [WhatsAppService, PrismaService, WhatsAppResolver, WhatsAppProcessor, WhatsAppAdapter],
  controllers: [WhatsAppWebhookController],
  exports: [WhatsAppService],
})
export class WhatsAppModule {} 