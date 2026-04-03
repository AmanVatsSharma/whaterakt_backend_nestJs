import { CampaignResolver } from './campaign.resolver';
import { CampaignService } from './campaign.service';

describe('CampaignResolver', () => {
  let resolver: CampaignResolver;
  const campaignServiceMock: Pick<
    CampaignService,
    'findAll' | 'createCampaign' | 'updateCampaign' | 'duplicateCampaign'
  > = {
    findAll: jest.fn(async () => []),
    createCampaign: jest.fn(async () => ({ id: 'campaign-1' } as any)),
    updateCampaign: jest.fn(async () => ({ id: 'campaign-1' } as any)),
    duplicateCampaign: jest.fn(async () => ({ id: 'campaign-2' } as any)),
  };

  beforeEach(async () => {
    resolver = new CampaignResolver(campaignServiceMock as CampaignService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('duplicates campaign with fallback user id', async () => {
    const result = await resolver.duplicateCampaign(
      'campaign-1',
      'copy',
      { tenant: { id: 'tenant-1' } as any, req: { user: { userId: 'user-1' } } },
    );

    expect(result).toMatchObject({ id: 'campaign-2' });
    expect(campaignServiceMock.duplicateCampaign).toHaveBeenCalledWith(
      'tenant-1',
      'campaign-1',
      'user-1',
      'copy',
    );
  });
});
