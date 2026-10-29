# FixMate — Bilingual Home-Maintenance Services Marketplace (Phase 1 & Phase 2 Complete)

**FixMate** is a curated, bilingual (**Arabic RTL** / **English LTR**) home-maintenance marketplace initially targeting Jordan (`Asia/Amman` display timezone, monetary amounts in integer `JOD` minor units / `fils`, `1 JOD = 1000 fils`).

> **Current Implementation Status (Phase 1 + Phase 2 Complete — Parts 01–09):**
> - **Part 05 — Authentication & Accounts:** Short-lived HS256 JWT access tokens held strictly in memory + `HttpOnly` refresh cookie (`fm_refresh`) with database-backed rotation, replay detection (`RefreshSession`), CSRF Origin/X-Requested-With guard, RBAC (`CUSTOMER`, `PROVIDER`, `ADMIN`), `/users/me`, and safe CLI admin bootstrap (`npm run bootstrap:admin`).
> - **Part 06 — Service Categories & Catalog Management:** Public active category/service browsing (`GET /api/v1/categories`, `GET /api/v1/services` with bounded pagination, filters, sorting, and regex-safe search), Admin CRUD + soft-archive, idempotent canonical catalog seed (`npm run seed:catalog`), and Angular Admin Catalog Management UI (`/dashboard/admin/catalog`).
> - **Part 07 — Provider Onboarding, Offerings & Approval:** Provider profile editing, 30-minute availability schedule validation, active service offering attachment in integer `fils`, submission for review (`DRAFT -> PENDING_REVIEW`), and Admin approval/rejection/suspension moderation (`/dashboard/admin/providers`).
> - **Part 08 — Public Website & Service Discovery UI:** Bilingual home page (`/`), debounced URL-synced service catalog (`/services`, `/services/:slug`), `/about`, `/faq`, and `/contact`.
> - **Part 09 — Approved Provider Directory & Public Profiles:** Public provider directory (`/providers`) and provider profile pages (`/providers/:id`) returning strictly `APPROVED` providers with `ACTIVE` user accounts, sanitized public projections, truthful zero-review indicators, and explicit Phase 3 booking boundary notices.
> - **Deliberate Scope Boundary:** Customer booking submission (`POST /api/v1/bookings`), discrete 30-minute slot reservation transactions, and post-completion customer reviews belong to **Phase 3 (Parts 10–15)** and are intentionally not implemented yet.

---

## Quick Start (Local Development)

### 1. Start MongoDB via Docker Compose
```bash
docker compose up -d mongodb
```

### 2. Configure, Seed & Start the NestJS Backend (`http://localhost:3000/api/v1`)
```bash
cd backend
cp -n .env.example .env
npm install
npm run build

# Seed the 6 canonical categories and 12 services (idempotent)
npm run seed:catalog

# Bootstrap an initial ADMIN account (idempotent)
ADMIN_BOOTSTRAP_EMAIL="admin@fixmate.jo" ADMIN_BOOTSTRAP_PASSWORD="AdminPassword123" npm run bootstrap:admin

npm run start:dev
```

### 3. Install & Start the Angular v22 Frontend (`http://localhost:4200`)
```bash
cd frontend
npm install
npm start
```

---

## Verification & Testing Commands

```bash
# Backend build, lint, and all 7 integration/unit test suites (32 tests)
cd backend && npm run build && npm run lint && npm test -- --runInBand

# Frontend production build and all 5 unit/integration test suites (12 tests)
cd frontend && npm run build && npm test -- --watch=false
```

## Documentation Index
- **Phase 2 Architecture & Verification:**
  - [`docs/AUTH_DESIGN.md`](docs/AUTH_DESIGN.md)
  - [`docs/PROVIDER_ONBOARDING.md`](docs/PROVIDER_ONBOARDING.md)
  - [`docs/PHASE2_API_CONTRACT.md`](docs/PHASE2_API_CONTRACT.md)
  - [`docs/PHASE2_VERIFICATION.md`](docs/PHASE2_VERIFICATION.md)
  - [`docs/PHASE2_HANDOFF.md`](docs/PHASE2_HANDOFF.md)
  - [`docs/agent-handoff.md`](docs/agent-handoff.md)
- **Phase 1 Specifications:**
  - [`docs/01-product/PRD.md`](docs/01-product/PRD.md), [`BOOKING_LIFECYCLE.md`](docs/01-product/BOOKING_LIFECYCLE.md), [`ARCHITECTURE.md`](docs/01-product/ARCHITECTURE.md), [`DECISIONS.md`](docs/01-product/DECISIONS.md)
  - [`docs/02-ui/DESIGN_SYSTEM.md`](docs/02-ui/DESIGN_SYSTEM.md), [`docs/03-database/DATA_MODEL.md`](docs/03-database/DATA_MODEL.md), [`docs/04-operations/LOCAL_SETUP.md`](docs/04-operations/LOCAL_SETUP.md)
