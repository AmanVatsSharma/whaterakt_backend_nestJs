# Module: core

**Short:** Cross-cutting middleware, guards, filters, and infra utilities.

**Purpose:** Centralize request ID, tenant resolution, security middleware, rate limits, and global exception handling.

**Files:**
- core.module.ts
- middlewares/
- guards/
- filters/
- cache/
- queues/
- config/
- decorators/
- swagger/

**Flow diagram:** `flowcharts/core-flow.svg`

**Dependencies:** Redis provider, shared logger, metrics module.

**APIs:** Infrastructure module only (no direct public API endpoints).

**Env vars:** rate limits, Redis, feature flags, CORS.

**Tests:** guard/filter unit coverage + middleware smoke tests.

**Change-log:**
- 2026-02-15: Added structured error mapping + logger wiring documentation.
- 2026-02-15: Tenant middleware now throws structured `AppError` codes instead of raw `Error`.
- 2026-02-15: Added tenant middleware exclusions for Shopify OAuth callback and webhook paths.

