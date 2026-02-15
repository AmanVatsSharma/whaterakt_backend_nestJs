import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { getQueueToken } from '@nestjs/bull';
import { DataSource } from 'typeorm';

describe('CampaignService', () => {
  let service: CampaignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getQueueToken('campaigns'), useValue: { add: jest.fn() } },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(() => ({
              create: jest.fn((payload) => payload),
              save: jest.fn(async (payload) => ({ id: 'campaign-1', ...payload })),
              find: jest.fn(async () => []),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
