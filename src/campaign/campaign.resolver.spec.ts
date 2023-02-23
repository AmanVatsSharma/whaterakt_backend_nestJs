import { Test, TestingModule } from '@nestjs/testing';
import { CampaignResolver } from './campaign.resolver';

describe('CampaignResolver', () => {
  let resolver: CampaignResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignResolver],
    }).compile();

    resolver = module.get<CampaignResolver>(CampaignResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
