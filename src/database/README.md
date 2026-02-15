# Database Modernization (TypeORM)

Database access is fully centralized on TypeORM for richer RBAC scenarios, custom migrations, and advanced multi-tenant strategies.

## Flow Chart

```text
[Request] -> TenantMiddleware -> DatabaseModule(TypeORM)
                               ├─ TenantOrmEntity
                               ├─ UserOrmEntity
                               └─ Domain entities (campaign/contact/shopify/team)
```

## Key Decisions
- **Single DB / tenantId column** for now. We can later evolve to schema-per-tenant or RLS once the repositories land.
- **TypeORM entities mirror business domains** and are reused across modules.
- **Seed hooks** ensure RBAC defaults are created when new tenants are provisioned.

## Next Steps
1. Introduce formal TypeORM migrations for production rollouts.
2. Harden repository-level pagination/filter helpers for large tenants.
3. Add schema validation checks in CI before deployment.

Keep this README in sync with any future database architectural tweaks. Include flow charts and console logging references whenever the structure changes.
