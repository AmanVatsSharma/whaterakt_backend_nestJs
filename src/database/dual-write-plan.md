# Tenant/User Dual-Write Rollout Plan

We need a staged migration where Tenant + User data is persisted to both Prisma and TypeORM until we finish the cut-over. This doc captures the strategy, toggles, and validation checkpoints so the team can move confidently.

## Flow Chart

```text
[GraphQL signup/login] 
      |
      v
 AuthService.registerTenantOwner()
      |
      +--> PrismaService (existing path)
      |
      +--> TypeORM repositories (new path)
             └─ emits audit logs + metrics
```

## Phase Breakdown

### Phase A – Repository Layer
- Create `TenantRepository` and `UserRepository` that extend `TenantAwareRepository`.
- Inject them into `TenantService` and `AuthService`.
- Add feature flag `TYPEORM_DUAL_WRITE_ENABLED` (env var; now present in `.env.example`) so we can toggle TypeORM writes without redeploying.

### Phase B – Dual Write
- On create/update/delete operations for tenants + users:
  - Execute Prisma call (current source of truth).
  - If the feature flag is true, mirror data into TypeORM via the repositories.
  - Log both operations with request/tenant context for traceability.
- For reads, continue using Prisma until TypeORM parity is validated.

### Phase C – Validation
- Nightly job compares Prisma vs. TypeORM rows (counts + checksums) and emits metrics.
- Build an admin GraphQL query to compare a single tenant/user across both stores for debugging.

### Phase D – Cut-over
- Flip read paths (tenant lookup, auth login) to TypeORM behind another flag.
- Once the new path is stable, remove Prisma dependencies from auth + tenant modules.
- Update migrations/tests to rely solely on TypeORM.

## Operational Considerations
- **Backfill**: run a one-time script that iterates through all tenants/users via Prisma and inserts into TypeORM before enabling dual-write.
- **Error Handling**: if TypeORM mirror fails, log the error but do not fail the user request; emit a metric `dual_write_failures_total`.
- **Testing**: unit tests should mock both repositories to ensure the dual-write branch executes. Integration tests should set the flag and assert rows exist in both stores.

Keep this document updated as we implement each phase. Console logging and metrics references must remain accurate for SRE visibility.
