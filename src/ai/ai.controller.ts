/**
 * File: src/ai/ai.controller.ts
 * Module: ai
 * Purpose: REST adapters for AI assistance consumed by frontend BFF.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Keeps BFF contracts stable while backend logic evolves.
 * - Read suggestReply and generateCampaignCopy first.
 */

import { Body, Controller, Post } from '@nestjs/common';
import { AIService } from './ai.service';

interface ReplyBody {
  text?: string;
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
export class AiController {
  constructor(private readonly aiService: AIService) {}

  @Post('reply')
  async suggestReply(@Body() body: ReplyBody) {
    const suggestion = await this.aiService.generateReplySuggestion(
      body?.text || ''
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

