/**
 * File: src/inbox/dto/assign-conversation.dto.ts
 * Module: inbox
 * Purpose: Payload for assigning an inbox conversation to a user.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsString, MinLength } from 'class-validator';

export class AssignConversationDto {
  @IsString()
  @MinLength(1)
  userId: string;
}
