/**
 * File: src/modules/team-onboarding/dtos/accept-team-invite.dto.ts
 * Module: team-onboarding
 * Purpose: DTO for invite acceptance endpoint.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - token identifies pending invite entry.
 * - userId maps accepted invite to existing user.
 */

export class AcceptTeamInviteDto {
  token!: string;
  userId!: string;
}

