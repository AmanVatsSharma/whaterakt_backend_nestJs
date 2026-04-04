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

**Env vars:** `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_GRAPH_BASE`, `WHATSAPP_GRAPH_VERSION`, phone id via onboarding / `WHATSAPP_DEFAULT_PHONE_NUMBER_ID` / `WHATSAPP_TENANT_PHONE_MAP`. Optional legacy `WHATSAPP_API_URL` (non-Graph mock with `GET .../message_templates`).

**Tests:** resolver/service unit tests.

**Change-log:**
- 2026-04-04: Template list URL aligned with Graph send path; optional non-Graph `WHATSAPP_API_URL` retained for mocks.
- 2026-02-15: Added module docs and clarified sync behavior.
- 2026-02-15: Migrated template sync persistence from legacy ORM to TypeORM.
- 2026-02-15: Added template listing query for frontend template management screens.
- 2026-02-16: Added template CRUD and status lifecycle mutations with tenant-scoped persistence.

