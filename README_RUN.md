How to run (MVP)

1. Copy environment
   cp .env.example .env

2. Install and generate
   npm install
   npx prisma generate

3. Build (optional in dev)
   npm run build

4. Run
   npm run start:dev

Endpoints
- Swagger: http://localhost:${PORT:-3000}/api
- GraphQL Yoga: http://localhost:${PORT:-3000}/graphql (GraphiQL enabled)
- Health (HTTP): GET /health
- Metrics (Prometheus): GET /metrics

Prisma DB (dev)
- Using SQLite by default via DATABASE_URL=file:./dev.db
- To switch to Postgres, set DATABASE_URL accordingly.

Queues / Redis
- If REDIS_HOST is not set, Bull will not connect to Redis; jobs will queue in-memory/basic for MVP.

Troubleshooting
- If config validation errors occur, ensure NODE_ENV=development or set missing variables.
- If Prisma complains about migrations, run:
  npx prisma db push
