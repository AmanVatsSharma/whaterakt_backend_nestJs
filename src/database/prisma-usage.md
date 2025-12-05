# Prisma Touchpoints Inventory

Reference for the TypeORM migration sequence. Generated via `rg PrismaService src -l`.

- `src/auth/auth.module.ts`
- `src/auth/auth.service.ts`
- `src/auth/auth.service.spec.ts`
- `src/app.controller.ts`
- `src/app.module.ts`
- `src/tenant/tenant.service.ts`
- `src/tenant/tenant.module.ts`
- `src/inbox/conversation.service.ts`
- `src/inbox/inbox.module.ts`
- `src/template/template.module.ts`
- `src/template/template.service.ts`
- `src/template/template.service.spec.ts`
- `src/analytics/analytics.module.ts`
- `src/analytics/analytics.resolver.ts`
- `src/whatsapp/webhook.controller.ts`
- `src/whatsapp/whatsapp.module.ts`
- `src/whatsapp/whatsapp.service.ts`
- `src/whatsapp/whatsapp.service.spec.ts`
- `src/whatsapp/whatsapp.processor.ts`
- `src/contact/contact.module.ts`
- `src/contact/contact.service.ts`
- `src/contact/contact.resolver.ts`
- `src/contact/contact.service.spec.ts`
- `src/contact/contact.resolver.spec.ts`
- `src/health/prisma.health.ts`
- `src/ai/ai.service.ts`
- `src/ai/ai.service.spec.ts`
- `src/campaign/campaign.service.ts`
- `src/campaign/campaign.resolver.ts`
- `src/campaign/campaign.processor.ts`
- `src/campaign/campaign.service.spec.ts`
- `src/campaign/campaign.resolver.spec.ts`
- `src/core/services/tenant-aware.service.ts`
- `src/core/middlewares/tenant.middleware.ts`
- `src/core/core.module.ts`
- `src/automations/automations.service.ts`
- `src/automations/automations.module.ts`

Use this list to prioritize dual-write + migration order (e.g., auth/tenant first, then campaign/contact, etc.).
