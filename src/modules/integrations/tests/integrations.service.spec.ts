/**
 * File: src/modules/integrations/tests/integrations.service.spec.ts
 * Module: integrations
 * Purpose: Unit tests for integration service core operations.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Focuses on deterministic validation behavior.
 * - Keep tests lightweight and fast.
 */

import { IntegrationsService } from '../services/integrations.service';

describe('IntegrationsService', () => {
  const tenantRepository = {
    update: jest.fn(),
    findOne: jest.fn(),
  } as any;
  const dataSource = {
    getRepository: jest.fn(() => tenantRepository),
  } as any;
  const service = new IntegrationsService(dataSource);

  it('validates a well-formed webhook url', () => {
    const result = service.validateWebhook('https://example.com/webhook');
    expect(result.ok).toBe(true);
  });

  it('generates api key', async () => {
    const result = await service.generateApiKey('tenant-1');
    expect(result.key.startsWith('sk_live_')).toBe(true);
  });

  it('reads tenant workspace settings from feature flags', async () => {
    tenantRepository.findOne.mockResolvedValueOnce({
      id: 'tenant-1',
      featureFlags: {
        workspaceSettings: {
          timezone: 'UTC',
          autoReply: true,
        },
      },
    });
    const result = await service.getWorkspaceSettings('tenant-1');
    expect(result).toEqual(
      expect.objectContaining({
        timezone: 'UTC',
        autoReply: true,
      }),
    );
  });

  it('merges and saves workspace settings in tenant feature flags', async () => {
    tenantRepository.findOne.mockResolvedValueOnce({
      id: 'tenant-1',
      featureFlags: {
        oldFlag: true,
        workspaceSettings: {
          timezone: 'UTC',
        },
      },
    });
    await service.saveWorkspaceSettings('tenant-1', {
      language: 'en',
    });
    expect(tenantRepository.update).toHaveBeenCalledWith(
      { id: 'tenant-1' },
      expect.objectContaining({
        featureFlags: expect.objectContaining({
          oldFlag: true,
          workspaceSettings: expect.objectContaining({
            timezone: 'UTC',
            language: 'en',
          }),
        }),
      }),
    );
  });
});

