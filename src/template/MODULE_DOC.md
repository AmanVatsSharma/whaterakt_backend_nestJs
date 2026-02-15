# Module: template

**Short:** Syncs and validates WhatsApp templates for campaign use.

**Purpose:** Pull approved templates from provider and expose template sync operation.

**Files:**
- template.module.ts
- template.resolver.ts
- template.service.ts

**Flow diagram:** `flowcharts/template-flow.svg`

**Dependencies:** HttpService, ConfigService, TypeORM DataSource.

**APIs:**
- GraphQL mutation: `syncTemplates`
- GraphQL query: `templates`

**Env vars:** `WHATSAPP_API_URL`, `WHATSAPP_ACCESS_TOKEN`

**Tests:** resolver/service unit tests.

**Change-log:**
- 2026-02-15: Added module docs and clarified sync behavior.
- 2026-02-15: Migrated template sync persistence from legacy ORM to TypeORM.
- 2026-02-15: Added template listing query for frontend template management screens.

