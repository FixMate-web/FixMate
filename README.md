<p align="center">
  <img src="frontend/public/brand/fixmate-logo-160.webp" alt="FixMate emblem" width="80" height="80" />
</p>

<h1 align="center">FixMate</h1>

<p align="center">
  <strong>Home services, built around everyday life in Jordan.</strong><br />
  A bilingual marketplace for finding professionals, requesting services, and managing home-maintenance appointments.
</p>

<p align="center">
  Angular 22 · NestJS 11 · MongoDB 7 · TypeScript · Arabic RTL / English LTR
</p>

---

## Overview

FixMate connects customers with home-service professionals across Jordan. Customers can explore services and approved provider listings, request an appointment, or describe a project to a selected provider. Professionals manage their profiles, offerings, coverage areas, working hours, and service requests. Administrators manage the catalog, review provider applications, and oversee platform activity.

The application uses a standalone Angular frontend and a modular NestJS REST API backed by MongoDB. Arabic and English are supported throughout the interface, with Jordanian governorates, `Asia/Amman` scheduling, and prices represented in integer **fils**: **1 JOD = 1,000 fils**.

**Status:** actively developed application with implemented customer, provider, and administrator workflows. A successful production build is a compilation check, not a claim that a public deployment or production operations setup is complete.

## Contents

