/**
* File: src/inbox/inbox.module.ts
* Module: inbox
* Purpose: Inbox module for conversation assignment, status, and notes.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Conversation service uses TypeORM-managed conversation tables.
* - Resolver/controller methods remain thin and mutation-oriented.
*/
import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationResolver } from './conversation.resolver';
import { InboxController } from './inbox.controller';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  controllers: [InboxController],
  providers: [ConversationService, ConversationResolver],
  exports: [ConversationService],
})
export class InboxModule {}
