# Module: integrations

**Short:** Handles operational integration settings for tenants.

**Purpose:** Validate webhook URLs and manage tenant-scoped API key generation used by settings workflows.

**Files:**
- integrations.module.ts — Nest module
- controllers/integrations.controller.ts — HTTP endpoints for settings BFF
- services/integrations.service.ts — business logic for validation and key generation
- dtos/validate-webhook.dto.ts — request DTO
- entities/integration-result.entity.ts — shared response contract
- tests/integrations.service.spec.ts — unit tests
- MODULE_DOC.md — this file
- index.ts — module exports

**Flow diagram:** `flowcharts/integrations-flow.svg`

**Dependencies:** TypeORM DataSource, tenant middleware context, frontend BFF `/api/settings/*` routes.

**APIs:**
- REST:
  - `POST /integrations/webhook/validate` — validate incoming webhook URL format
  - `POST /integrations/api-keys/generate` — rotate tenant API key
  - `GET /integrations/workspace-settings` — read tenant workspace settings
  - `POST /integrations/workspace-settings` — persist tenant workspace settings
- GraphQL: none

**Env vars:**
- `BACKEND_API_URL` (consumed via frontend BFF for route forwarding)

**Tests:** Service-level tests for URL validation and key generation behavior.

**Change-log:** (auto-updated by Aman Sharma / Vedpragyaon edits)
- 2026-04-04: `ValidateWebhookDto` now validates `url` with `class-validator` and accepts optional `secret` for BFF parity under global `ValidationPipe`.
- 2026-02-15: Added integrations module for BFF-backed settings API operations.
- 2026-02-15: Switched tenant API key rotation persistence to TypeORM.
- 2026-02-15: Added workspace settings read/write APIs backed by tenant feature flag JSON storage.
- 2026-02-16: Added REST auth + tenant guards and RBAC permissions for integrations settings endpoints.

