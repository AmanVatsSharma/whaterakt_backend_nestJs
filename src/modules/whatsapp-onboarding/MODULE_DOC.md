# Module: whatsapp-onboarding

**Short:** Managed WhatsApp onboarding and number allocation lifecycle.

**Purpose:** Track tenant onboarding states, operate managed number inventory, and enforce channel readiness for outbound messaging.

**Files:**
- whatsapp-onboarding.module.ts
- controllers/whatsapp-onboarding.controller.ts
- services/whatsapp-onboarding.service.ts
- dtos/upsert-whatsapp-onboarding.dto.ts
- dtos/create-whatsapp-managed-number.dto.ts
- dtos/assign-whatsapp-number.dto.ts
- dtos/set-whatsapp-channel-status.dto.ts
- dtos/set-whatsapp-oba-status.dto.ts
- entities/whatsapp-onboarding-status.entity.ts
- tests/whatsapp-onboarding.service.spec.ts
- MODULE_DOC.md
- index.ts

**Flow diagram:** `flowcharts/whatsapp-onboarding-flow.svg`

**Dependencies:** TypeORM DataSource, tenant middleware context, WhatsApp send/webhook runtime.

**APIs:**
- REST:
  - `GET /whatsapp-onboarding/status`
  - `POST /whatsapp-onboarding/request`
  - `GET /whatsapp-onboarding/operator/numbers`
  - `POST /whatsapp-onboarding/operator/numbers`
  - `POST /whatsapp-onboarding/operator/assign`
  - `POST /whatsapp-onboarding/operator/channel-status`
  - `POST /whatsapp-onboarding/operator/oba-status`
  - `GET /whatsapp-onboarding/operator/channels`
  - `GET /whatsapp-onboarding/operator/funnel`
- GraphQL: none

**Env vars:**
- `WHATSAPP_ONBOARDING_REVIEW_SLA_HOURS`
- `WHATSAPP_TENANT_DAILY_SEND_LIMIT`

**Tests:** Service-level tests for onboarding status, number assignment, and send-readiness checks.

**Change-log:**
- 2026-02-15: Added managed onboarding module with tenant status and operator inventory/assignment APIs.
- 2026-02-15: Introduced DB-backed mapping for tenant to `phone_number_id` resolution and webhook verification state.
- 2026-02-16: Added OBA (green tick) readiness fields, operator status API, and onboarding checklist/status payload coverage.