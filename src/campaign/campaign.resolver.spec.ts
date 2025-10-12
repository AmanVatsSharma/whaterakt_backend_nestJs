import { Test, TestingModule } from '@nestjs/testing';
import { CampaignResolver } from './campaign.resolver';
import { PrismaService } from 'src/prisma.service';
import { CampaignService } from './campaign.service';
import { RateLimitGuard } from '../core/guards/rate-limit.guard';
import { ConfigService } from '@nestjs/config';

describe('CampaignResolver', () => {
  let resolver: CampaignResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignResolver,
        CampaignService,
        { provide: PrismaService, useValue: { campaign: { findMany: jest.fn() } } },
        { provide: 'BullQueue_campaigns', useValue: { add: jest.fn() } },
        { provide: 'REDIS_CLIENT', useValue: null },
        RateLimitGuard,
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
      ],
    }).compile();

    resolver = module.get<CampaignResolver>(CampaignResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
