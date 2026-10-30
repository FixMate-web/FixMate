# FixMate — Authentication, Authorization & Session Security Design (`Part 05`)

> **Document Status:** `IMPLEMENTED` in Phase 2 (Part 05)  
> **Scope:** End-to-end authentication, RBAC, ownership enforcement, refresh session rotation, CSRF protection, and safe CLI admin provisioning across Angular v22, NestJS, and MongoDB.

---

## 1. Trust Boundaries & Security Principles

1. **Backend Is the Sole Authoritative Security Boundary:**
   - Angular route guards (`authGuard`, `roleGuard`) and conditional UI templates exist strictly for user experience.
   - Every protected NestJS endpoint enforces authentication (`JwtAuthGuard`), role authorization (`RolesGuard`), and service-layer resource ownership checks (`userId` / `providerProfileId`).
2. **Zero Browser Storage for Tokens:**
   - Access tokens are held **exclusively in memory** inside Angular's `AuthService` signal state.
   - Refresh tokens are transported **exclusively via an `HttpOnly` cookie** (`fixmate_rt`) scoped to `/api/v1/auth`.
   - Neither `localStorage` nor `sessionStorage` ever stores JWTs or session secrets.
3. **Live Account State Verification:**
   - `JwtStrategy` does not blindly trust the `role` string inside an access token payload. On every authenticated request, it loads the minimal active `User` projection (`_id, email, fullName, phone, role, status, preferredLanguage`) from MongoDB and rejects the request with `401`/`403` if the user is `SUSPENDED` or `DEACTIVATED`.

---

## 2. Roles, Account States & Provider Approval Separation

### 2.1 User Roles (`UserRole`)
- **`CUSTOMER`:** Can register publicly, manage own profile and addresses, browse the public catalog and approved providers, and (optionally) submit a provider onboarding application via `POST /api/v1/providers/apply`.
- **`PROVIDER`:** Can register publicly (or transition via `/providers/apply`), manage own `users` profile and `provider_profiles` professional profile, configure `provider_services` offerings, and submit their profile for admin review.
- **`ADMIN`:** **Cannot** be created via any public HTTP endpoint. Provisioned exclusively via the local/ops CLI script (`npm run bootstrap:admin`). Can manage catalog categories/services and approve, reject, or suspend provider profiles.

### 2.2 Account Status vs. Provider Approval Status
FixMate strictly separates **account authentication status** (`users.status`) from **marketplace listing approval** (`provider_profiles.approvalStatus`):

| Layer | Field | Allowed Values | Effect |
| :--- | :--- | :--- | :--- |
| **User Account** | `users.status` | `ACTIVE`, `SUSPENDED`, `DEACTIVATED` | Controls whether the user can log in, refresh tokens, or call authenticated endpoints. |
| **Provider Profile** | `provider_profiles.approvalStatus` | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED` | Controls marketplace visibility. A `PROVIDER` with `ACTIVE` account status and `DRAFT` / `PENDING_REVIEW` / `REJECTED` profile status **can log in** to edit and submit their onboarding profile, but is **completely invisible** in public provider search (`GET /api/v1/providers`) and cannot receive bookings. |

---

## 3. Token & Session Architecture

### 3.1 Access Token (Short-Lived, In-Memory)
- **Algorithm:** `HS256` signed with `JWT_ACCESS_SECRET`.
- **Default TTL:** `15 minutes` (`900 seconds`, configurable via `JWT_ACCESS_TTL_SECONDS`).
- **Claims:**
  ```json
  {
    "sub": "6720f...",
    "role": "CUSTOMER",
    "tokenType": "access",
    "iss": "fixmate-api",
    "aud": "fixmate-client",
    "iat": 1793280000,
    "exp": 1793280900
  }
  ```
- **Transport:** Sent by Angular's functional `authInterceptor` in the `Authorization: Bearer <accessToken>` header **only** to URLs matching `environment.apiBaseUrl`.

### 3.2 Refresh Session (`refresh_sessions` Collection & `HttpOnly` Cookie)
- **Opaque Cookie Format:** `fixmate_rt=<sessionId>.<rawSecret>` where `sessionId` is a UUID v4 and `rawSecret` is 32 cryptographically random bytes (`base64url`).
- **Persistence (`refresh_sessions` schema):**
  - `sessionId` (unique string index)
  - `userId` (`ObjectId` ref `User`, indexed)
  - `familyId` (UUID string grouping a chain of rotated tokens)
  - `secretHash` (`SHA-256` hex digest of `rawSecret`, verified with `crypto.timingSafeEqual` — raw token is never stored in MongoDB)
  - `expiresAt` (`Date`, indexed with MongoDB TTL `expireAfterSeconds: 0`, default `7 days`)
  - `revokedAt` (`Date | null`)
  - `revocationReason` (`'ROTATED' | 'LOGOUT' | 'REPLAY_DETECTED' | 'ACCOUNT_SUSPENDED'`)
  - `replacedBySessionId` (`string | null`)
- **Rotation & Replay Detection (`POST /api/v1/auth/refresh`):**
  1. Parses `sessionId` and `rawSecret` from `req.cookies.fixmate_rt`.
  2. Looks up the session by `sessionId` and verifies `secretHash` in constant time.
  3. **Replay Detection:** If `session.revokedAt` is already set (e.g., an already-rotated token is presented a second time), the backend immediately revokes **all active sessions in the same `familyId`** (`revocationReason: 'REPLAY_DETECTED'`), clears the cookie, and throws `401 Unauthorized`.
  4. **Deterministic Concurrency:** Uses atomic `findOneAndUpdate({ sessionId, revokedAt: null }, { $set: { revokedAt: now, revocationReason: 'ROTATED', replacedBySessionId: newSessionId } })` so simultaneous refresh calls with the same cookie have a deterministic single winner; the concurrent duplicate fails cleanly with `401`.
  5. Issues a new `(newSessionId, newRawSecret)` in the same `familyId`, sets the rotated `HttpOnly` cookie, and returns a fresh access token + sanitized user profile.

### 3.3 Logout Semantics (`POST /api/v1/auth/logout`)
- Marks the current `refresh_sessions` record (and its `familyId`) as `revokedAt = new Date(), revocationReason = 'LOGOUT'` and clears the `fixmate_rt` cookie.
- Repeated calls to `/auth/logout` when already logged out or with a missing/expired cookie are idempotent and return `200 OK` (`{ loggedOut: true }`) with a cleared cookie.
- **Honest Revocation Boundary:** Logout immediately revokes the refresh session and clears the client's in-memory access token. Because access tokens are short-lived (`15m`), they expire naturally, while administrative account suspension (`status: 'SUSPENDED'`) takes effect immediately on the very next API request via `JwtStrategy`'s database check.

---

## 4. Cookie Transport, CORS & CSRF Defense

### 4.1 Cookie Attributes (`fixmate_rt`)
- `httpOnly: true` (inaccessible to `document.cookie` / XSS)
- `secure: NODE_ENV === 'production'` (`false` on `http://localhost` during local development)
- `sameSite: 'lax'`
- `path: '/api/v1/auth'` (cookie is only transmitted by the browser to `/api/v1/auth/*` endpoints, never on general catalog/provider requests)

