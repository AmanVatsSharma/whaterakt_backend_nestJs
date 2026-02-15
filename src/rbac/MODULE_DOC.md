# Module: rbac

**Short:** Role and permission bootstrapping plus authorization helpers.

**Purpose:** Manage tenant-scoped RBAC roles/permissions and user-role assignment.

**Files:**
- rbac.module.ts
- rbac.service.ts
- rbac.guard.ts
- rbac.decorator.ts
- rbac.seed.ts
- entities/

**Flow diagram:** `flowcharts/rbac-flow.svg`

**Dependencies:** TypeORM repositories, auth context.

**APIs:** Guard/decorator integration for protected routes.

**Env vars:** none module-specific.

**Tests:** RBAC guard behavior and role assignment checks.

**Change-log:**
- 2026-02-15: Added module docs.
- 2026-02-15: Standardized role assignment failures to throw `AppError` (`RBAC_ROLE_NOT_FOUND`).
- 2026-02-15: Added RBAC policy hardening in `RbacService` with tenant-plan entitlement checks, attribute-based constraints, and TTL decision cache (`RBAC_CACHE_TTL_MS`).
- 2026-02-15: Enhanced guard context extraction to pass tenant and request attributes into RBAC decisions.
- 2026-02-15: Added `rbac.service.spec.ts` coverage for cache behavior, plan checks, attribute constraints, and duplicate role assignment handling.

