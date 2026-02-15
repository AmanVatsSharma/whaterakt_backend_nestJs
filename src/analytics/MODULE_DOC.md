# Module: analytics

**Short:** Tenant-level aggregate analytics queries.

**Purpose:** Provide top-line messaging and conversation stats for dashboards/export.

**Files:**
- analytics.module.ts
- analytics.resolver.ts

**Flow diagram:** `flowcharts/analytics-flow.svg`

**Dependencies:** TypeORM DataSource, auth+tenant guards.

**APIs:**
- GraphQL query: `tenantStats`
- GraphQL query: `campaignKpis`
- GraphQL query: `whatsappOnboardingFunnel`

**Env vars:** none module-specific.

**Tests:** resolver aggregation correctness tests.

**Change-log:**
- 2026-02-15: Added module docs.
- 2026-02-15: Migrated tenant stat aggregation queries to TypeORM repositories.
- 2026-02-15: Added campaign KPI aggregation query and campaign-level reply/failure metrics.
- 2026-02-15: Added WhatsApp onboarding funnel query for activation-stage dashboarding.

