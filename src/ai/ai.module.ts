import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';

@Module({
  imports: [HttpModule],
  providers: [AiResolver, AiService],
  exports: [AiService],
})
export class AiModule {} 