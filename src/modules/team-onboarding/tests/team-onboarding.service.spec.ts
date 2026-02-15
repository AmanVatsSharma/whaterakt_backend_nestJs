/**
 * File: src/modules/team-onboarding/tests/team-onboarding.service.spec.ts
 * Module: team-onboarding
 * Purpose: Unit tests for team onboarding service core methods.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Uses mocked TypeORM DataSource for deterministic behavior.
 * - Covers createTeam and invite flow primitives.
 */

import { TeamOnboardingService } from '../services/team-onboarding.service';

describe('TeamOnboardingService', () => {
  const teamRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((payload) => payload),
  };
  const inviteRepository = {
    save: jest.fn(),
    create: jest.fn((payload) => payload),
  };
  const dataSource = {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name ?? '';
      if (name.includes('TeamInvite')) return inviteRepository;
      return teamRepository;
    }),
  } as any;
  const service = new TeamOnboardingService(dataSource);

  it('creates a tenant team', async () => {
    teamRepository.findOne.mockResolvedValue(null);
    teamRepository.save.mockResolvedValue({ id: 'team-1', name: 'Growth' });
    const result = await service.createTeam('tenant-1', { name: 'Growth' });
    expect(result.id).toBe('team-1');
  });

  it('invites member into existing team', async () => {
    teamRepository.findOne.mockResolvedValue({ id: 'team-1', tenantId: 'tenant-1' });
    inviteRepository.save.mockResolvedValue({ id: 'invite-1' });

    const result = await service.inviteMember('tenant-1', {
      teamId: 'team-1',
      email: 'member@example.com',
    });
    expect(result.id).toBe('invite-1');
  });
});

