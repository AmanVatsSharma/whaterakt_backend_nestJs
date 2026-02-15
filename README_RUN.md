How to run (MVP)

1. Copy environment
   cp .env.example .env

2. Install dependencies
   npm install

3. Build (optional in dev)
   npm run build

4. Run
   npm run start:dev

Endpoints
- Swagger: http://localhost:${PORT:-3000}/api
- GraphQL Yoga: http://localhost:${PORT:-3000}/graphql (GraphiQL enabled)
- Health (HTTP): GET /health
- Metrics (Prometheus): GET /metrics

Database (dev)
- Uses PostgreSQL via `DATABASE_URL`.
- TypeORM runs with `synchronize=true` in this local-dev migration phase.

Queues / Redis
- If REDIS_HOST is not set, Bull will not connect to Redis; jobs will queue in-memory/basic for MVP.

Troubleshooting
- If config validation errors occur, ensure NODE_ENV=development or set missing variables.
