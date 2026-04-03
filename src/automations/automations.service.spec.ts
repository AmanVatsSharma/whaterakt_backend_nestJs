/**
 * File: src/automations/automations.service.spec.ts
 * Module: automations
 * Purpose: Unit coverage for automation listing, workflow dispatch, and execution logs.
 * Author: BharatERP
 * created: 2026-02-16
 */

import { AutomationsService } from './automations.service';
import { AutomationExecutionLogOrmEntity, AutomationOrmEntity } from '../database/entities';

describe('AutomationsService', () => {
  const automationRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((payload) => payload),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const logRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((payload) => payload),
  };
  const queue = {
    add: jest.fn(),
  };
  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === AutomationExecutionLogOrmEntity) {
        return logRepository;
      }
      if (entity === AutomationOrmEntity) {
        return automationRepository;
      }
      return automationRepository;
    }),
  } as any;
  const service = new AutomationsService(dataSource, queue as any, null);

  beforeEach(() => {
    jest.clearAllMocks();
    automationRepository.find.mockResolvedValue([]);
    automationRepository.save.mockResolvedValue({});
    automationRepository.findOne.mockResolvedValue(null);
    logRepository.find.mockResolvedValue([]);
    logRepository.save.mockResolvedValue({});
  });

  it('returns mapped automation list for tenant', async () => {
    automationRepository.find.mockResolvedValueOnce([
      {
        id: 'auto-1',
        type: 'KEYWORD_REPLY',
        enabled: true,
        definition: { trigger: 'hi', steps: [{ offsetMinutes: 0, message: 'hello' }] },
        createdAt: new Date('2026-02-15T00:00:00.000Z'),
      },
    ]);

    const result = await service.listAutomations('tenant-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('auto-1');
    expect(result[0].trigger).toBe('hi');
    expect(result[0].stepsCount).toBe(1);
  });

  it('enqueues all matching keyword workflow steps', async () => {
    automationRepository.find.mockResolvedValueOnce([
      {
        id: 'auto-keyword-1',
        tenantId: 'tenant-1',
        type: 'KEYWORD_REPLY',
        enabled: true,
        definition: {
          trigger: 'hello',
          conditions: [{ field: 'text', operator: 'contains', value: 'offer' }],
          steps: [
            { offsetMinutes: 0, message: 'Namaste! How can we help?' },
            { offsetMinutes: 10, message: 'Sharing our latest offer now.' },
          ],
        },
      },
    ]);

    const result = await service.handleInboundKeyword(
      'tenant-1',
      '919999999999',
      'hello there with offer'
    );
    expect(result.matched).toBe(1);
    expect(result.queued).toBe(2);
    expect(queue.add).toHaveBeenNthCalledWith(
      1,
      'message',
      expect.objectContaining({
        tenantId: 'tenant-1',
      }),
      expect.objectContaining({ delay: 0 }),
    );
    expect(queue.add).toHaveBeenNthCalledWith(
      2,
      'message',
      expect.objectContaining({
        tenantId: 'tenant-1',
      }),
      expect.objectContaining({ delay: 600000 }),
    );
  });

  it('skips keyword flow when condition is not met', async () => {
    automationRepository.find.mockResolvedValueOnce([
      {
        id: 'auto-keyword-2',
        tenantId: 'tenant-1',
        type: 'KEYWORD_REPLY',
        enabled: true,
        definition: {
          trigger: 'hello',
          conditions: [{ field: 'text', operator: 'contains', value: 'vip' }],
          replyText: 'Hello VIP customer',
        },
      },
    ]);

    const result = await service.handleInboundKeyword(
      'tenant-1',
      '919999999999',
      'hello there',
    );
    expect(result.matched).toBe(1);
    expect(result.queued).toBe(0);
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'SKIPPED',
      }),
    );
  });

  it('returns execution logs for tenant', async () => {
    logRepository.find.mockResolvedValueOnce([
      {
        id: 'log-1',
        automationType: 'KEYWORD_REPLY',
        triggerSource: 'KEYWORD_REPLY',
        status: 'QUEUED',
        recipient: '919999999999',
        messagePreview: 'Namaste',
        details: { stepIndex: 0 },
        createdAt: new Date('2026-02-16T00:00:00.000Z'),
      },
    ]);

    const result = await service.listExecutionLogs('tenant-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'log-1',
      status: 'QUEUED',
    });
  });
});
