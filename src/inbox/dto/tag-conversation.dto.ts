/**
 * File: src/inbox/dto/tag-conversation.dto.ts
 * Module: inbox
 * Purpose: Payload for tagging a conversation.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsString, MinLength } from 'class-validator';

export class TagConversationDto {
  @IsString()
  @MinLength(1)
  tag: string;
}
