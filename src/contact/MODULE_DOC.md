# Module: contact

**Short:** Manages tenant contacts and contact tagging.

**Purpose:** Store audience contacts for messaging and segmentation-ready tag mapping.

**Files:**
- contact.module.ts
- contact.resolver.ts
- contact.service.ts
- dto/
- entities/

**Flow diagram:** `flowcharts/contact-flow.svg`

**Dependencies:** TypeORM DataSource, tenant/auth guards.

**APIs:**
- GraphQL: `contacts(search, segmentId)`, `audienceSegments`, `createContact`

**Env vars:** none module-specific.

**Tests:** resolver/service unit tests.

**Change-log:**
- 2026-02-16: Added audience segmentation support with `audienceSegments` query and segment-aware contact filtering.
- 2026-02-16: Extended contact payload to expose `subscribed` and tag metadata for frontend segment-aware UI.
- 2026-02-16: Added contact service unit coverage for segment filtering and segment summary generation.
- 2026-02-15: Added module documentation and tag relation notes.
- 2026-02-15: Migrated contact + tag persistence to TypeORM repositories.

