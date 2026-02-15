/**
 * File: src/inbox/dto/send-conversation-message.dto.ts
 * Module: inbox
 * Purpose: Payload for sending an outbound message from inbox thread.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsString, MinLength } from 'class-validator';

export class SendConversationMessageDto {
  @IsString()
  @MinLength(1)
  message: string;
}
