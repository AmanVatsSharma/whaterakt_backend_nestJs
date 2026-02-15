/**
 * File: src/automations/automations.service.spec.ts
 * Module: automations
 * Purpose: Unit coverage for automation listing and keyword handler behavior.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { AutomationsService } from './automations.service';

describe('AutomationsService', () => {
  const repository = {
    find: jest.fn(),
  };
  const dataSource = {
    getRepository: jest.fn(() => repository),
  } as any;
  const service = new AutomationsService(dataSource);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mapped automation list for tenant', async () => {
    repository.find.mockResolvedValueOnce([
      {
        id: 'auto-1',
        type: 'KEYWORD_REPLY',
        enabled: true,
        definition: { trigger: 'hi' },
        createdAt: new Date('2026-02-15T00:00:00.000Z'),
      },
    ]);

    const result = await service.listAutomations('tenant-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('auto-1');
    expect(result[0].trigger).toBe('hi');
  });
});
