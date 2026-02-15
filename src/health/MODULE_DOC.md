# Module: health

**Short:** Application health, readiness, and dependency checks.

**Purpose:** Expose health endpoints for DB/Redis/queue observability.

**Files:**
- health.module.ts
- health.controller.ts
- health.resolver.ts
- database.health.ts
- redis.health.ts
- queue.health.ts
- entities/

**Flow diagram:** `flowcharts/health-flow.svg`

**Dependencies:** TypeORM DataSource, Redis provider, Bull health indicators.

**APIs:**
- REST/GraphQL health checks.

**Env vars:** Infra endpoints from shared config.

**Tests:** health probe smoke tests.

**Change-log:**
- 2026-02-15: Added module docs.
- 2026-02-15: Replaced legacy ORM health probe with TypeORM and removed Terminus dependency.

