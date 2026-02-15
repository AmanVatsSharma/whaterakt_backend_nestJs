import { CampaignResolver } from './campaign.resolver';
import { CampaignService } from './campaign.service';

describe('CampaignResolver', () => {
  let resolver: CampaignResolver;
  const campaignServiceMock: Pick<CampaignService, 'findAll' | 'createCampaign'> = {
    findAll: jest.fn(async () => []),
    createCampaign: jest.fn(async () => ({ id: 'campaign-1' } as any)),
  };

  beforeEach(async () => {
    resolver = new CampaignResolver(campaignServiceMock as CampaignService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
