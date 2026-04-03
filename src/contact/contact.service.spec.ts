import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { DataSource } from 'typeorm';
import { ContactOrmEntity, ContactTagOrmEntity, TagOrmEntity } from '../database/entities';

describe('ContactService', () => {
  let service: ContactService;
  const contactQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  };

  const tagCountQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const contactRepository = {
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => ({ id: 'contact-1', ...payload })),
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => null),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => contactQueryBuilder),
  };

  const tagRepository = {
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => ({ id: 'tag-1', ...payload })),
    findOne: jest.fn(async () => null),
  };

  const contactTagRepository = {
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => payload),
    findOne: jest.fn(async () => null),
    createQueryBuilder: jest.fn(() => tagCountQueryBuilder),
  };

  const dataSourceMock = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === ContactOrmEntity) {
        return contactRepository;
      }
      if (entity === TagOrmEntity) {
        return tagRepository;
      }
      if (entity === ContactTagOrmEntity) {
        return contactTagRepository;
      }
      return contactRepository;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    contactQueryBuilder.getMany.mockResolvedValue([]);
    contactQueryBuilder.getCount.mockResolvedValue(0);
    contactRepository.count.mockResolvedValue(0);
    tagCountQueryBuilder.getRawMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns contacts filtered by search and segment metadata', async () => {
    contactQueryBuilder.getMany.mockResolvedValueOnce([
      {
        id: 'contact-1',
        phone: '919999999999',
        firstName: 'Aman',
        lastName: 'Sharma',
        userId: 'user-1',
        subscribed: true,
        tags: [{ tag: { name: 'premium' } }, { tag: { name: 'premium' } }],
      },
    ]);

    const result = await service.findAll('tenant-1', {
      search: 'aman',
      segmentId: 'TAG:premium',
    });

    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual(['premium']);
    expect(contactQueryBuilder.andWhere).toHaveBeenCalled();
  });

  it('builds audience segment summaries including dynamic tag segments', async () => {
    contactRepository.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2);
    contactQueryBuilder.getCount
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(5);
    tagCountQueryBuilder.getRawMany.mockResolvedValueOnce([
      { name: 'premium', count: '3' },
    ]);

    const result = await service.listSegments('tenant-1');

    expect(result.find((segment) => segment.id === 'ALL')?.count).toBe(10);
    expect(result.find((segment) => segment.id === 'TAG:premium')?.count).toBe(3);
  });
});
