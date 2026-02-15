# Module: automations

**Short:** Keyword-triggered and scheduled automation handlers.

**Purpose:** Execute automation definitions for inbound events and future drip workflows.

**Files:**
- automations.module.ts
- automations.service.ts
- automations.resolver.ts

**Flow diagram:** `flowcharts/automations-flow.svg`

**Dependencies:** TypeORM DataSource, webhook ingestion.

**APIs:**
- GraphQL query: `automations`

**Env vars:** `FEATURE_AUTOMATIONS_ENABLED`

**Tests:** automation keyword matching unit tests.

**Change-log:**
- 2026-02-15: Added module docs.
- 2026-02-15: Switched automation lookup reads to TypeORM.
- 2026-02-15: Added automation listing query to support frontend data adapters.

