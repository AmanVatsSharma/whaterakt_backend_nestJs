import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forFeature(() => ({
      whatsapp: {
        apiUrl: process.env.WHATSAPP_API_URL,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      },
    })),
  ],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {} 