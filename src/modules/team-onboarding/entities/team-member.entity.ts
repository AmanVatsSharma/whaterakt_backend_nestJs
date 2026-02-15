/**
 * File: src/modules/team-onboarding/entities/team-member.entity.ts
 * Module: team-onboarding
 * Purpose: Shape for team membership list responses.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Exposes only fields needed by frontend lists.
 * - Keep model independent from persistence implementation details.
 */

export interface TeamMemberEntity {
  id: string;
  teamId: string;
  teamName: string;
  userId: string;
  userEmail: string;
  role: string;
  status: string;
  joinedAt?: Date | null;
}

