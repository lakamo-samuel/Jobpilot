# Pursio backend

Express/TypeScript modular API backed by PostgreSQL and Drizzle. Modules own their routes, controllers, services, repositories, and validation. Integrations isolate Cloudinary and Gemini from application logic. Billing and external automation are deferred.

## Local setup

Use Node.js 22 or newer. Copy `.env.example` to `.env` and set a strong `POSTGRES_PASSWORD` value. Set `RESEND_API_KEY` and `AUTH_EMAIL_FROM` to enable registration and recovery emails; the sending domain must be verified with Resend. The password in `DATABASE_URL` must match `POSTGRES_PASSWORD`. The `docker-compose.yml` file uses the existing `postgres:17-alpine` image and a Pursio-only volume on port 5434; it does not build an image or touch other app containers. Redis runs as a required service on port 6381 and is checked during startup and readiness.

```bash
cp .env.example .env
# Edit .env.
docker compose --env-file .env up -d postgres redis
npm install
set -a; . ./.env; set +a
npm run db:migrate
npm run dev
# In a second terminal after migrations:
npm run worker:dev
```

Generate and review SQL migrations with `npm run db:generate`; apply them with `npm run db:migrate`. For a disposable local database, `npm run db:push` directly synchronizes the schema. Use committed migrations for shared and production databases. `npm run db:migrate:deploy` applies committed migrations using production dependencies after a build. All committed migrations must be applied before running the new auth, Google, and quota routes.

## Render deployment

Create a **Node** web service with root directory `pursio-backend` and a Render PostgreSQL database. Set these fields:

```text
Build:      npm ci --include=dev && npm run build
Pre-deploy: npm run db:migrate:deploy
Start:      npm start
Health:     /health/ready
```

Create a separate Render background worker from the same repository and environment, with build command `npm ci --include=dev && npm run build` and start command `npm run worker`. Give it the same database, Redis, Cloudinary, and Gemini variables. Run only the web service migrations before starting either process. The API can accept uploads while the worker is temporarily down; pending extraction resumes when it starts.

Render offers pre-deploy commands on paid web services. If your plan does not offer one, use `npm run db:migrate:deploy && npm start` as the start command for a single instance. Do not run `db:push` on Render. Set `DATABASE_URL` to the Render database connection string and `REDIS_URL` to a managed Redis service, `NODE_ENV=production`, `WEB_ORIGIN` to the exact HTTPS frontend origin, `COOKIE_SECURE=true`, and the required integration variables from `.env.example`. Render provides `PORT`. Never copy your local `.env` or its localhost database URL into Render.

API documentation is served at `/docs` (Swagger UI) and `/openapi.json` (OpenAPI 3.1). Each route shows required fields, response bodies, examples, and error codes for frontend integration. The frontend should call the API with `credentials: "include"` and send its configured `Origin` for mutations. Verification and reset links point to frontend routes `/auth/verify-email` and `/auth/reset-password`; the frontend passes the token to the corresponding API POST route. Swagger UI may not execute mutations from an origin different from `WEB_ORIGIN`.

Cloudinary CV storage requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. CV upload and download return 503 in development until they are configured; production requires all three values at startup. Uploads are authenticated raw assets. The API checks ownership before issuing a 60-second signed download redirect. The default per-user limit is 10 distinct CVs and 100 MiB total across all versions. Change `CV_MAX_FILES` and `CV_MAX_STORAGE_BYTES` if needed. Each file is limited to 10 MiB and must be a detected PDF or DOCX. Users choose a free-text `roleFocus` (for example, Full-stack developer or Video editor) when uploading. `PATCH /api/cvs/:id` can change the label and/or role focus on that version; a new version inherits the selected version’s role focus if omitted.

Gemini extraction requires `GEMINI_API_KEY`; set `GEMINI_MODEL` to the model your account supports. `POST /api/opportunities/extract` accepts `sourceText` and returns a draft for review. It does not save the draft or send anything. Calls have a database-backed daily per-user limit (`AI_DAILY_REQUEST_LIMIT`, default 20). The AI integration is behind `AiProvider` so another model can be added without changing the opportunity module.

## Google redirect setup

Create a Google Cloud OAuth client of type **Web application**. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` together in `.env` or Render environment variables. Register the exact redirect URI in Google Cloud Console:

```text
Local:      http://localhost:4000/api/auth/google/callback
Production: https://YOUR_API_DOMAIN/api/auth/google/callback
```

The backend must be reached through the same host used in `GOOGLE_REDIRECT_URI` so its short-lived OAuth cookie returns with Google's callback. Use `http://localhost:4000` locally, including when the frontend is on `http://localhost:3000`. The browser must navigate to `GET /api/auth/google/start`; do not call it with `fetch`. The callback uses state, PKCE, a signed HttpOnly flow cookie, and an ID-token nonce. The frontend route `/auth/google/callback` should show success after calling `/api/auth/me`, or show the `error` query parameter as a sign-in error. No Google token or authorization code is sent to the frontend. For production cookie sessions, serve the frontend and API on subdomains of the same site (for example `app.example.com` and `api.example.com`); unrelated hosting domains can block the session cookie on frontend API requests. Gmail uses a separate consent flow. Set `GMAIL_REDIRECT_URI` to the exact backend `/api/integrations/gmail/callback` URL and `GMAIL_TOKEN_ENCRYPTION_KEY` to 32 random bytes encoded as hex. Enable the Gmail API and request `gmail.readonly` on the Google consent screen. Users navigate to `/api/integrations/gmail/start`, then the backend returns to `/settings/integrations/gmail`. The frontend calls `/api/integrations/gmail/status`, `POST /sync`, and `GET /messages`. The worker automatically scans connected mailboxes every 15 minutes (run `npm run worker` in deployment). The first sync only indexes recent job-related inbox metadata and previews; it never sends email or applies for jobs. Google may require verification and a security assessment for restricted Gmail scopes before public production use.

