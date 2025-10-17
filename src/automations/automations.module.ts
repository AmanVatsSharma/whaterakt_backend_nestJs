import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AutomationsService } from './automations.service';

@Module({
  providers: [PrismaService, AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
