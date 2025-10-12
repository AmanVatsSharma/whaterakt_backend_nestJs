import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Optional() private readonly prisma1?: PrismaService,
    @Optional() @Inject('TEST') private readonly prisma2?: PrismaService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
