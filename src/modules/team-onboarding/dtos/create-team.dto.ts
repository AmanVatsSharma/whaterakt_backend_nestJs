/**
 * File: src/modules/team-onboarding/dtos/create-team.dto.ts
 * Module: team-onboarding
 * Purpose: DTO for creating a tenant team.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Initial team creation is tenant-scoped.
 * - Name should be unique per tenant.
 */

export class CreateTeamDto {
  name!: string;
  description?: string;
}

