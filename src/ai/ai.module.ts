import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AIService } from './ai.service';
import { AiResolver } from './ai.resolver';

@Module({
  imports: [HttpModule],
  providers: [AiResolver, AIService],
  exports: [AIService],
})
export class AiModule {} 