# Module: whatsapp

**Short:** WhatsApp messaging send pipeline and inbound webhook ingestion.

**Purpose:** Send outbound messages, process provider callbacks, and persist delivery/message state.

**Files:**
- whatsapp.module.ts
- whatsapp.service.ts
- whatsapp.processor.ts
- whatsapp.adapter.ts
- whatsapp.resolver.ts
- webhook.controller.ts
- dto/

**Flow diagram:** `flowcharts/whatsapp-flow.svg`

**Dependencies:** Bull queues, TypeORM DataSource, metrics, automations module, managed onboarding module.

**APIs:**
- GraphQL send operations
- REST webhook verify/ingest endpoints

**Env vars:** `WHATSAPP_*`, queue limits, compliance feature flags.

**Tests:** service tests + webhook integration scenarios.

**Change-log:**
- 2026-02-15: Updated docs for webhook persistence and compliance hooks.
- 2026-02-15: Migrated send/webhook persistence paths to TypeORM entities.
- 2026-02-15: Added onboarding activation gate before outbound sends (ACTIVE + webhook-verified channels only).
- 2026-02-15: Switched tenant phone number mapping to DB-first lookup with env fallback for emergency overrides.
- 2026-02-15: Added queue-depth, webhook-outcome, and send-failure metrics for beta operations observability.

