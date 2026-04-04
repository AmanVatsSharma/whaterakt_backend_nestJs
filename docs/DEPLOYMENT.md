# Deployment notes

## Services

- **API:** `Dockerfile` — exposes `3000`, runs migrations when `NODE_ENV=production` and `TYPEORM_MIGRATIONS_RUN` is unset (defaults to `true` in production).
- **Worker:** `Dockerfile.worker` — set `TYPEORM_MIGRATIONS_RUN=false` so only the API runs schema migrations (see `docker-compose.yml`).
- **Frontend:** `whaterakt_frontend/Dockerfile` — Next.js on port `3000` in-container. In root `docker-compose.yml`, host maps **`3001:3000`** so the API can use host port **3000**. Set `BACKEND_API_URL=http://api:3000` for the BFF.

## Health checks

- **`GET /health/live`** — HTTP 200 if the process responds (liveness).
- **`GET /health/ready`** and **`GET /health`** — HTTP **503** if database, Redis, or the Bull message queue check fails (readiness). The API `Dockerfile` `HEALTHCHECK` uses **`/health/ready`**.

## Production configuration

- **Secrets:** `validateConfig` rejects weak `JWT_SECRET` and placeholder `WHATSAPP_ACCESS_TOKEN` when `NODE_ENV=production`.
- **WhatsApp webhooks:** In production, `WHATSAPP_APP_SECRET` and `x-hub-signature-256` are required for POST; GET verification requires `WHATSAPP_VERIFY_TOKEN`.
- **Shopify webhooks:** In production, `x-shopify-hmac-sha256` is required for order/customer/product webhooks; `SHOPIFY_WEBHOOK_SECRET` must be set.
- **GraphiQL:** Disabled in production unless `GRAPHQL_IDE_ENABLED=true`.
- **Swagger UI:** Disabled in production unless `SWAGGER_ENABLED=true`.
- **Metrics:** When `METRICS_BEARER_TOKEN` is set, `GET /metrics` requires header `Authorization: Bearer <token>`.
- **Rate limits:** Optional strict mode: `RATE_LIMIT_FAIL_CLOSED=true` returns 503 when Redis cannot enforce limits.

## Compose

From `whaterakt_backend/`:

```bash
docker compose up --build
```

Ensure real tokens replace compose placeholders before any public exposure.

The compose file includes **`web`** (Next.js), **`api`**, **`worker`**, Postgres, and Redis. Template sync and outbound sends use **`WHATSAPP_GRAPH_BASE`**, **`WHATSAPP_GRAPH_VERSION`**, and a resolved **phone number id** (same as the Graph messages API). Optional **`WHATSAPP_API_URL`** is only for a non-Graph mock that implements `GET .../message_templates`.
