# FixMate — Phase 2 Implemented API Contract (Parts 05–09)

**Base Prefix:** `/api/v1`  
**Authentication:** `Authorization: Bearer <accessToken>` (short-lived HS256 JWT in memory, default 900s) + `fm_refresh` (`HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth` cookie for `/auth/refresh` and `/auth/logout` with `CsrfOriginGuard`).  
**Currency Standard:** Integer minor units in `fils` (`1 JOD = 1000 fils`, `currency: "JOD"`).  
**Duration & Slot Granularity:** Integer multiples of `30` minutes (`60..480` minutes).

---

## 1. Part 05 — Authentication & Account Management

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public (Throttled) | Registers a `CUSTOMER` or `PROVIDER` account (`ADMIN` rejected with `400`). Normalizes email, hashes password (`bcrypt`, cost 12), creates initial `DRAFT` `ProviderProfile` when `role === 'PROVIDER'`, sets `fm_refresh` cookie, and returns `{ user, accessToken, expiresInSeconds }`. |
| `POST` | `/api/v1/auth/login` | Public (Throttled) | Authenticates active user with timing-hardened `bcrypt.compare`, sets `fm_refresh` cookie, and returns `{ user, accessToken, expiresInSeconds }`. Returns `401` on invalid credentials and `403` on `SUSPENDED` account. |
| `POST` | `/api/v1/auth/refresh` | Cookie + `CsrfOriginGuard` | Validates and rotates `fm_refresh` session token. If a previously rotated token is replayed, revokes the entire `familyId` (`REPLAY_DETECTED`) and returns `401`. |
| `POST` | `/api/v1/auth/logout` | Cookie + `CsrfOriginGuard` | Revokes the refresh session family and clears the `fm_refresh` cookie. |
| `GET` | `/api/v1/users/me` | `JwtAuthGuard` | Returns sanitized current user profile (`id`, `fullName`, `email`, `phone`, `role`, `status`, `preferredLanguage`). |
| `PATCH` | `/api/v1/users/me` | `JwtAuthGuard` | Updates allowlisted owner profile fields (`fullName`, `phone`, `preferredLanguage`). Rejects `role`, `status`, `email`, `passwordHash` modifications (`400`). |

---

## 2. Part 06 — Service Categories & Catalog Management

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/categories` | Public | Lists active categories (`isActive: true`) sorted by `displayOrder: 1, _id: 1`. |
| `GET` | `/api/v1/categories/:slug` | Public | Returns active category by `slug` along with its active services (`404` if missing or archived). |
| `GET` | `/api/v1/services` | Public | Paginated list of active services whose parent category is also active. Query params: `page` (default `1`), `limit` (`1..50`, default `12`), `categorySlug`, `categoryId`, `pricingType`, `q` (regex-escaped keyword search), `sort` (`displayOrder`, `price_asc`, `price_desc`, `title_asc`). |
| `GET` | `/api/v1/services/:slug` | Public | Returns active service by `slug` (`404` if service or parent category is archived). |
| `GET` | `/api/v1/admin/categories` | `ADMIN` | Lists all categories (active and soft-archived). |
| `POST` | `/api/v1/categories` (or `/api/v1/admin/categories`) | `ADMIN` | Creates a new category (`409` on duplicate `slug`). |
| `PATCH` | `/api/v1/categories/:id` (or `/api/v1/admin/categories/:id`) | `ADMIN` | Updates or soft-archives (`isActive: false`) a category. |
| `GET` | `/api/v1/admin/services` | `ADMIN` | Lists all services (active and soft-archived). |
| `POST` | `/api/v1/services` (or `/api/v1/admin/services`) | `ADMIN` | Creates a catalog service (`indicativeAmountFils` integer >= 0, `defaultDurationMinutes` multiple of 30 in `60..480`). |
| `PATCH` | `/api/v1/services/:id` (or `/api/v1/admin/services/:id`) | `ADMIN` | Updates or soft-archives (`isActive: false`) a catalog service. |

---

## 3. Part 07 — Provider Onboarding, Offerings & Admin Approval

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/providers/apply` | Authenticated (`CUSTOMER` / `PROVIDER`) | Creates or updates provider profile and transitions `CUSTOMER` role to `PROVIDER`. |
| `GET` | `/api/v1/providers/me` | `PROVIDER` | Returns owner projection of `ProviderProfile` (includes `approvalStatus`, `approvalFeedback.rejectionOrSuspensionReason`, `weeklyAvailability`, and `offerings`; excludes `verificationNotes` and `reviewedByUserId`). |
| `PATCH` | `/api/v1/providers/me` | `PROVIDER` | Updates allowlisted owner fields (`displayName`, `bio`, `yearsOfExperience`, `coverageGovernorates`, `coverageAreas`, non-overlapping `weeklyAvailability`). Rejects `approvalStatus` or `averageRating` writes (`400`). |
| `POST` | `/api/v1/providers/me/submit` | `PROVIDER` | Validates profile completeness (bilingual bio >= 10 chars, governorates, coverage areas, weekly availability, and >= 1 enabled active catalog service offering) and transitions `DRAFT` or `REJECTED` to `PENDING_REVIEW`. |
| `GET` | `/api/v1/providers/me/services` | `PROVIDER` | Lists all `ProviderServiceOffering` records owned by the authenticated provider. |
| `PUT` | `/api/v1/providers/me/services` | `PROVIDER` | Attaches or updates an offering for an active catalog service (`serviceId`, `pricingType`, integer `priceAmountFils`, `estimatedDurationMinutes` multiple of 30, `isEnabled`). |
| `DELETE` | `/api/v1/providers/me/services/:serviceId` | `PROVIDER` | Removes a service offering from the provider's profile. |
| `GET` | `/api/v1/admin/providers` | `ADMIN` | Paginated list of provider profiles filtered by `status` (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`), including admin-only `verificationNotes` and user contact details. |
| `PATCH` | `/api/v1/admin/providers/:id/approval` | `ADMIN` | Transitions provider approval status to `APPROVED`, `REJECTED`, or `SUSPENDED` (`reason` required for `REJECTED` and `SUSPENDED`). |

---

## 4. Part 09 — Public Provider Directory & Profiles

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/providers` | Public | Paginated list of strictly `APPROVED` providers whose owning `User` is `ACTIVE`. Query params: `page`, `limit` (`1..50`), `q`, `serviceSlug`, `serviceId`, `categorySlug`, `governorate`, `area`, `sort` (`newest`, `name_asc`, `experience_desc`). Returns sanitized `PublicProviderSummaryView` (zero private contact or moderation fields; `averageRating: null` when `reviewCount === 0`). |
| `GET` | `/api/v1/providers/:id` | Public | Returns sanitized `PublicProviderDetailView` (including `weeklyAvailability` and active offerings) if and only if the provider is `APPROVED` and user is `ACTIVE`; otherwise returns `404`. |

---

## 5. Deferred to Phase 3 (Parts 10–15)

- Customer address CRUD (`/api/v1/addresses`)
- Customer booking creation and lifecycle transitions (`/api/v1/bookings`)
- Discrete 30-minute UTC slot reservation (`ProviderSlot` multi-document transactions)
- Post-completion customer reviews (`POST /api/v1/bookings/:id/review`)
