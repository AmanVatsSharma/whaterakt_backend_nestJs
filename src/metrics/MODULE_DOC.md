# Module: metrics

**Short:** Prometheus metrics counters and export endpoint.

**Purpose:** Track operational metrics across auth, messaging, campaign delivery, and data-persistence reliability.

**Files:**
- metrics.module.ts
- metrics.service.ts
- metrics.controller.ts

**Flow diagram:** `flowcharts/metrics-flow.svg`

**Dependencies:** prom-client.

**APIs:**
- REST metrics endpoint for scraping.

**Env vars:** Optional `METRICS_BEARER_TOKEN` — when set, `GET /metrics` requires `Authorization: Bearer <token>`.

**Tests:** metrics service increments/counters assertions.

**Change-log:**
- 2026-04-04: Optional bearer protection via `METRICS_BEARER_TOKEN` and `MetricsBearerGuard`.
- 2026-02-15: Added module docs.
- 2026-02-15: Added WhatsApp webhook outcome counters, outbound send failure counters, and queue-depth gauges.

