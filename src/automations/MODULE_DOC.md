# Module: automations

**Short:** Conditional automation workflows with execution logging.

**Purpose:** Execute automation definitions for inbound events and drip workflows with condition checks, multi-step dispatch, and execution traceability.

**Files:**
- automations.module.ts
- automations.service.ts
- automations.resolver.ts

**Flow diagram:** `flowcharts/automations-flow.svg`

**Dependencies:** TypeORM DataSource, Bull `messages` queue, webhook ingestion, Redis (optional dedupe).

**APIs:**
- GraphQL query: `automations`, `automationExecutionLogs`
- GraphQL mutations: `createAutomation`, `updateAutomation`, `setAutomationEnabled`, `deleteAutomation`

**Env vars:** `FEATURE_AUTOMATIONS_ENABLED`

**Tests:** automation keyword matching unit tests.

**Change-log:**
- 2026-02-16: Added `AutomationExecutionLog` persistence model and API query for workflow observability.
- 2026-02-16: Added condition evaluation and multi-step workflow execution support for keyword and Shopify automations.
- 2026-02-16: Added delayed queue scheduling support for automation steps and execution audit logging for queued/skipped/failed paths.
- 2026-02-15: Added module docs.
- 2026-02-15: Switched automation lookup reads to TypeORM.
- 2026-02-15: Added automation listing query to support frontend data adapters.
- 2026-02-15: Replaced keyword reply TODO with queue-based outbound enqueue.
- 2026-02-15: Added minute-level drip scheduler with Redis/in-memory dedupe for one-time step dispatch.
- 2026-02-15: Added Shopify commerce journey seeding (`ORDER_CREATED`, `ORDER_FULFILLED`, `CUSTOMER_WIN_BACK`) for connected stores.
- 2026-02-15: Added `handleShopifyEvent` automation dispatch path with templated message rendering.

