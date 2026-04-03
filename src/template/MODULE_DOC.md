# Module: template

**Short:** Syncs and validates WhatsApp templates for campaign use.

**Purpose:** Pull provider templates and expose full CRUD/status lifecycle operations for tenant-managed messaging templates.

**Files:**
- template.module.ts
- template.resolver.ts
- template.service.ts

**Flow diagram:** `flowcharts/template-flow.svg`

**Dependencies:** HttpService, ConfigService, TypeORM DataSource.

**APIs:**
- GraphQL mutation: `syncTemplates`
- GraphQL query: `templates`
- GraphQL mutation: `createTemplate`
- GraphQL mutation: `updateTemplate`
- GraphQL mutation: `setTemplateStatus`
- GraphQL mutation: `deleteTemplate`

**Env vars:** `WHATSAPP_API_URL`, `WHATSAPP_ACCESS_TOKEN`

**Tests:** resolver/service unit tests.

**Change-log:**
- 2026-02-15: Added module docs and clarified sync behavior.
- 2026-02-15: Migrated template sync persistence from legacy ORM to TypeORM.
- 2026-02-15: Added template listing query for frontend template management screens.
- 2026-02-16: Added template CRUD and status lifecycle mutations with tenant-scoped persistence.

