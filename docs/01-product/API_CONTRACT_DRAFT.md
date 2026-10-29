# FixMate — Preliminary API Contract Draft (`/api/v1`)

> **IMPORTANT IMPLEMENTATION NOTICE:**  
> Only **`GET /api/v1/health`** is implemented in Phase 1. Every other endpoint in this document is a **design-only specification for Phases 2–4** and is **not yet implemented**.

---

## 1. Implemented in Phase 1

### `GET /api/v1/health`
- **Role:** Public (`Anonymous`)
- **Purpose:** Liveness and basic database connectivity check for local development, Docker healthchecks, and deployment readiness.
- **Output (`200 OK`):**
  ```json
  {
    "status": "ok",
    "service": "fixmate-backend",
    "version": "0.1.0",
    "timestamp": "2026-10-29T12:00:00.000Z",
    "database": {
      "status": "connected"
    }
  }
  ```

---

## 2. Planned Future Endpoints (Not Yet Implemented)

### 2.1 Authentication & Current User (`Phase 2 — NOT YET IMPLEMENTED`)

| Method | Path | Role | Input Sketch | Output Sketch | Key Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | `{ fullName, email, password, phone, role: 'CUSTOMER' \| 'PROVIDER' }` | `{ user: PublicUserDto, accessToken }` | `400` invalid DTO, `409` email exists |
| `POST` | `/api/v1/auth/login` | Public (Throttled) | `{ email, password }` | `{ user: PublicUserDto, accessToken, refreshToken }` | `401` invalid credentials, `403` suspended, `429` rate limit |
| `POST` | `/api/v1/auth/refresh` | Authenticated | `{ refreshToken }` | `{ accessToken, refreshToken }` | `401` expired/invalid token |
| `POST` | `/api/v1/auth/logout` | Authenticated | `{}` | `{ success: true }` | `401` unauthorized |
| `GET` | `/api/v1/users/me` | Authenticated | — | `{ id, fullName, email, phone, role, status }` | `401` unauthorized |

### 2.2 Customer Addresses (`Phase 2 — NOT YET IMPLEMENTED`)

| Method | Path | Role | Input Sketch | Output Sketch | Key Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me/addresses` | `CUSTOMER` | — | `{ items: AddressDto[] }` | `401`, `403` |
| `POST` | `/api/v1/users/me/addresses` | `CUSTOMER` | `{ label?, governorate, cityOrDistrict, street, building, floorOrApartment?, landmark?, contactPhone, isDefault? }` | `AddressDto` (`201 Created`) | `400` validation error |
| `PATCH` | `/api/v1/users/me/addresses/:id` | `CUSTOMER` (Owner) | Partial address fields | `AddressDto` | `403` not owner, `404` not found |
| `DELETE` | `/api/v1/users/me/addresses/:id` | `CUSTOMER` (Owner) | — | `{ deactivated: true }` | `403` not owner, `404` not found |

### 2.3 Public Catalog & Provider Discovery (`Phase 2 — NOT YET IMPLEMENTED`)

| Method | Path | Role | Input Sketch | Output Sketch | Key Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Public | `?lang=ar\|en` | `{ items: CategorySummaryDto[] }` (active only) | — |
| `GET` | `/api/v1/services` | Public | `?categorySlug=...&page=1&limit=20` | Paginated `ServiceSummaryDto[]` (active only, prices in `fils`) | `400` invalid query |
| `GET` | `/api/v1/providers` | Public | `?serviceSlug=...&governorate=...&page=1&limit=20` | Paginated `PublicProviderSummaryDto[]` (`APPROVED` & `ACTIVE` only) | `400` invalid query |
| `GET` | `/api/v1/providers/:id` | Public | — | `PublicProviderDetailDto` (bio, services in `fils`, areas, rating summary, public reviews) | `404` if not found or not `APPROVED` |

### 2.4 Provider Self-Service Onboarding & Offerings (`Phase 2 — NOT YET IMPLEMENTED`)

| Method | Path | Role | Input Sketch | Output Sketch | Key Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/provider-profile/me` | `PROVIDER` | — | `PrivateProviderProfileDto` (includes `approvalStatus`, admin feedback) | `401`, `403` |
| `PUT` | `/api/v1/provider-profile/me` | `PROVIDER` | `{ bioAr, bioEn, yearsOfExperience, coverageGovernorates, coverageAreas, availabilityWindows }` | `PrivateProviderProfileDto` | `400` validation error |
| `POST` | `/api/v1/provider-profile/me/submit` | `PROVIDER` | `{}` | `{ approvalStatus: 'PENDING_REVIEW', submittedAt }` | `400` incomplete profile, `409` already approved/suspended |
| `PUT` | `/api/v1/provider-profile/me/services` | `PROVIDER` | `{ serviceId, pricingType, priceAmountFils, estimatedDurationMinutes, isEnabled }` | `ProviderServiceDto` | `400` non-integer fils, `404` service inactive |

