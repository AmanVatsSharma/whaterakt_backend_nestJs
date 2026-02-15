import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AIService } from './ai.service';
import { AiResolver } from './ai.resolver';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AI_PROVIDER } from './ai.constants';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [AiController],
  providers: [
    AiResolver,
    AIService,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = (config.get('AI_PROVIDER') as string) || 'deepseek';
        const model = config.get('OPENAI_MODEL') || config.get('ANTHROPIC_MODEL') || config.get('GEMINI_MODEL');
        return { provider, model };
      },
    },
  ],
  exports: [AIService, AI_PROVIDER],
})
export class AiModule {} 