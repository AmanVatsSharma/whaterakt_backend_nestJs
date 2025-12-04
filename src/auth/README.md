# Auth Module Overview

This module centralizes every authentication surface in GraphQL and keeps the few controller endpoints that are better suited for binary payloads (e.g. streaming an MFA QR PNG). The implementation now covers:

- **Register → Login separation** so enterprise onboarding flows can decide whether to auto-create sessions.
- **Direct register-and-login** mutation for rapid pilots (currently no OTP – see inline TODO).
- **Password login with MFA challenges** backed by scalable Redis storage.
- **TOTP-based MFA enrollment** with encrypted secrets, hashed backup codes, and controller helpers for QR streaming.
- **Instrumentation/logging** at each layer to make live-debugging trivial.

## Flow Chart

```text
[Client] ──GraphQL(register/login/mfa)──> [AuthResolver]
        └──────────────controllers (QR)──────────────┘
                       │
                       ▼
                 [AuthService]
        ┌──────────┬───────────────┬────────────┐
        │Prisma    │TenantService  │MfaService  │Redis (challenges)
        └──────────┴───────────────┴────────────┘
                       │
                       ▼
               [JWT + Tenant payload]
```

## Mutations vs Controllers

| Surface | Responsibility |
| --- | --- |
| `registerTenantOwner` | Create tenant admin without session. |
| `registerAndLogin` | Direct auto-login onboarding (OTP TODO in code). |
| `login` | Password login, emits MFA challenge metadata when needed. |
| `completeMfaLogin` | Finalizes challenge using TOTP or backup code. |
| `beginMfaEnrollment` / `verifyMfaEnrollment` | Issue encrypted secrets + confirm tokens. |
| `GET /auth/mfa/:userId/qr` | Streams PNG QR when binary output is easier than GraphQL. |

Each resolver/controller logs intent plus key identifiers (never secrets) to simplify debugging.

## MFA Architecture Highlights

- Secrets are encrypted with AES-256-GCM using `MFA_SECRET_KEY` (falls back to `JWT_SECRET` if missing).
- Backup codes are hashed with bcrypt and automatically burned after use.
- Challenges live in Redis for multi-instance deployments, with an in-memory fallback for local dev.
- `MetricsService` exposes `auth_events_total` labels (`register`, `login`, `mfa_challenge`, `mfa_verified`) to feed observability dashboards.

## Operational Notes

- Ensure `MFA_SECRET_KEY`, `REDIS_HOST`, and `REDIS_PORT` are set in production for hardened storage + scalable challenges.
- After updating Prisma schema with MFA columns, run `prisma migrate deploy` followed by `prisma generate`.
- OTP enforcement for direct register-login is bookmarked in `AuthService.registerAndLogin`.

Keeping this document beside the module helps cross-check behavior quickly; update both the code and here whenever auth flows evolve.
