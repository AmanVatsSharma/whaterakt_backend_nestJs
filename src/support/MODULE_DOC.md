# Module: support

**Short:** REST endpoint for user feedback proxied from the Next.js BFF.

**Purpose:** Accept authenticated, tenant-scoped feedback and log it server-side with a ticket id.

**Files:** `support.module.ts`, `support.controller.ts`, `dto/submit-feedback.dto.ts`

**APIs:** `POST /support/feedback` — JWT + `X-Tenant-Id`; returns `202` with `ticketId`, `acceptedAt`.

**Env vars:** None specific.

**Change-log:**

- 2026-04-04: Initial module; aligns BFF `/api/support/feedback` with Nest (replaces stub-only handler).