### 2.5 Bookings & Lifecycle Transitions (`Phase 3 — NOT YET IMPLEMENTED`)

| Method | Path | Role | Input Sketch | Output Sketch | Key Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/bookings` | `CUSTOMER` | `{ providerProfileId, serviceId, addressId, requestedStartUtc, requestedEndUtc, customerNotes? }` | `BookingDetailDto` (`status: 'REQUESTED'`) | `400` invalid window/30m slot, `404` provider/service unavailable |
| `GET` | `/api/v1/bookings` | `CUSTOMER`, `PROVIDER` | `?status=...&page=1&limit=20` | Paginated `BookingSummaryDto[]` scoped to current actor | `401`, `403` |
| `GET` | `/api/v1/bookings/:id` | `CUSTOMER` (Owner), `PROVIDER` (Assigned), `ADMIN` | — | `BookingDetailDto` + `events: BookingEventDto[]` | `403` not owner/assigned, `404` |
| `POST` | `/api/v1/bookings/:id/accept` | `PROVIDER` (Assigned) | `{ providerNotes? }` | `BookingDetailDto` (`status: 'ACCEPTED'`) | `400` expired/wrong state, `409` `provider_slots` conflict |
| `POST` | `/api/v1/bookings/:id/reject` | `PROVIDER` (Assigned) | `{ reason }` | `BookingDetailDto` (`status: 'REJECTED'`) | `400` invalid transition, `403` |
| `POST` | `/api/v1/bookings/:id/start` | `PROVIDER` (Assigned) | `{}` | `BookingDetailDto` (`status: 'IN_PROGRESS'`) | `400` not in `ACCEPTED`, `403` |
| `POST` | `/api/v1/bookings/:id/work-done` | `PROVIDER` (Assigned) | `{ agreedAmountFils?, completionNotes? }` | `BookingDetailDto` (`status: 'WORK_DONE'`) | `400` not in `IN_PROGRESS`, `403` |
| `POST` | `/api/v1/bookings/:id/complete` | `CUSTOMER` (Owner) | `{}` | `BookingDetailDto` (`status: 'COMPLETED'`) | `400` not in `WORK_DONE`, `403` |
| `POST` | `/api/v1/bookings/:id/cancel` | `CUSTOMER` (Owner), `PROVIDER` (Assigned), `ADMIN` | `{ reason }` | `BookingDetailDto` (`status: 'CANCELLED'`) | `400` already in progress/completed (unless Admin), `403` |

### 2.6 Reviews (`Phase 3 — NOT YET IMPLEMENTED`)

| Method | Path | Role | Input Sketch | Output Sketch | Key Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/bookings/:id/review` | `CUSTOMER` (Owner) | `{ rating: 1..5, comment? }` | `ReviewDto` (`201 Created`) | `400` booking not `COMPLETED`, `403` not owner, `409` review already exists |
| `GET` | `/api/v1/providers/:id/reviews` | Public | `?page=1&limit=20` | Paginated `PublicReviewDto[]` (`VISIBLE` only) | `404` provider not found |

### 2.7 Admin Operations (`Phase 2–3 — NOT YET IMPLEMENTED`)

| Method | Path | Role | Input Sketch | Output Sketch | Key Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PATCH` | `/api/v1/admin/providers/:id/approval` | `ADMIN` | `{ status: 'APPROVED' \| 'REJECTED' \| 'SUSPENDED', reason? }` | `AdminProviderProfileDto` | `400` invalid transition, `403`, `404` |
| `POST` | `/api/v1/admin/categories` | `ADMIN` | `{ slug, nameAr, nameEn, descriptionAr?, descriptionEn?, displayOrder }` | `CategoryDto` | `409` duplicate slug |
| `POST` | `/api/v1/admin/services` | `ADMIN` | `{ categoryId, slug, titleAr, titleEn, pricingType, indicativePriceFils }` | `ServiceDto` | `409` duplicate slug |
| `PATCH` | `/api/v1/admin/reviews/:id/moderation` | `ADMIN` | `{ moderationStatus: 'VISIBLE' \| 'HIDDEN', moderationReason }` | `AdminReviewDto` | `404` review not found |
