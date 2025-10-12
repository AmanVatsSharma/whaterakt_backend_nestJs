import { Module } from '@nestjs/common';
import { TemplateResolver } from './template.resolver';
import { TemplateService } from './template.service';
import { PrismaService } from 'src/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TemplateResolver, TemplateService, PrismaService],
  exports: [TemplateService],
})
export class TemplateModule {}
