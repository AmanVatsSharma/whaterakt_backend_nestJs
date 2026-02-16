# Module: inbox

**Short:** Conversation assignment, tagging, notes, and inbox list APIs.

**Purpose:** Power support inbox workflows for message threads and collaboration actions.

**Files:**
- inbox.module.ts
- inbox.controller.ts
- conversation.resolver.ts
- conversation.service.ts
- types.ts

**Flow diagram:** `flowcharts/inbox-flow.svg`

**Dependencies:** TypeORM DataSource, tenant/auth guards.

**APIs:**
- GraphQL mutations for assignment/status/tag/note
- REST:
  - `GET /inbox/conversations`
  - `GET /inbox/conversations/:conversationId/thread`
  - `PATCH /inbox/conversations/:conversationId/assignment`
  - `PATCH /inbox/conversations/:conversationId/status`
  - `POST /inbox/conversations/:conversationId/notes`
  - `POST /inbox/conversations/:conversationId/tags`
  - `POST /inbox/conversations/:conversationId/messages`

**Env vars:** none module-specific.

**Tests:** resolver/service tests.

**Change-log:**
- 2026-02-15: Added REST conversation list endpoint for BFF integration.
- 2026-02-15: Replaced conversation/note/tag persistence with TypeORM repositories.
- 2026-02-15: Added tenant-safe conversation mutation REST endpoints for assignment, status, note, tag, and outbound send.
- 2026-02-15: Added inbox-to-WhatsApp send bridge for conversation reply actions.
- 2026-02-16: Added tenant-safe thread retrieval endpoint for backend-backed inbox UI rendering.

