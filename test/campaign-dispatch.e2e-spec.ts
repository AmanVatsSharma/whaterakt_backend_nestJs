import { CampaignProcessor } from '../src/campaign/campaign.processor';

describe('Campaign dispatch pipeline (e2e)', () => {
  it('fans out outbound message jobs for subscribed contacts', async () => {
    const contactRepository = {
      find: jest.fn(async () => [
        { id: 'contact-1', phone: '919111111111', subscribed: true },
        { id: 'contact-2', phone: '919222222222', subscribed: true },
      ]),
    };
    const dataSourceMock = {
      getRepository: jest.fn(() => contactRepository),
    } as any;
    const messageQueueMock = {
      add: jest.fn(async () => ({})),
    } as any;

    const processor = new CampaignProcessor(dataSourceMock, messageQueueMock);
    const result = await processor.handleDispatch({
      data: { tenantId: 'tenant-1', campaignId: 'campaign-1' },
    } as any);

    expect(result.success).toBe(true);
    expect(messageQueueMock.add).toHaveBeenCalledTimes(2);
    expect(messageQueueMock.add).toHaveBeenCalledWith(
      'message',
      expect.objectContaining({
        tenantId: 'tenant-1',
        campaignId: 'campaign-1',
      })
    );
  });
});
