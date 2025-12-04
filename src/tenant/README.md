# Tenant Module Enhancements

We are evolving this module into the control plane for enterprise-grade multi-tenancy.

## Desired Capabilities
- **Plan tiers**: capture plan, feature flags, quotas on the tenant row (TypeORM entity already includes plan/status/region).
- **Lifecycle hooks**: onboarding approvals, suspension/reactivation, regional routing.
- **Quotas**: track campaign/message limits and surface them to metrics + rate limit guards.
- **Auditability & Access Control**: every tenant mutation logs into the request context, and sensitive GraphQL operations are wrapped with `@RequirePermissions` + `RbacGuard` (`tenant:manage` today).

## Flow Chart

```text
[Signup/Register GraphQL]
        |
        v
 TenantService -> Prisma (today)
               -> TypeORM TenantOrmEntity (soon, dual-write)
               -> Seeds RBAC defaults + emits events for billing/quota services
```

## Next Steps
1. Dual-write tenant creation to TypeORM via a dedicated repository.
2. Expose admin mutations/resolvers for plan management with RBAC enforcement.
3. Add background jobs detecting dormant tenants and syncing with billing providers.
4. Tighten middleware so every request carries tenant metadata + feature map.

Keep this document in sync with code changes so ops teams can validate expectations quickly.
