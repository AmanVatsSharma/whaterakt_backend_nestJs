import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { getQueueToken } from '@nestjs/bull';
import { PrismaService } from 'src/prisma.service';

describe('CampaignService', () => {
  let service: CampaignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getQueueToken('campaigns'), useValue: { add: jest.fn() } },
        { provide: PrismaService, useValue: { campaign: { create: jest.fn(), findMany: jest.fn() } } },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
