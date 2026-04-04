# Module: auth

**Short:** Handles registration, login, JWT, and MFA flows.

**Purpose:** Secure tenant owner onboarding and authentication lifecycle with optional MFA challenge flow.

**Files:**
- auth.module.ts
- auth.resolver.ts
- auth.controller.ts
- auth.service.ts
- mfa.service.ts
- dto/
- entities/
- strategies/

**Flow diagram:** `flowcharts/auth-flow.svg`

**Dependencies:** tenant, metrics, rbac, database repositories, Redis challenge storage.

**APIs:**
- GraphQL mutations: register/login/MFA
- REST: MFA QR streaming, forgot-password, reset-password

**Env vars:** `JWT_SECRET`, `MFA_SECRET_KEY`, `REDIS_HOST`, `REDIS_PORT`

**Tests:** resolver/service unit tests + MFA integration scenarios.

**Change-log:**
- 2026-04-04: MFA QR stream (`GET auth/mfa/:userId/qr`) requires JWT and matches authenticated user id (no cross-user enrollment).
- 2026-02-15: Aligned module documentation with latest MFA + onboarding flow.
- 2026-02-15: Implemented password reset token request/consume endpoints with Redis and in-memory fallback.
- 2026-02-15: Hardened `registerAndLogin` with configurable OTP enforcement (`AUTH_SIGNUP_OTP_REQUIRED`, `AUTH_SIGNUP_OTP_CODE`) and timing-safe code comparison.
- 2026-02-15: Extended signup input contract with optional `otpCode` and class-validator constraints.
- 2026-02-15: Added auth service tests for OTP-required rejection and OTP-valid direct onboarding success paths.

