import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma1: PrismaService,
    @Inject('TEST') private readonly prisma2: PrismaService
  ) {
    console.log(prisma1 === prisma2); // Should log true
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
