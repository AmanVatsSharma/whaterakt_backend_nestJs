# Module: database

**Short:** TypeORM database infrastructure and entity registry.

**Purpose:** Centralize TypeORM bootstrap, entities, and shared persistence conventions.

**Files:**
- database.module.ts
- database.config.ts
- base.entity.ts
- entities/
- docs markdown files

**Flow diagram:** `flowcharts/database-flow.svg`

**Dependencies:** TypeORM, ConfigModule, metrics.

**APIs:** Internal module only.

**Env vars:** `TYPEORM_LOGGING`.

**Tests:** entity/repository behavior checks.

**Change-log:**
- 2026-02-15: Added module docs.
- 2026-02-15: Removed legacy ORM migration artifacts and standardized on TypeORM.
- 2026-02-15: Added TypeORM migration CLI datasource and migration scripts.
- 2026-02-15: Switched DB bootstrap to migration-first defaults (`synchronize=false` unless explicitly enabled).
- 2026-02-15: Added Shopify connection sync cursor migration (`lastOrdersSyncAt`, `lastCustomersSyncAt`).
- 2026-02-15: Added `ShopifyProduct` entity and migration for `lastProductsSyncAt` + product cache table.
- 2026-02-15: Added migration freshness check script (`npm run check:migrations`) for CI and PR quality gates.

