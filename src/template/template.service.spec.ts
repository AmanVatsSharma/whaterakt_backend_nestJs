import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

describe('TemplateService', () => {
  let service: TemplateService;
  const repository: any = {
    findOne: jest.fn(async () => null),
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => payload),
    find: jest.fn(async () => []),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        TemplateService,
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(() => repository),
          },
        },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('maps template list for tenant', async () => {
    repository.find.mockResolvedValueOnce([
      {
        id: 'tpl-1',
        name: 'Welcome',
        content: 'Hello there',
        category: 'MARKETING',
        status: 'APPROVED',
        createdAt: new Date('2026-02-15T00:00:00.000Z'),
      },
    ]);

    const result = await service.listTemplates('tenant-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tpl-1');
    expect(result[0].name).toBe('Welcome');
  });
});
