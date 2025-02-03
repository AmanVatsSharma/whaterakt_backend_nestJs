import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppResolver } from './whatsapp.resolver';
import { PrismaService } from 'src/prisma.service';
import { WhatsAppProcessor } from './whatsapp.processor';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forFeature(() => ({
      whatsapp: {
        apiUrl: process.env.WHATSAPP_API_URL,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      },
    })),
    BullModule.registerQueue({
      name: 'messages',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    }),
  ],
  providers: [WhatsAppService, PrismaService, WhatsAppResolver, WhatsAppProcessor],
  exports: [WhatsAppService],
})
export class WhatsAppModule {} 