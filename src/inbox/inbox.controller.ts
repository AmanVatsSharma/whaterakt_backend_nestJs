/**
 * File: src/inbox/inbox.controller.ts
 * Module: inbox
 * Purpose: REST endpoints for inbox data consumed by Next BFF.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Uses tenant id from request context/middleware header.
 * - Read listConversations first.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { RestAuthGuard } from '../core/guards/rest-auth.guard';
import { RestTenantGuard } from '../core/guards/rest-tenant.guard';
import { ConversationService } from './conversation.service';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { SetConversationStatusDto } from './dto/set-conversation-status.dto';
import { AddConversationNoteDto } from './dto/add-conversation-note.dto';
import { TagConversationDto } from './dto/tag-conversation.dto';
import { SendConversationMessageDto } from './dto/send-conversation-message.dto';
import { ConversationStatus } from '../database/entities';

type RequestWithTenant = Request & {
  tenant?: { id?: string };
  user?: { userId?: string };
};

@Controller('inbox')
@UseGuards(RestAuthGuard, RestTenantGuard)
export class InboxController {
  constructor(private readonly conversationService: ConversationService) {}

  private resolveTenantId(
    request: RequestWithTenant,
    tenantHeader?: string,
  ) {
    return request.tenant?.id || tenantHeader || '';
  }

  @Get('conversations')
  async listConversations(
    @Req() request: RequestWithTenant,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('tag') tag?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    if (!tenantId) {
      return { data: [] };
    }

    const data = await this.conversationService.listConversations(tenantId, {
      search,
      status: status as ConversationStatus | undefined,
      assignedUserId,
      tag,
    });
    return { data };
  }

  @Get('conversations/:conversationId/thread')
  async getThread(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    const data = await this.conversationService.getConversationThread(
      tenantId,
      conversationId,
    );
    return { data };
  }

  @Patch('conversations/:conversationId/assignment')
  async assignConversation(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: AssignConversationDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.assign(tenantId, conversationId, body.userId);
    return { ok: true };
  }

  @Patch('conversations/:conversationId/status')
  async setStatus(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: SetConversationStatusDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.setStatus(
      tenantId,
      conversationId,
      body.status as ConversationStatus,
    );
    return { ok: true };
  }

  @Post('conversations/:conversationId/notes')
  async addNote(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: AddConversationNoteDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    const userId = request.user?.userId || 'system';
    await this.conversationService.addNote(
      tenantId,
      conversationId,
      userId,
      body.content,
    );
    return { ok: true };
  }

  @Post('conversations/:conversationId/tags')
  async addTag(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: TagConversationDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.tag(tenantId, conversationId, body.tag);
    return { ok: true };
  }

  @Delete('conversations/:conversationId/tags/:tag')
  async removeTag(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Param('tag') tag: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.untag(
      tenantId,
      conversationId,
      decodeURIComponent(tag),
    );
    return { ok: true };
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Req() request: RequestWithTenant,
    @Param('conversationId') conversationId: string,
    @Body() body: SendConversationMessageDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = this.resolveTenantId(request, tenantHeader);
    await this.conversationService.sendMessage(tenantId, conversationId, body.message);
    return { ok: true };
  }
}

