MVP bring-up plan for NestJS WhatsApp Marketing API

1) Install deps and generate Prisma (done)
2) Fix build issues and align imports (done)
3) Relax config validation for dev, add .env.example (done)
4) Start app and validate runtime endpoints (GraphQL, Swagger, health, metrics)
5) Add Prisma dev database (SQLite) and migrations if needed
6) Smoke test queues, WhatsApp service mock, AI suggestion mock

Run commands
- npm install
- npx prisma generate
- npm run build
- npm run start:dev (or npm run start)

ENV
- Copy .env.example to .env and adjust as needed.

Notes
- Bull redis is optional; if not set, queues run in-memory via InMemoryMessageQueue where used.
- Swagger at /api
- GraphQL at /graphql (Yoga), GraphiQL enabled
