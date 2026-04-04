/**
 * File: src/support/support.controller.ts
 * Module: support
 * Purpose: Persists user feedback for support workflows (BFF-proxied).
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-04-04
 * Notes:
 * - Requires JWT and tenant (same as other product REST).
 */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { RestAuthGuard } from '../core/guards/rest-auth.guard';
import { RestTenantGuard } from '../core/guards/rest-tenant.guard';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@ApiTags('Support')
@Controller('support')
@UseGuards(RestAuthGuard, RestTenantGuard)
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  @Post('feedback')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submit product feedback (logged server-side)' })
  async submitFeedback(@Body() body: SubmitFeedbackDto) {
    const ticketId = `fbk_${randomUUID()}`;
    this.logger.log(
      JSON.stringify({
        ticketId,
        type: body.type ?? 'general',
        source: body.source,
        email: body.email ? '[redacted]' : undefined,
        messagePreview: body.message.slice(0, 200),
      }),
    );
    return {
      ticketId,
      acceptedAt: new Date().toISOString(),
    };
  }
}
