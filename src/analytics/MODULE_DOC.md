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

**Env vars:** none module-specific.

**Tests:** resolver aggregation correctness tests.

**Change-log:**
- 2026-02-15: Added module docs.
- 2026-02-15: Migrated tenant stat aggregation queries to TypeORM repositories.

