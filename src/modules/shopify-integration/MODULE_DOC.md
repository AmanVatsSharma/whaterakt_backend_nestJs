# Module: shopify-integration

**Short:** Connects tenant workspaces with Shopify and syncs commerce data.

**Purpose:** Allow ecommerce brands to connect Shopify stores, sync orders/customers, and feed marketing workflows.

**Files:**
- shopify-integration.module.ts — Nest module
- controllers/shopify-integration.controller.ts — HTTP endpoints
- services/shopify-integration.service.ts — integration and sync logic
- dtos/connect-shopify.dto.ts — connect request
- dtos/sync-shopify.dto.ts — sync request
- entities/shopify-connection.entity.ts — response shape
- tests/shopify-integration.service.spec.ts — service unit tests
- MODULE_DOC.md — this file
- index.ts — exports

**Flow diagram:** `flowcharts/shopify-integration-flow.svg`

**Dependencies:** TypeORM DataSource, tenant middleware, frontend BFF settings pages, automations module.

**APIs:**
- REST:
  - `GET /shopify/oauth/start`
  - `GET /shopify/oauth/callback`
  - `POST /shopify/connect`
  - `POST /shopify/sync/orders`
  - `POST /shopify/sync/customers`
  - `POST /shopify/sync/products`
  - `POST /shopify/webhook/orders`
  - `POST /shopify/webhook/customers`
  - `POST /shopify/webhook/products`
  - `GET /shopify/status`
- GraphQL: none

**Env vars:**
- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `SHOPIFY_WEBHOOK_SECRET`

**Tests:** Includes service-level unit test for store connect upsert.

**Change-log:** (auto-updated by Aman Sharma / Vedpragyaon edits)
- 2026-02-15: Added Shopify integration module with connection, sync, and webhook handlers.
- 2026-02-15: Migrated Shopify persistence to TypeORM repositories.
- 2026-02-15: Added OAuth start/callback flow with signed state + Shopify HMAC verification.
- 2026-02-15: Replaced placeholder sync rows with real Shopify REST pagination and incremental cursors.
- 2026-02-15: Added signed webhook verification and tenant resolution from shop domain.
- 2026-02-15: Added product sync support with `syncProducts` service flow and `POST /shopify/sync/products`.
- 2026-02-15: Added customer and product webhook ingestion endpoints with idempotent upsert handling.
- 2026-02-15: Added transient retry logic for outbound Shopify REST pull requests.
- 2026-02-15: Added webhook-id dedupe cache to avoid repeated processing for duplicate deliveries.
- 2026-02-15: Auto-seeded default Shopify event automations during successful store connect.
- 2026-02-15: Wired Shopify webhook handlers to trigger commerce journeys through automations service.
- 2026-04-04: Production webhooks require `x-shopify-hmac-sha256` and valid `SHOPIFY_WEBHOOK_SECRET` (unsigned allowed only in non-production).
- 2026-02-15: Extended Shopify status payload with enabled commerce journey count.
- 2026-02-16: Added REST auth + tenant guard + RBAC protection for connect/sync/status and oauth start endpoints.

