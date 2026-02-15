/**
 * File: src/inbox/dto/set-conversation-status.dto.ts
 * Module: inbox
 * Purpose: Payload for updating an inbox conversation status.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { IsIn, IsString } from 'class-validator';

export class SetConversationStatusDto {
  @IsString()
  @IsIn(['OPEN', 'PENDING', 'CLOSED'])
  status: 'OPEN' | 'PENDING' | 'CLOSED';
}
