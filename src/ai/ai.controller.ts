/**
 * File: src/ai/ai.controller.ts
 * Module: ai
 * Purpose: REST adapters for AI assistance consumed by frontend BFF.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-04-04
 * Notes:
 * - Requires JWT + tenant binding (same as other REST surfaces).
 * - Read suggestReply and generateCampaignCopy first.
 */

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { RestAuthGuard } from '../core/guards/rest-auth.guard';
import { RestTenantGuard } from '../core/guards/rest-tenant.guard';

interface ReplyBody {
  text?: string;
  conversationId?: string;
}

interface GenerateBody {
  prompt?: string;
  tone?: 'friendly' | 'formal' | 'urgent';
  length?: 'short' | 'medium' | 'long';
}

interface SummarizeBody {
  conversationId?: string;
  transcript?: string;
}

@Controller('ai')
@UseGuards(RestAuthGuard, RestTenantGuard)
export class AiController {
  constructor(private readonly aiService: AIService) {}

  @Post('reply')
  async suggestReply(@Body() body: ReplyBody) {
    const suggestion = await this.aiService.generateReplySuggestion(
      body?.text || '',
      body?.conversationId,
    );
    return { suggestion };
  }

  @Post('generate')
  async generateCampaignCopy(@Body() body: GenerateBody) {
    const content = await this.aiService.generateCampaignCopy(
      body?.prompt || '',
      body?.tone || 'friendly',
      body?.length || 'medium'
    );
    return { content };
  }

  @Post('summarize')
  async summarizeConversation(@Body() body: SummarizeBody) {
    const summary = await this.aiService.summarizeConversation(
      body?.conversationId,
      body?.transcript
    );
    return { summary };
  }
}

