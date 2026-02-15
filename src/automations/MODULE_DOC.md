# Module: automations

**Short:** Keyword-triggered and scheduled automation handlers.

**Purpose:** Execute automation definitions for inbound events and future drip workflows.

**Files:**
- automations.module.ts
- automations.service.ts
- automations.resolver.ts

**Flow diagram:** `flowcharts/automations-flow.svg`

**Dependencies:** TypeORM DataSource, Bull `messages` queue, webhook ingestion, Redis (optional dedupe).

**APIs:**
- GraphQL query: `automations`

**Env vars:** `FEATURE_AUTOMATIONS_ENABLED`

**Tests:** automation keyword matching unit tests.

**Change-log:**
- 2026-02-15: Added module docs.
- 2026-02-15: Switched automation lookup reads to TypeORM.
- 2026-02-15: Added automation listing query to support frontend data adapters.
- 2026-02-15: Replaced keyword reply TODO with queue-based outbound enqueue.
- 2026-02-15: Added minute-level drip scheduler with Redis/in-memory dedupe for one-time step dispatch.

