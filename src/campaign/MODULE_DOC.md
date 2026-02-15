# Module: campaign

**Short:** Campaign creation, listing, and dispatch scheduling.

**Purpose:** Manage WhatsApp campaign lifecycle and enqueue send jobs to message queue.

**Files:**
- campaign.module.ts
- campaign.resolver.ts
- campaign.service.ts
- campaign.processor.ts
- dto/
- entities/
- enums/

**Flow diagram:** `flowcharts/campaign-flow.svg`

**Dependencies:** TypeORM DataSource, Bull queue (`campaigns`, `messages`), tenant guards.

**APIs:**
- GraphQL: `campaigns`, `createCampaign`

**Env vars:** `CAMPAIGN_RATE_PER_MIN`

**Tests:** resolver/service unit tests, queue dispatch integration.

**Change-log:**
- 2026-02-15: Documented campaign orchestration and queue dispatch behavior.
- 2026-02-15: Migrated campaign read/write and dispatch contact fetches to TypeORM.

