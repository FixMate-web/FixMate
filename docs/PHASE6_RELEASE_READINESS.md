# FixMate — Phase 6 Release Readiness, QA & Deployment Runbook (Checkpoint C7)

**Timestamp:** 2026-10-29T18:41:00+03:00  
**Scope:** Parts 21 & 22 — Comprehensive QA Verification, Security Audit & Cloud Deployment Runbook (Vercel + Render + MongoDB Atlas)

---

## 1. Automated Verification Summary

| Suite / Gate | Command | Result | Details |
|---|---|---|---|
| Backend Build | `cd backend && npm run build` | **PASS** | `nest build` exits `0` with strict TypeScript |
| Backend Lint | `cd backend && npm run lint` | **PASS** | ESLint exits `0` across all `src/**/*.ts` |
| Backend Unit & Integration Tests | `cd backend && npm test -- --runInBand` | **PASS** | **9/9** suites, **42/42** tests passing |
| Frontend Production Build | `cd frontend && npm run build` | **PASS** | `ng build` exits `0` |
| Frontend Unit & Component Tests | `cd frontend && npm test -- --watch=false` | **PASS** | **8/8** suites, **22/22** tests passing |

---

## 2. Security & Privacy Verification Matrix

1. **Authentication & Session Security:**
   - Passwords hashed with `bcrypt` (12 salt rounds); `passwordHash` excluded (`select: false`) from all projections.
   - Short-lived JWT access tokens + rotated `httpOnly` refresh session cookies stored as SHA-256 hashes in `refresh_sessions`.
   - Suspended accounts (`AccountStatus.SUSPENDED`) are blocked at login, token refresh, and `JwtStrategy.validate()`.
2. **Authorization & IDOR Prevention:**
   - Role-gated endpoints enforced server-side via `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)`.
   - Ownership checks enforced on `/api/v1/addresses/:id`, `/api/v1/bookings/:id`, `/api/v1/project-requests/:id`, and `/api/v1/notifications/:id/read`.
3. **Public Projection Hygiene:**
   - Public provider endpoints (`/api/v1/providers`, `/api/v1/providers/:id`, `/api/v1/providers/:id/reviews`) return only `APPROVED` providers with `ACTIVE` user accounts and `VISIBLE` reviews, excluding emails, phone numbers, and internal `verificationNotes`.
4. **Input Validation & Injection Safety:**
   - Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
   - Search query parameters escaped via `escapeRegexLiteral()` before constructing MongoDB `$regex` filters.

---

## 3. Cloud Deployment Runbook (Documentation Only — Not Executed Automatically)

### 3.1 MongoDB Atlas (Database)
1. Provision an M0/M10 MongoDB Atlas cluster in a nearby region (e.g., `eu-central-1` Frankfurt for low latency to Jordan).
2. Create a dedicated database user with `readWrite` permissions on the `fixmate` database.
3. Configure network access and copy the `mongodb+srv://...` connection string into Render's `MONGODB_URI` secret.

### 3.2 Render (NestJS Backend Web Service)
- **Root Directory:** `backend`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm run start:prod`
- **Health Check Path:** `/api/v1/health`
- **Required Environment Variables:**
  - `NODE_ENV=production`
  - `PORT=3000`
  - `MONGODB_URI=<mongodb+srv-connection-string>`
  - `JWT_ACCESS_SECRET=<cryptographic-random-64-char-secret>`
  - `CORS_ORIGINS=https://<your-vercel-domain>.vercel.app`
- **Post-Deploy Seed:** Run `npm run seed:catalog` and `npm run bootstrap:admin` once against the production database.

### 3.3 Vercel (Angular v22 Frontend)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist/fixmate-frontend/browser`
- **SPA Routing Rewrite (`vercel.json`):** Rewrite all non-asset routes `/(.*)` to `/index.html`.
