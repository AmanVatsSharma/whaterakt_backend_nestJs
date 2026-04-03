# Module: team-onboarding

**Short:** Onboards normal companies and teams into the platform workspace.

**Purpose:** Create teams, invite members, accept invites, and manage team roster for collaborative operations.

**Files:**
- team-onboarding.module.ts — Nest module
- controllers/team-onboarding.controller.ts — team onboarding endpoints
- services/team-onboarding.service.ts — business logic for team/invite lifecycle
- dtos/create-team.dto.ts — create team request
- dtos/invite-team-member.dto.ts — invite request
- dtos/accept-team-invite.dto.ts — accept invite request
- entities/team-member.entity.ts — response shape
- tests/team-onboarding.service.spec.ts — unit tests
- MODULE_DOC.md — this file
- index.ts — exports

**Flow diagram:** `flowcharts/team-onboarding-flow.svg`

**Dependencies:** TypeORM DataSource, tenant middleware context, auth user context.

**APIs:**
- REST:
  - `POST /team-onboarding/team`
  - `POST /team-onboarding/invites`
  - `POST /team-onboarding/invites/accept`
  - `GET /team-onboarding/members`
- GraphQL: none

**Env vars:**
- `INVITE_TTL_HOURS` (future)

**Tests:** Includes service tests for team creation and invite creation.

**Change-log:** (auto-updated by Aman Sharma / Vedpragyaon edits)
- 2026-02-15: Added team onboarding module with team + invite lifecycle APIs.
- 2026-02-15: Migrated persistence layer to TypeORM repositories and removed legacy ORM references.
- 2026-02-16: Added REST auth and tenant-binding guards to team create/invite/member endpoints.

