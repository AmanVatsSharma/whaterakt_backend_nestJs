/**
 * File: src/automations/automations.resolver.spec.ts
 * Module: automations
 * Purpose: Unit coverage for automations GraphQL resolver methods.
 * Author: BharatERP
 * created: 2026-02-16
 */

import { AutomationsResolver } from './automations.resolver';
import { AutomationsService } from './automations.service';

describe('AutomationsResolver', () => {
  const automationsServiceMock: Pick<
    AutomationsService,
    | 'listAutomations'
    | 'listExecutionLogs'
    | 'createAutomation'
    | 'updateAutomation'
    | 'setAutomationEnabled'
    | 'deleteAutomation'
  > = {
    listAutomations: jest.fn(async () => []),
    listExecutionLogs: jest.fn(async () => []),
    createAutomation: jest.fn(async () => ({ id: 'auto-1' } as any)),
    updateAutomation: jest.fn(async () => ({ id: 'auto-1' } as any)),
    setAutomationEnabled: jest.fn(async () => ({ id: 'auto-1' } as any)),
    deleteAutomation: jest.fn(async () => ({ ok: true })),
  };

  const resolver = new AutomationsResolver(automationsServiceMock as AutomationsService);

  it('returns execution logs scoped to tenant', async () => {
    await resolver.automationExecutionLogs('auto-1', {
      tenant: { id: 'tenant-1' },
    });
    expect(automationsServiceMock.listExecutionLogs).toHaveBeenCalledWith(
      'tenant-1',
      'auto-1',
    );
  });
});
