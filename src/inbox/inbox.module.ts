import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ConversationService } from './conversation.service';
import { ConversationResolver } from './conversation.resolver';

@Module({
  providers: [PrismaService, ConversationService, ConversationResolver],
  exports: [ConversationService],
})
export class InboxModule {}
