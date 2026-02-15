/**
 * File: src/modules/whatsapp-onboarding/tests/whatsapp-onboarding.service.spec.ts
 * Module: whatsapp-onboarding
 * Purpose: Unit tests for onboarding status and send-readiness paths.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Uses mocked repositories to keep tests deterministic.
 * - Focuses on tenant-status and readiness gate behavior.
 */
import { WhatsAppOnboardingService } from '../services/whatsapp-onboarding.service';

describe('WhatsAppOnboardingService', () => {
  const channelRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((payload) => payload),
    count: jest.fn(),
    exist: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const templateRepository = {
    count: jest.fn(),
  };
  const tenantRepository = {
    exist: jest.fn(),
  };
  const numberRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((payload) => payload),
  };
  const auditRepository = {
    save: jest.fn(),
    create: jest.fn((payload) => payload),
  };

  const managerMock = {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name ?? '';
      if (name.includes('Template')) return templateRepository;
      if (name.includes('Tenant')) return tenantRepository;
      if (name.includes('ManagedNumber')) return numberRepository;
      if (name.includes('AssignmentAudit')) return auditRepository;
      return channelRepository;
    }),
  };

  const dataSource = {
    getRepository: jest.fn((entity: any) => managerMock.getRepository(entity)),
    manager: managerMock,
    transaction: jest.fn(async (cb: any) => cb(managerMock)),
  } as any;
  const service = new WhatsAppOnboardingService(dataSource);

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findOne.mockReset();
    channelRepository.save.mockReset();
    templateRepository.count.mockReset();
    numberRepository.findOne.mockReset();
  });

  it('returns onboarding status with checklist for new tenant', async () => {
    channelRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      tenantId: 'tenant-1',
      status: 'NEW',
      phoneNumberId: null,
    });
    channelRepository.save.mockResolvedValue({
      tenantId: 'tenant-1',
      status: 'NEW',
      phoneNumberId: null,
      onboardingSlaTargetAt: new Date(),
    });
    templateRepository.count.mockResolvedValue(0);

    const result = await service.getTenantStatus('tenant-1');
    expect(result.tenantId).toBe('tenant-1');
    expect(result.status).toBe('NEW');
    expect(result.checklist.length).toBeGreaterThan(0);
  });

  it('blocks readiness when channel is not active', async () => {
    channelRepository.findOne.mockResolvedValue({
      tenantId: 'tenant-1',
      status: 'NUMBER_ASSIGNED',
      phoneNumberId: '123',
      webhookVerifiedAt: null,
    });
    const result = await service.isTenantSendReady('tenant-1');
    expect(result.ready).toBe(false);
    expect(result.reason).toBe('channel_not_active');
  });

  it('returns mapped phoneNumberId for tenant assignment', async () => {
    channelRepository.findOne.mockResolvedValue({
      tenantId: 'tenant-1',
      status: 'ACTIVE',
      phoneNumberId: 'phone-123',
    });
    const result = await service.resolvePhoneNumberIdByTenant('tenant-1');
    expect(result).toBe('phone-123');
  });
});