### 4.2 Explicit CSRF Defense on Cookie-Authenticated Endpoints
Because CORS alone does not prevent Cross-Site Request Forgery on cookie-bearing `POST` requests, `POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout` enforce two layers of CSRF defense (`CsrfOriginGuard`):
1. **`Origin` / `Referer` Allowlist Check:** Production requires an `Origin` or `Referer`; its origin must match one of the configured `CORS_ORIGINS` (e.g., `http://localhost:4200`). Any mismatched browser origin is rejected with `403 Forbidden`.
2. **Custom Header Requirement (`X-Requested-With: FixMateClient`):** Requests must include `X-Requested-With: FixMateClient`. HTML `<form>` submissions and simple cross-site requests cannot set custom headers without triggering a CORS preflight, which the server denies for untrusted origins.

### 4.3 Local vs. Production Deployment Topology Note
- **Local Development:** `http://localhost:4200` (Angular) and `http://localhost:3000` (NestJS) are considered **same-site** by modern browsers (`localhost`), so `SameSite=Lax` cookies work seamlessly with `withCredentials: true`.
- **Production Cloud Prerequisite (Vercel + Render):** Deploying frontend on `*.vercel.app` and backend on `*.onrender.com` places them on different eTLD+1 public suffixes, where browsers block third-party cookies. The current deployment branch implements option 1 below; see [the deployment guide](DEPLOYMENT_GUIDE.md). For other topologies, either:
  1. Configure a Vercel rewrite rule (`/api/v1/:path*` → Render backend URL) so the browser communicates same-origin, **or**
  2. Host under a shared custom domain (`app.fixmate.jo` and `api.fixmate.jo`).

---

## 5. Standalone-Safe Provider Registration Consistency

In Phase 2, local MongoDB runs as a single container without requiring a multi-node replica set. When a user registers with `role: 'PROVIDER'`:
1. `AuthService.register()` inserts the `users` document (`role: UserRole.PROVIDER`).
2. It immediately calls `ProvidersService.ensureDraftProfileForUser(user)` to create the initial `provider_profiles` document (`approvalStatus: ProviderApprovalStatus.DRAFT`).
3. If creating the `provider_profiles` document fails, `AuthService` performs compensating cleanup (`userModel.deleteOne({ _id: user._id })`) before rethrowing.
4. Additionally, `ProvidersService.getMyProfile()` is idempotent: if a `PROVIDER` user ever lacks a `provider_profiles` document, it initializes the `DRAFT` profile on the fly. Under no circumstance can a partially created provider account become `APPROVED`.

---

## 6. Safe Admin Provisioning (`npm run bootstrap:admin`)

- **No Public Admin Endpoint:** `RegisterDto` strictly validates `role` against `['CUSTOMER', 'PROVIDER']`. Passing `role: 'ADMIN'` returns `400 Bad Request`.
- **Controlled Local CLI Script (`backend/src/scripts/bootstrap-admin.ts`):**
  - Invoked via `cd backend && ADMIN_BOOTSTRAP_EMAIL=... ADMIN_BOOTSTRAP_PASSWORD=... ADMIN_BOOTSTRAP_NAME="..." npm run bootstrap:admin`.
  - Refuses to execute if `NODE_ENV === 'production'` unless `ALLOW_PRODUCTION_ADMIN_BOOTSTRAP=true` is explicitly passed in the environment.
  - Validates email format and password complexity (`>= 10` chars), hashes password with `bcrypt` (cost factor `12`), and idempotently upserts/verifies the `ADMIN` user without printing the password or hash.

---

## 7. Explicitly Deferred Auth Features (Phase 4)
- **Email Verification & Password Reset Emails:** Because SMTP/Nodemailer and BullMQ background workers belong to Phase 4, Phase 2 does **not** expose fake "verification email sent" or "password reset link emailed" screens.

## Rotation and family-revocation concurrency

Family revocation marks ancestors as well as active sessions, preserving original revocation timestamps. After inserting a rotated successor, refresh verifies that its predecessor still has the ROTATED reason; if replay or logout revoked the family during insertion, the successor is revoked and the request returns 401. This closes the in-flight successor race without changing the stored schemas or requiring replica-set transactions. Deterministic integration tests pause insertion and exercise both replay and logout during that window.
