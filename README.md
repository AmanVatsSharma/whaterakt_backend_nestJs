# Whaterakt Backend

NestJS backend for Whaterakt WhatsApp marketing platform.

## Quick Start

```bash
npm install
npm run start:dev
```

## Architecture

- Core domains are under `src/` and `src/modules/`.
- Module-level docs are maintained in each module at `MODULE_DOC.md`.
- Key new domains:
  - `src/modules/shopify-integration`
  - `src/modules/team-onboarding`
  - `src/modules/integrations`

## Quality Commands

```bash
npm run build
npm run test
```

## Docs

- Module docs: `src/**/MODULE_DOC.md`
- Database entities: `src/database/entities/`
- Database bootstrap: `src/database/database.module.ts`
