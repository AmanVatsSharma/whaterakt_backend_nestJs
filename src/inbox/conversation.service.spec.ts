/**
 * File: src/inbox/conversation.service.spec.ts
 * Module: inbox
 * Purpose: Unit coverage for inbox filtering and tag lifecycle behavior.
 * Author: BharatERP
 * created: 2026-02-16
 */

import { ConversationService } from './conversation.service';
import {
  ConversationOrmEntity,
  ConversationStatus,
  ConversationTagOrmEntity,
  TagOrmEntity,
} from '../database/entities';

describe('ConversationService', () => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const conversationRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const tagRepository = {
    findOne: jest.fn(),
  };

  const conversationTagRepository = {
    delete: jest.fn(),
  };

  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === ConversationOrmEntity) {
        return conversationRepository;
      }
      if (entity === TagOrmEntity) {
        return tagRepository;
      }
      if (entity === ConversationTagOrmEntity) {
        return conversationTagRepository;
      }
      return conversationRepository;
    }),
  } as any;

  const service = new ConversationService(dataSource, {
    sendMessage: jest.fn(),
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.getMany.mockResolvedValue([]);
    conversationRepository.findOne.mockResolvedValue({
      id: 'conversation-1',
      tenantId: 'tenant-1',
    });
    tagRepository.findOne.mockResolvedValue(null);
    conversationTagRepository.delete.mockResolvedValue({ affected: 1 });
  });

  it('returns mapped conversations with contact metadata and unique tags', async () => {
    queryBuilder.getMany.mockResolvedValueOnce([
      {
        id: 'conversation-1',
        contactId: 'contact-1',
        contact: {
          phone: '919999999999',
          firstName: 'Aman',
          lastName: 'Sharma',
        },
        status: ConversationStatus.OPEN,
        assignedUserId: 'user-1',
        assignedUser: { email: 'agent@demo.com' },
        lastMessage: new Date('2026-02-16T09:00:00.000Z'),
        tags: [{ tag: { name: 'vip' } }, { tag: { name: 'vip' } }],
      },
    ]);

    const result = await service.listConversations('tenant-1', {
      search: 'aman',
      status: ConversationStatus.OPEN,
      assignedUserId: 'user-1',
      tag: 'vip',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'conversation-1',
      contactPhone: '919999999999',
      contactName: 'Aman Sharma',
      assignedUserEmail: 'agent@demo.com',
    });
    expect(result[0].tags).toEqual(['vip']);
    expect(queryBuilder.andWhere).toHaveBeenCalled();
  });

  it('removes existing tag association for conversation', async () => {
    tagRepository.findOne.mockResolvedValueOnce({ id: 'tag-1' });

    const result = await service.untag('tenant-1', 'conversation-1', 'vip');

    expect(result).toEqual({ ok: true });
    expect(conversationTagRepository.delete).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      tagId: 'tag-1',
    });
  });
});
