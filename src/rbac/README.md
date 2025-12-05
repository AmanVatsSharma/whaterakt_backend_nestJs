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
- `hasAccess(userId, resource, action)` for guards. TODOs remain for plan entitlements, attribute-based policies, and caching.

## Guard & Decorator
- `RbacGuard` enforces permissions in GraphQL/REST handlers. Use `@UseGuards(RbacGuard)` and tag resolvers with `@RequirePermissions({ resource, action })`.

## Seed Data
- `seedRbacDefaults` is triggered when tenants are mirrored to TypeORM to ensure every workspace gets default permissions/Owner role. This keeps RBAC consistent during the Prisma→TypeORM dual-write phase.

Pair this README with guard/resolver updates as we expose GraphQL decorators. Always log RBAC decisions (done in `RbacService`) for audit trails.
