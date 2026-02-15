/**
* File: src/ai/ai.service.ts
* Module: ai
* Purpose: Multi-provider AI suggestion service for message assistance.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Provider selection is runtime-configurable through AI_PROVIDER.
* - Service is ORM-independent and purely API/network driven.
*/
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AI_PROVIDER } from './ai.constants';

@Injectable()
export class AIService {
  private readonly apiUrl = this.config.get('DEEPSEEK_API_URL');
  private readonly apiKey = this.config.get('DEEPSEEK_API_KEY');

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @Inject(AI_PROVIDER) private readonly providerCfg: { provider: string; model?: string },
  ) {}

  async generateReplySuggestion(context: string) {
    try {
      const data = await this.callProviderAPI(context);
      const suggestion = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.reply || data?.content || '';
      return String(suggestion).trim().slice(0, 160);
    } catch (e: any) {
      // Graceful fallback
      return 'Thanks for reaching out! We will get back to you shortly.';
    }
  }

  async generateCampaignCopy(
    prompt: string,
    tone: 'friendly' | 'formal' | 'urgent' = 'friendly',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<string> {
    const basePrompt = prompt || 'Announce a seasonal campaign with clear CTA.';
    const generated = await this.generateReplySuggestion(
      `[campaign-copy tone=${tone} length=${length}] ${basePrompt}`
    );

    if (generated.length > 20) {
      return generated;
    }

    if (length === 'long') {
      return `${basePrompt} Shop now and enjoy limited-time savings before inventory runs out.`;
    }
    if (length === 'short') {
      return `${basePrompt}`;
    }
    return `${basePrompt} Offer live now.`;
  }

  async summarizeConversation(conversationId?: string, transcript?: string): Promise<string> {
    const summarySeed = transcript || `conversation:${conversationId || 'unknown'}`;
    const generated = await this.generateReplySuggestion(
      `[conversation-summary] ${summarySeed}`
    );
    return `Summary for ${conversationId || 'conversation'}: ${generated}`;
  }

  private async callProviderAPI(context: string): Promise<any> {
    const provider = (this.providerCfg?.provider || 'deepseek').toLowerCase();
    if (provider === 'openai') return this.callOpenAI(context);
    if (provider === 'anthropic') return this.callAnthropic(context);
    if (provider === 'gemini') return this.callGemini(context);
    return this.callDeepseek(context);
  }

  private async callOpenAI(context: string) {
    const url = this.config.get('OPENAI_API_URL') || 'https://api.openai.com/v1/chat/completions';
    const model = this.config.get('OPENAI_MODEL') || 'gpt-4o-mini';
    const response = await firstValueFrom(this.http.post(url, {
      model,
      messages: [
        { role: 'system', content: 'You write short, safe WhatsApp replies (max 120 chars).' },
        { role: 'user', content: context },
      ],
      temperature: 0.5,
      max_tokens: 60,
    }, {
      headers: { Authorization: `Bearer ${this.config.get('OPENAI_API_KEY')}` },
      timeout: 8000,
    }));
    return response.data;
  }

  private async callAnthropic(context: string) {
    const url = this.config.get('ANTHROPIC_API_URL') || 'https://api.anthropic.com/v1/messages';
    const model = this.config.get('ANTHROPIC_MODEL') || 'claude-3-5-sonnet-latest';
    const response = await firstValueFrom(this.http.post(url, {
      model,
      max_tokens: 100,
      temperature: 0.5,
      messages: [
        { role: 'user', content: `Generate a concise, safe WhatsApp reply for: ${context}` },
      ],
    }, {
      headers: {
        'x-api-key': this.config.get('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01',
      },
      timeout: 8000,
    }));
    return response.data;
  }

  private async callGemini(context: string) {
    const model = this.config.get('GEMINI_MODEL') || 'gemini-1.5-flash';
    const url = this.config.get('GEMINI_API_URL') || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.get('GEMINI_API_KEY')}`;
    const response = await firstValueFrom(this.http.post(url, {
      contents: [{ parts: [{ text: `Generate a concise, safe WhatsApp reply (<=120 chars): ${context}` }] }],
    }, { timeout: 8000 }));
    return response.data;
  }

  private async callDeepseek(context: string) {
    const response = await firstValueFrom(
      this.http.post(this.apiUrl, {
        prompt: `Generate a concise, safe WhatsApp reply for: ${context}. 120 chars max, no PII.`,
        max_tokens: 60,
        temperature: 0.5,
      }, {
        headers: {
          Authorization: this.apiKey ? `Bearer ${this.apiKey}` : undefined,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      })
    );
    return response.data ?? {};
  }
}

// Backward-compatible alias for tests
export { AIService as AiService };
