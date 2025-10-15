import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(conversationId: string, userId: string) {
    return this.prisma.conversation.update({ where: { id: conversationId }, data: { assignedUserId: userId } });
  }

  async setStatus(conversationId: string, status: 'OPEN' | 'PENDING' | 'CLOSED') {
    return this.prisma.conversation.update({ where: { id: conversationId }, data: { status } });
  }

  async addNote(conversationId: string, userId: string, content: string) {
    return this.prisma.conversationNote.create({ data: { conversationId, userId, content } });
  }

  async tag(conversationId: string, tenantId: string, tagName: string) {
    const tag = await this.prisma.tag.upsert({
      where: { tenantId_name: { tenantId, name: tagName } },
      update: {},
      create: { tenantId, name: tagName },
    });
    return this.prisma.conversationTag.upsert({
      where: { conversationId_tagId: { conversationId, tagId: tag.id } },
      update: {},
      create: { conversationId, tagId: tag.id },
    });
  }
}
