# Pursio backend

Node.js/Express API for Pursio. The first slice provides authenticated accounts, profile and policy persistence, a server-side pause switch, audit events, and provider-neutral billing records. Gmail, CV storage, AI jobs, and checkout are not active yet.

## Code layout

```text
src/
  config/       environment validation
  controllers/  HTTP request and response handling
  routes/       endpoint registration
  services/     account, profile, policy, activity, billing logic
  middleware/   authentication, origin check, errors, request IDs
  models/       Drizzle table definitions
  db/           PostgreSQL connection
  validators/   input contracts
  lib/          small security primitives
```

No empty `helpers` folder is included; a helper belongs in `lib` only when shared behavior exists.

## Local setup

Use Node.js 22 or newer. Copy `.env.example` to `.env` and replace every example secret. `DATABASE_URL` is used by the API and Drizzle; `POSTGRES_PASSWORD` is used by Compose. Keep their passwords in sync.

The Compose file uses the already available `postgres:17-alpine` image on localhost port 5434, with a dedicated Pursio volume. It does not build an image or touch other app containers. An optional `redis:alpine` service is defined on localhost port 6381 under the `worker` profile; start it when the queue worker exists.

```bash
cp .env.example .env
# Edit .env before proceeding.
docker compose --env-file .env up -d postgres
npm install
set -a; . ./.env; set +a
npm run db:migrate
npm run dev
```

`npm run db:generate` generates a reviewed SQL migration after schema changes. Commit migrations; use `db:migrate` to apply them. Do not use schema push against production.

The API listens on port 4000 by default. The frontend origin is `WEB_ORIGIN`, initially `http://localhost:3000`. Browser requests must send cookies (`credentials: "include"`). State-changing requests must have an exact matching `Origin` header. In production use HTTPS and set `COOKIE_SECURE=true`.

## Current API

- `POST /api/auth/register` requires email, password, display name, and `registrationKey`; registration is invite-only until public onboarding and billing are designed.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `GET/PUT /api/profile`.
- `GET/PUT /api/agent-policy`; `POST /api/agent/pause` and `/api/agent/resume`.
- `GET /api/activity` and `GET /api/billing`.
- `GET /health/live` and `/health/ready`.

A new account starts paused in observe mode with zero daily outreach. The policy route records requested settings but no external action executor exists yet. Billing records have no checkout or entitlement behavior yet. Stripe is the selected provider. Normal workspace features will remain free; AI processing and automation will require a paid entitlement once Stripe checkout and verified webhooks are implemented. Account, profile, CV management, manual opportunities, activity, billing status, data export/deletion, and pause must remain available without payment.

## Security and deployment

Sessions use random 256-bit opaque tokens in an HttpOnly cookie; only SHA-256 hashes are stored in PostgreSQL. Passwords use Argon2id. The API validates input, limits authentication attempts in PostgreSQL, requires the configured origin for mutations, and records policy/account changes in an audit table. Put the API behind HTTPS and a trusted reverse proxy. Do not expose PostgreSQL publicly. Configure backups, secret management, monitoring, and a deployment-specific proxy/rate limit before production traffic.
