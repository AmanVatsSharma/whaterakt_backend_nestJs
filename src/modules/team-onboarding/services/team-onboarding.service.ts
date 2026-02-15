/**
 * File: src/modules/team-onboarding/services/team-onboarding.service.ts
 * Module: team-onboarding
 * Purpose: Team lifecycle logic: create team, invite, accept, and list members.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Tenant-scoped team boundaries are strictly enforced.
 * - Invite token generation is deterministic-length random hex.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource } from 'typeorm';
import { TeamInviteOrmEntity, TeamMemberOrmEntity, TeamOrmEntity } from '../../../database/entities';
import { AcceptTeamInviteDto } from '../dtos/accept-team-invite.dto';
import { CreateTeamDto } from '../dtos/create-team.dto';
import { InviteTeamMemberDto } from '../dtos/invite-team-member.dto';

@Injectable()
export class TeamOnboardingService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createTeam(tenantId: string, input: CreateTeamDto) {
    if (!tenantId || !input?.name) {
      throw new BadRequestException('tenantId and team name are required');
    }

    const teamRepository = this.dataSource.getRepository(TeamOrmEntity);
    const existing = await teamRepository.findOne({
      where: {
        tenantId,
        name: input.name,
      },
    });
    if (existing) {
      existing.description = input.description ?? null;
      return teamRepository.save(existing);
    }

    return teamRepository.save(
      teamRepository.create({
        tenantId,
        name: input.name,
        description: input.description ?? null,
      }),
    );
  }

  async inviteMember(
    tenantId: string,
    input: InviteTeamMemberDto,
    invitedByUserId?: string
  ) {
    if (!tenantId || !input?.teamId || !input?.email) {
      throw new BadRequestException('tenantId, teamId and email are required');
    }

    const teamRepository = this.dataSource.getRepository(TeamOrmEntity);
    const inviteRepository = this.dataSource.getRepository(TeamInviteOrmEntity);

    const team = await teamRepository.findOne({
      where: { id: input.teamId, tenantId },
    });
    if (!team) {
      throw new BadRequestException('Team not found for tenant');
    }

    const token = randomBytes(20).toString('hex');
    return inviteRepository.save(
      inviteRepository.create({
        teamId: input.teamId,
        email: input.email.toLowerCase(),
        role: input.role || 'VIEWER',
        token,
        invitedByUserId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      }),
    );
  }

  async acceptInvite(input: AcceptTeamInviteDto) {
    const inviteRepository = this.dataSource.getRepository(TeamInviteOrmEntity);
    const memberRepository = this.dataSource.getRepository(TeamMemberOrmEntity);

    const invite = await inviteRepository.findOne({
      where: { token: input.token },
      relations: { team: true },
    });
    if (!invite) {
      throw new BadRequestException('Invite not found');
    }
    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Invite already processed');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      await inviteRepository.update({ id: invite.id }, { status: 'EXPIRED' });
      throw new BadRequestException('Invite expired');
    }

    const existingMember = await memberRepository.findOne({
      where: {
        teamId: invite.teamId,
        userId: input.userId,
      },
    });
    if (existingMember) {
      existingMember.role = invite.role;
      existingMember.status = 'ACTIVE';
      existingMember.joinedAt = new Date();
      await memberRepository.save(existingMember);
    } else {
      await memberRepository.save(
        memberRepository.create({
          teamId: invite.teamId,
          userId: input.userId,
          role: invite.role,
          status: 'ACTIVE',
          joinedAt: new Date(),
        }),
      );
    }

    await inviteRepository.update(
      { id: invite.id },
      {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    );
    return inviteRepository.findOne({ where: { id: invite.id } });
  }

  async listMembers(tenantId: string, teamId?: string) {
    const memberRepository = this.dataSource.getRepository(TeamMemberOrmEntity);
    const members = await memberRepository.find({
      where: {
        team: {
          tenantId,
          ...(teamId ? { id: teamId } : {}),
        },
      },
      relations: { user: true, team: true },
      order: { createdAt: 'ASC' },
    });

    return members.map((member) => ({
      id: member.id,
      teamId: member.teamId,
      teamName: member.team?.name,
      userId: member.userId,
      userEmail: member.user?.email,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt ?? null,
    }));
  }
}

