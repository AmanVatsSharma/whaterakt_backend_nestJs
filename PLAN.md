TypeORM backend bring-up notes

1) Install dependencies
- npm install

2) Verify configuration
- Copy `.env.example` to `.env`
- Ensure `DATABASE_URL` points to your local PostgreSQL instance

3) Build and run
- npm run build
- npm run start:dev

4) Smoke checks
- Swagger: `/api`
- GraphQL: `/graphql`
- Health: `/health`
- Metrics: `/metrics`

Notes
- TypeORM is configured with `synchronize=true` for local development in this migration phase.
- Queue processing runs with Redis when `REDIS_HOST` is set.
