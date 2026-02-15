import { AutomationsService } from '../src/automations/automations.service';

describe('Automation trigger pipeline (e2e)', () => {
  it('queues keyword replies and due drip steps', async () => {
    const queueMock = {
      add: jest.fn(async () => ({})),
    } as any;

    const repository = {
      find: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 'auto-keyword',
            tenantId: 'tenant-1',
            type: 'KEYWORD_REPLY',
            enabled: true,
            definition: { trigger: 'offer', replyText: 'New offer unlocked' },
            createdAt: new Date('2026-02-15T00:00:00.000Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'auto-drip',
            tenantId: 'tenant-1',
            type: 'DRIP_SEQUENCE',
            enabled: true,
            createdAt: new Date('2026-02-15T00:00:00.000Z'),
            definition: {
              recipient: '919888888888',
              startAt: '2026-02-15T00:00:00.000Z',
              steps: [{ text: 'Day 0 drip message', offsetMinutes: 0 }],
            },
          },
        ]),
    };
    const dataSourceMock = {
      getRepository: jest.fn(() => repository),
    } as any;

    const service = new AutomationsService(dataSourceMock, queueMock, null);

    const keywordResult = await service.handleInboundKeyword(
      'tenant-1',
      '919777777777',
      'please share offer details'
    );
    expect(keywordResult.queued).toBe(1);

    const dripResult = await service.scheduleDripSequences(
      new Date('2026-02-15T01:00:00.000Z')
    );
    expect(dripResult.queued).toBe(1);
    expect(queueMock.add).toHaveBeenCalledTimes(2);
  });
});
