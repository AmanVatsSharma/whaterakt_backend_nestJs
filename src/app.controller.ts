/**
* File: src/app.controller.ts
* Module: app
* Purpose: Basic application status controller.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Kept intentionally small for liveness smoke checks.
* - Does not depend on ORM-specific providers.
*/
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
