# RBAC Module Skeleton

We need granular RBAC for enterprise tenants. This module introduces TypeORM entities and service scaffolding that we will wire into resolvers/controllers once TypeORM fully backs the stack.

## Flow Chart

```text
[GraphQL Guard] -> RbacService.hasAccess()
                -> RoleEntity / PermissionEntity / UserRoleEntity (TypeORM)
                -> Tenant context via TypeORM connection
```

## Entities
- `RoleEntity`: tenant-scoped roles (Owner, Admin, Agent, etc.).
- `PermissionEntity`: resource/action catalog (e.g., `campaign:publish`).
- `RolePermissionEntity`: join table describing what each role can perform.
- `UserRoleEntity`: user assignments, ready for conditional constraints.

## Service Hooks
- `assignRole(tenantId, userId, roleName)` for onboarding flows.
- `hasAccess(userId, resource, action, options)` for guards with:
  - plan entitlement checks (`requiredPlan`)
  - attribute-based policy constraints (`constraints` vs request attributes)
  - short-lived in-memory decision caching (`RBAC_CACHE_TTL_MS`)

## Guard & Decorator
- `RbacGuard` enforces permissions in GraphQL/REST handlers. Use `@UseGuards(RbacGuard)` and tag resolvers with `@RequirePermissions({ resource, action })`.

## Seed Data
- `seedRbacDefaults` is triggered when tenants are created to ensure every workspace gets default permissions/Owner role.

Pair this README with guard/resolver updates as we expose GraphQL decorators. Always log RBAC decisions (done in `RbacService`) for audit trails.
