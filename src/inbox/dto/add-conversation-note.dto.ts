/**
 * File: src/inbox/dto/add-conversation-note.dto.ts
 * Module: inbox
 * Purpose: Payload for adding an internal note to conversation.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsString, MinLength } from 'class-validator';

export class AddConversationNoteDto {
  @IsString()
  @MinLength(1)
  content: string;
}
