# Module: tenant

**Short:** Tenant workspace creation and retrieval.

**Purpose:** Create isolated tenant records and support tenant-aware application boundaries.

**Files:**
- tenant.module.ts
- tenant.resolver.ts
- tenant.service.ts
- dto/
- entities/

**Flow diagram:** `flowcharts/tenant-flow.svg`

**Dependencies:** TypeORM DataSource, RBAC seeding service, metrics.

**APIs:**
- GraphQL tenant queries/mutations used by auth onboarding.

**Env vars:** none module-specific.

**Tests:** tenant service/resolver tests.

**Change-log:**
- 2026-02-15: Added module docs for tenant lifecycle and TypeORM usage.
- 2026-02-15: Removed dual-write flow and made tenant persistence fully TypeORM-based.

