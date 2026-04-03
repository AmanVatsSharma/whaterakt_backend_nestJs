# Module: campaign

**Short:** Campaign composition, targeting, lifecycle, and dispatch scheduling.

**Purpose:** Manage WhatsApp campaign lifecycle, composition payload, audience targeting, and enqueue send jobs to message queue.

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
- GraphQL: `campaigns`, `createCampaign`, `updateCampaign`, `duplicateCampaign`, `setCampaignStatus`, `deleteCampaign`

**Env vars:** `CAMPAIGN_RATE_PER_MIN`

**Tests:** resolver/service unit tests, queue dispatch integration.

**Change-log:**
- 2026-02-16: Added campaign composition fields (`messageBody`, `templateName`) and explicit audience targeting (`audienceContactIds`) with migration support.
- 2026-02-16: Added `updateCampaign` and `duplicateCampaign` mutations to support edit/duplicate lifecycle from UI.
- 2026-02-16: Dispatch processor now resolves campaign payload from DB and marks sent campaigns after queue fan-out.
- 2026-02-15: Documented campaign orchestration and queue dispatch behavior.
- 2026-02-15: Migrated campaign read/write and dispatch contact fetches to TypeORM.
- 2026-02-15: Added explicit campaign status transition mutation for lifecycle operations.
- 2026-02-15: Added campaign delete mutation and delayed dispatch enqueue only when status is `SCHEDULED`.