- [Features](#features)
- [Roles and workflows](#roles-and-workflows)
- [Technology and architecture](#technology-and-architecture)
- [Local setup](#local-setup)
- [Development accounts](#development-accounts)
- [Configuration](#configuration)
- [Development and verification](#development-and-verification)
- [Security model](#security-model)
- [Production considerations](#production-considerations)
- [Documentation](#documentation)
- [Scope and limitations](#scope-and-limitations)
- [Branding and asset provenance](#branding-and-asset-provenance)

## Features

### Service discovery

- Searchable service catalog with category, pricing-type, and sorting controls.
- **14 homepage category selectors and 56 featured service examples**, driven by the shared discovery taxonomy. The backend catalog also retains additional and legacy entries.
- Provider directory with service, category, governorate, and area filters, plus public provider profiles.
- Bilingual service details and indicative pricing where catalog data supports it. Services without published pricing show a quotation state rather than an invented amount.
- Responsive homepage with seven service-based hero scenes, reduced-motion support, integrated category navigation, How It Works, project exploration, and resource guides.

### Accounts and professional onboarding

- Customer and provider registration, login, session refresh, logout, and account-profile management.
- Provider profiles with bilingual biographies, coverage areas, weekly availability, and service offerings.
- Administrator approval before a provider listing becomes publicly available.
- Separate account status and provider approval status: being able to log in does not automatically make a provider publicly listed.

### Requests, bookings, and reviews

- Direct appointment requests with provider acceptance, rejection, cancellation, and work-progress tracking.
- Provider capacity represented by discrete 30-minute slots, with reservation checks to prevent overlapping accepted bookings.
- Project requests addressed to a selected provider, with a written response or decline. These are separate from appointment bookings.
- Customer reviews tied to completed bookings, with provider rating aggregation and review moderation.
- Persistent in-app notifications for supported booking, approval, and review events, with read-state management.
- Administrator views for operational metrics, accounts, catalog management, and provider moderation.

## Roles and workflows

| Role | Main capabilities | Workspace |
| --- | --- | --- |
| **CUSTOMER** | Browse services and providers, manage addresses, request appointments or projects, track work, and review completed bookings | `/dashboard/customer` |
| **PROVIDER** | Complete onboarding, manage offerings and schedules, respond to project requests, and manage appointment work | `/dashboard/provider` |
| **ADMIN** | Manage catalog and account status, review provider listings, and inspect platform activity | `/dashboard/admin` |

Administrators are provisioned through the existing CLI bootstrap; public registration cannot grant the `ADMIN` role.

The main booking progression is:

```text
REQUESTED → ACCEPTED → IN_PROGRESS → WORK_DONE → COMPLETED
```

Rejection, cancellation, and expiry follow the applicable state-transition rules. Provider onboarding follows `DRAFT → PENDING_REVIEW → APPROVED`, with rejection and suspension supported by administrative moderation.

## Technology and architecture

| Layer | Implementation |
| --- | --- |
| Frontend | Angular 22, standalone components, Signals, RxJS, TypeScript, SCSS |
| Backend | NestJS 11, Express, TypeScript, modular domain services |
| Persistence | MongoDB 7 and Mongoose 8 |
| Authentication | Passport/JWT, bcrypt, database-backed refresh sessions |
| Validation | `class-validator`, `class-transformer`, NestJS validation pipes |
| Testing | Vitest/JSDOM, Jest/Supertest, Playwright browser verification |
| Local infrastructure | Docker Compose for MongoDB; optional Redis profile |

```mermaid
flowchart LR
    Browser[Angular application] -->|REST /api/v1| API[NestJS API]
    API --> Auth[Authentication and authorization]
    API --> Domains[Catalog · Providers · Bookings · Requests · Reviews · Notifications · Admin]
    Auth --> DB[(MongoDB)]
    Domains --> DB
```

```text
FixMate/
├── backend/
│   ├── src/common/          # Authentication guards and domain rules
│   ├── src/database/        # Mongoose schemas and persistence modules
│   ├── src/modules/         # Application domains and REST endpoints
│   ├── src/scripts/         # Catalog seed, admin bootstrap, demo accounts
│   └── .env.example
├── frontend/
│   ├── src/app/             # Routes, features, layouts, and shared UI
│   ├── src/environments/    # Development and production API settings
│   ├── public/              # Logo, fonts, images, and discovery taxonomy
│   └── tools/               # Browser verification scripts
├── docs/                    # Architecture, contracts, research, and verification
└── compose.yaml             # Local MongoDB and optional Redis
```

## Local setup

### Prerequisites

- **Node.js 24.15 or newer within the 24.x line**, and **npm 11**. The installed Angular packages also support Node `^22.22.3` or `>=26.0.0`; Node 24 is the documented local-development choice.
- Docker with Docker Compose, or an existing local MongoDB 7 instance.
- Git. Browser verification scripts additionally require a compatible Chromium installation.

The commands below use a Bash-compatible shell and run from the repository root unless indicated otherwise.

### 1. Get the source and install dependencies

```bash
git clone https://github.com/FixMate-web/FixMate.git
cd FixMate
npm ci --prefix backend
npm ci --prefix frontend
```

For an existing checkout, skip cloning. The frontend and backend have separate package manifests and lockfiles; there is no root application install command.

### 2. Start MongoDB

```bash
docker compose up -d mongodb
```

Skip this step if MongoDB is already available at the configured URI. Compose persists data in a named volume. Redis is optional and is not required for the current core workflows.

### 3. Configure the backend

```bash
cp -n backend/.env.example backend/.env
```

Edit `backend/.env` and set a strong, unique `JWT_ACCESS_SECRET`; replace the example value. A new value can be generated with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

The example configuration uses local MongoDB at `mongodb://127.0.0.1:27017/fixmate`, backend port `3000`, and frontend origin `http://localhost:4200`.

### 4. Seed the catalog and optional demo accounts

```bash
npm run seed:catalog --prefix backend
ALLOW_DEMO_ACCOUNT_SEED=true npm run seed:demo --prefix backend
```

Both seeds are designed for repeat execution without resetting collections. The demo seed is optional; its restrictions and credentials are explained below.

The catalog seed and standalone admin bootstrap read `MONGODB_URI` from the shell environment, falling back to the local `fixmate` database. If you change the database URI in `backend/.env`, also export that same URI before running those two commands. The API and demo-account seed load the backend environment file themselves.

### 5. Run the application

Backend terminal:

```bash
npm run start:dev --prefix backend
```

Frontend terminal:

```bash
npm start --prefix frontend
```

| Entry point | Local URL |
| --- | --- |
| Website | `http://localhost:4200` |
| Login | `http://localhost:4200/auth/login` |
| API base | `http://localhost:3000/api/v1` |
| Health check | `http://localhost:3000/api/v1/health` |

The Angular development environment calls `http://localhost:3000/api/v1` directly. Use consistent hostnames when testing cookie sessions; `localhost` and `127.0.0.1` are not interchangeable browser origins.

## Development accounts

The opt-in demo seed creates these **local test accounts**, with distinct generated passwords:

| Email | Role |
| --- | --- |
| `admin.demo@fixmate.test` | ADMIN |
| `customer.demo@fixmate.test` | CUSTOMER |
| `provider.demo@fixmate.test` | PROVIDER |

Credentials are recorded in **`backend/.env.demo.local`**, which is Git-ignored and created with owner-only read/write permissions. Passwords are never printed by the seed or stored as plaintext in MongoDB. Do not commit, share, or include this file in a deployment.

```bash
ALLOW_DEMO_ACCOUNT_SEED=true npm run seed:demo --prefix backend
```

The demo seed:

- Requires explicit opt-in on every run and **always refuses production**.
- Accepts only loopback MongoDB targets with supported FixMate development/test database names.
- Reuses account IDs and credentials; refuses conflicting roles, statuses, or passwords instead of resetting existing accounts.
- Uses the existing admin bootstrap, registration service, and provider submission/approval workflow.
- Creates a clearly labeled test provider with an existing plumbing offering and catalog-derived pricing, zero reviews, and no seeded bookings.
- Preserves an approved demo profile's edits and does not silently reverse a rejection or suspension.

Explicit `DEMO_ADMIN_PASSWORD`, `DEMO_CUSTOMER_PASSWORD`, and `DEMO_PROVIDER_PASSWORD` environment variables can supply credentials instead of generated values. They must be distinct and meet the seed's strength requirements; existing accounts must already match them.

For a separate administrator account, use `npm run bootstrap:admin --prefix backend` with `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, and optionally `ADMIN_BOOTSTRAP_NAME` supplied securely through the environment. The existing bootstrap has its own production restrictions; do not use demo provisioning in production.

## Configuration

| Setting | Purpose | Local example/default |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | NestJS listening port | `3000` |
| `MONGODB_URI` | Database connection | `mongodb://127.0.0.1:27017/fixmate` |
| `CORS_ORIGINS` | Comma-separated allowed browser origins | `http://localhost:4200` |
| `JWT_ACCESS_SECRET` | Access-token signing secret | Supply a unique random secret |
| `JWT_ACCESS_TTL_SECONDS` | Access-token lifetime | `900` |
| `REFRESH_SESSION_TTL_DAYS` | Refresh-session lifetime | `7` |

Frontend API and locale settings live in `frontend/src/environments/`. Development uses the local API URL; production uses the relative `/api/v1` path. Supported pricing types are `FIXED`, `STARTING_AT`, and `INSPECTION_ONLY`; an absent catalog pricing policy is handled separately as quotation-only discovery.

## Development and verification

Run the current checks rather than relying on historical test counts in older reports:

```bash
# Backend compilation and tests
npm run build --prefix backend
npm test --prefix backend -- --runInBand

# Frontend production compilation and tests
npm run build --prefix frontend
npm test --prefix frontend -- --watch=false
```

Backend integration tests need local MongoDB and use test databases. Run them only against development/test infrastructure. Frontend browser checks require both applications to be running:

```bash
node frontend/tools/service-hero-review.cjs
```

This script checks the seven-scene slideshow loop, responsive layouts, bilingual rendering, image loading, and zoom continuity. It uses `/usr/bin/google-chrome` by default; set `CHROME_PATH` for a different compatible executable. Results are saved under `artifacts/service-heroes/`.

Other scripts in `frontend/tools/` and older verification reports may target earlier UI snapshots. Review their selectors and assumptions before treating them as current regression checks.

## Security model

- Passwords use **bcrypt with cost 12**.
- Short-lived JWT access tokens are held in frontend memory, not browser local/session storage.
- Refresh sessions use the **`fixmate_rt` HttpOnly cookie**, database-backed rotation, and replay detection. The cookie is scoped to `/api/v1/auth`, uses `SameSite=Lax`, and is marked `Secure` in production.
- Cookie-based refresh and logout require the `X-Requested-With: FixMateClient` header and an allowed origin when an origin is present.
- Server-side JWT, role, account-status, and ownership checks enforce authorization. Angular guards provide navigation behavior, not the security boundary.
- CORS, Helmet, strict DTO validation, and authentication-endpoint throttling provide additional controls.
- Provider listing approval does not claim government certification, insurance, background clearance, or guaranteed workmanship.

Logout revokes the refresh-session family and clears the client's in-memory token. An already issued access token remains subject to its short expiry and the API's live account-status checks.

## Production considerations

The repository includes production build commands, but a hosted environment still needs deployment configuration:

- Use production secrets and an appropriate MongoDB deployment; do not copy local environment files or demo data.
- Route frontend `/api/v1` requests to NestJS. Configure SPA fallbacks for frontend routes without intercepting API requests.
- Use HTTPS, production cookie settings, and the correct CORS allowlist. An arbitrary cross-site frontend/API pairing can prevent refresh cookies from working; prefer an appropriate same-site or same-origin arrangement.
- Start the compiled backend with `npm run start:prod --prefix backend` after building. Angular browser output is under `frontend/dist/fixmate-frontend/browser/`.
- Configure monitoring, backups, resource limits, and operational maintenance for the chosen hosting environment.

`compose.yaml` provisions local database services; it is not a complete containerized production deployment of the frontend and backend.

## Documentation

| Topic | Reference |
| --- | --- |
| Product scope and architecture | [PRD](docs/01-product/PRD.md), [Architecture](docs/01-product/ARCHITECTURE.md), [Decisions](docs/01-product/DECISIONS.md) |
| Authentication and sessions | [Authentication design](docs/AUTH_DESIGN.md) |
| Provider onboarding | [Provider onboarding and approval](docs/PROVIDER_ONBOARDING.md) |
| API reference | [Phase 2 API contract](docs/PHASE2_API_CONTRACT.md) |
| Booking rules | [Booking lifecycle](docs/01-product/BOOKING_LIFECYCLE.md), [Booking verification](docs/PHASE3_BOOKING_VERIFICATION.md) |
| Dashboards and notifications | [Dashboard verification](docs/PHASE4_DASHBOARDS_VERIFICATION.md), [Notifications verification](docs/PHASE5_ADVANCED_VERIFICATION.md) |
| Jordanian pricing | [Pricing research and assumptions](docs/jordan-service-pricing-research.md) |
| Design and photography | [Design system](docs/02-ui/DESIGN_SYSTEM.md), [Image sources](docs/image-sources.md), [Discovery image sources](docs/discovery-image-sources.md) |
| Deployment assessment | [Release-readiness notes](docs/PHASE6_RELEASE_READINESS.md) |

Some documents describe earlier development phases. Their feature lists, counts, and deployment examples are historical context; current source code, package scripts, and executable tests determine actual behavior.

## Scope and limitations

The current implementation does **not** provide online payments, live WebSocket chat, technician location tracking, external SMS/WhatsApp delivery, or production email delivery. Provider responses to project requests are written responses, not a separate competitive-bidding or itemized-quotation engine. Project-photo uploads and credential-document verification are not implemented in these flows.

Empty provider results, unpublished pricing, and missing reviews are represented explicitly. Demo providers are for local testing and must not be presented as real service professionals.

## Branding and asset provenance

FixMate uses its supplied house-and-wrench emblem, navy/cyan palette, and self-hosted Inter and Noto Sans Arabic fonts. Stock imagery and the seven AI-generated hero scenes are illustrative; they do not depict actual FixMate providers or completed customer projects.

Image sources, generation prompts, and relevant font/photography licensing records are linked from [image-sources.md](docs/image-sources.md). Third-party assets retain their applicable terms. The backend package is marked `UNLICENSED`; this repository does not currently include an open-source license for the application source.
