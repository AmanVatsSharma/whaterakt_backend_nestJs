import { Module } from '@nestjs/common';
import { TemplateResolver } from './template.resolver';
import { TemplateService } from './template.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [TemplateResolver, TemplateService, PrismaService],
  exports: [TemplateService],
})
export class TemplateModule {}
