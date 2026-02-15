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
- GraphQL: `contacts`, `createContact`

**Env vars:** none module-specific.

**Tests:** resolver/service unit tests.

**Change-log:**
- 2026-02-15: Added module documentation and tag relation notes.
- 2026-02-15: Migrated contact + tag persistence to TypeORM repositories.

