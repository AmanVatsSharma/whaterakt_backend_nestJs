# Database Modernization (TypeORM)

We are migrating away from Prisma to TypeORM to unlock richer RBAC scenarios, custom migrations, and advanced multi-tenant strategies.

## Flow Chart

```text
[Request] -> TenantMiddleware -> DatabaseModule(TypeORM)
                               ├─ TenantOrmEntity
                               ├─ UserOrmEntity
                               └─ TenantAwareRepository (scopes tenantId)
```

## Key Decisions
- **Single DB / tenantId column** for now. We can later evolve to schema-per-tenant or RLS once the repositories land.
- **TypeORM entities mirror Prisma** so dual-write is feasible while we migrate modules one-by-one.
- **Base repository + context setter** ensures every repository enforces tenant scoping consistently.

## Next Steps
1. Generate TypeORM migrations that recreate the existing schema.
2. Introduce module-specific repositories (Campaign, Contact, etc.) extending `TenantAwareRepository`.
3. Enable dual-write from services until we can safely remove Prisma usage.

Keep this README in sync with any future database architectural tweaks. Include flow charts and console logging references whenever the structure changes.