## API

- Auth: `POST /api/auth/register`, `/verify-email`, `/resend-verification`, `/login`, `/logout`, `/forgot-password`, `/reset-password`; `GET /api/auth/me`, `/api/auth/google/start`, `/api/auth/google/callback`, `/api/auth/google/link/start`. Registration and recovery requests return generic 202 responses. Resend credentials and a verified sending domain are required to send account emails. Google sign-in uses a server-side OAuth authorization-code redirect; the frontend navigates the browser to `/api/auth/google/start` and never receives a Google credential. Google redirects to the configured backend callback, which creates a Pursio session and redirects to `${WEB_ORIGIN}/auth/google/callback`. The frontend then requests `/api/auth/me` with credentials. To link a Google account to an existing password account, navigate an authenticated browser to `/api/auth/google/link/start`. A matching verified Gmail or Google Workspace password account is linked automatically; other email domains require explicit linking. Existing pre-verification accounts must use `/resend-verification` before login.

- Dashboard: `GET /api/dashboard` returns current pipeline counts, agent state, recent opportunities, and recent activity. Its daily discovery count uses UTC.
- Profile and verified facts: `/api/profile` and `/api/profile/facts`.
- Agent policy and pause: `/api/agent/policy`, `/api/agent/pause`, `/api/agent/resume`.
- Job finding: `GET /api/jobs/sources`, `POST /api/jobs/search`, and `POST /api/jobs/save`. The user selects keywords, a two-letter country, optional state/region, and work mode. Remote search uses Himalayas; hybrid/onsite search uses Jooble only in configured countries. Searches do not save results until the user selects one.
- Manual opportunities: `/api/opportunities`, `/api/opportunities/:id`, `/api/opportunities/:id/status`, plus `/api/opportunities/extract`.
- CVs: `/api/cvs`, `/api/cvs/:id`, `/api/cvs/:id/versions`, `/api/cvs/:id/default`, `/api/cvs/:id/download`, `/api/cvs/:id/extraction`, and `/api/cvs/:id/extraction/retry`. Uploads return `status: parsing`. Poll the extraction endpoint until `ready` or `error`; failed extractions can be retried. Text and extracted claims are private to the CV owner, and claims remain unverified until reviewed. Scanned PDFs without extractable text return `no_extractable_text`; OCR is not implemented.
- Activity: `/api/activity`.
- Health: `/health/live`, `/health/ready`.

Browser requests must include cookies (`credentials: "include"`). Mutations require an `Origin` header exactly matching `WEB_ORIGIN`. Production requires HTTPS and `COOKIE_SECURE=true`.

## Security and operations

Sessions use random opaque tokens in HttpOnly cookies; only token hashes are stored. Passwords use Argon2id. The API validates input, limits login attempts in PostgreSQL, records changes in the audit table, and starts new accounts paused in observe mode. Put the API behind HTTPS and a trusted reverse proxy. Set `TRUST_PROXY_HOPS` to the exact number of trusted proxy hops so IP-based authentication throttling uses the real client IP; leave it at 0 if the API is reached directly. Startup checks PostgreSQL and Redis and refuses to serve if either is unavailable. It also probes the configured Gemini model, Cloudinary API, Google discovery, and Resend network, logging warnings for optional provider outages so core account and pipeline routes remain available. A sending-only Resend key cannot be verified without sending an email; its live authorization is checked on the first transactional email. `/health/ready` pings PostgreSQL and Redis. Keep both databases private and configure backups, secrets, monitoring, and a deployment-specific edge rate limit before production traffic.

Jest tests live in `test/`. Integration tests require a disposable PostgreSQL database with migrations applied: `TEST_DATABASE_URL=postgresql://... npm test`. Without it, database integration tests are skipped.

## Job search providers

Himalayas remote search works without an API key. Its listing URL and attribution must be shown in the frontend. For hybrid and onsite searches, obtain a separate Jooble API key for each country and set `JOOBLE_REGIONS_JSON`, for example `{"NG":{"host":"ng.jooble.org","key":"..."}}`. The backend validates hosts against Jooble domains. `GET /api/jobs/sources` tells the frontend which countries are currently configured. Jooble's free key has a 500-request lifetime limit per region; the backend caches identical searches for 10 minutes and limits users to 30 searches per hour. Jooble does not expose a verified onsite flag, so onsite results return `workMode: null`; the frontend must show that uncertainty. Job search is user-triggered in this feature; saved scheduled searches are a later feature.
