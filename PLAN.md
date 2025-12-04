MVP bring-up plan for NestJS WhatsApp Marketing API

1) Install deps and generate Prisma (done)
2) Fix build issues and align imports (done)
3) Relax config validation for dev, add .env.example (done)
4) Start app and validate runtime endpoints (GraphQL, Swagger, health, metrics)
5) Add Prisma dev database (SQLite) and migrations if needed
6) Smoke test queues, WhatsApp service mock, AI suggestion mock

Run commands
- npm install
- npx prisma generate
- npm run build
- npm run start:dev (or npm run start)

ENV
- Copy .env.example to .env and adjust as needed.

Notes
- Bull redis is optional; if not set, queues run in-memory via InMemoryMessageQueue where used.
- Swagger at /api
- GraphQL at /graphql (Yoga), GraphiQL enabled

---

## Enterprise Phase Plan: RBAC + TypeORM + Rich Multi-Tenancy

### Phase 0 – Discovery & Guardrails
- **Inventory current Prisma usage**: catalog services/resolvers relying on Prisma Client (auth, tenant, campaign, contact, analytics, automations, whatsapp, metrics, health). Output spreadsheet with model/DTO dependencies.
- **Document tenancy touchpoints**: trace `TenantMiddleware`, guards, and service-level `tenantId` scoping to ensure parity once TypeORM lands.
- **Select RBAC strategy**: decide between attribute-based RBAC (roles + feature flags) vs. hierarchical roles with permission tables. Capture requirements from product/security teams.
- **Decide migration style**: big-bang vs. incremental dual-write (Prisma + TypeORM). Recommend incremental to reduce risk.

### Phase 1 – TypeORM Foundation
1. **Set up shared TypeORM infrastructure**
   - Add TypeORM + pg driver deps.
   - Create `src/database/typeorm.config.ts` with dynamic connection options (per-tenant schemas vs. single schema with tenantId column).
   - Implement DatabaseModule exporting `DataSource` plus custom repositories.
2. **Model parity**
   - Generate TypeORM entities mirroring current Prisma models. Include decorators for indexes, relations, and multi-tenant constraints.
   - Introduce migrations using TypeORM CLI; ensure we can run alongside Prisma until cut-over.
3. **Tenant-aware repositories**
   - Implement base repository that injects tenant context (similar to `TenantAwareService`) and enforces `tenantId` filtering automatically.
   - Add request-scoped provider to set tenant context once per GraphQL request.
4. **Dual persistence (optional)**
   - For critical tables (User, Tenant, Campaign), add dual-write layer so both Prisma + TypeORM stay in sync during migration window.
5. **Cut-over checklist**
   - Replace PrismaService usage module-by-module with TypeORM repositories.
   - Remove Prisma artifacts only when 100% of modules are on TypeORM and migrations are replayed in CI.

### Phase 2 – Richest Multi-Tenancy
1. **Tenant provisioning lifecycle**
   - Extend `tenant` module to track plan tier, status (active/suspended), region, feature toggles.
   - Add onboarding workflows (approvals, invite flows) and audit logging.
2. **Isolation strategies**
   - Decide between schema-per-tenant vs. row-level security. If staying single schema, add database-level RLS policies (e.g., Postgres RLS) enforced via TypeORM queries.
   - Build tenant-aware caching strategy (Redis key namespacing).
3. **Cross-tenant governance**
   - Implement quota enforcement service (campaign count, message throughput).
   - Add rate limit overrides per plan.
4. **Tenant tooling**
   - Tenant switcher in request context for admin APIs.
   - Background jobs to detect dormant tenants, billing hooks, data export tooling.

### Phase 3 – RBAC & Policy Enforcement
1. **Role/Permission modeling**
   - Tables: `roles`, `permissions`, `role_permissions`, `user_roles`, optionally `policies` for conditional grants.
   - Seed default roles (Owner, Admin, Manager, Agent, Analyst).
2. **Authorization middleware**
   - Create `@Roles()` decorator plus GraphQL guard leveraging the RBAC service.
   - Add policy evaluation service capable of contextual checks (tenant status, campaign ownership).
3. **Feature flag integration**
   - Tie RBAC into plan/feature toggles so premium features require both role + plan entitlement.
4. **Admin tooling**
   - GraphQL mutations & UI endpoints to assign roles, manage custom roles per tenant, and audit changes.
5. **Testing**
   - Unit tests for RBAC resolver/service combos.
   - E2E scenarios covering multi-tenant, multi-role access (e.g., Agent cannot publish campaign, Owner can).

### Phase 4 – Hardening & Observability
- **Data migration testing**: rehearse TypeORM migrations + data integrity verification scripts in staging.
- **Telemetry**: extend Metrics/Logging to capture RBAC decisions, tenant throttling, and TypeORM query health.
- **Chaos/resilience drills**: simulate tenant-specific outages (Redis/per-tenant DB) to ensure graceful degradation.

### Deliverables & Exit Criteria
- TypeORM fully replaces Prisma with green CI/CD and reproducible migrations.
- RBAC APIs + guards enforce all critical mutations/queries with auditable logs.
- Tenant lifecycle tooling (provisioning, quotas, billing hooks) meets enterprise SLAs.
- Documentation updated per module (`src/auth/README.md`, new `src/tenant/README.md`, `src/database/README.md`, etc.) plus Ops runbooks for migrations and tenancy support.
