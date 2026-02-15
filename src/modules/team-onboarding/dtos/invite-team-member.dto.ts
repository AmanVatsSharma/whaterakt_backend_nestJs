/**
 * File: src/modules/team-onboarding/dtos/invite-team-member.dto.ts
 * Module: team-onboarding
 * Purpose: DTO for inviting member to a team.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - role defaults to VIEWER when omitted.
 * - teamId is mandatory for invite flow.
 */

export class InviteTeamMemberDto {
  teamId!: string;
  email!: string;
  role?: 'OWNER' | 'ADMIN' | 'MARKETER' | 'AGENT' | 'VIEWER';
}

