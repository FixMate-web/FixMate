# FixMate — Product Requirements Document (PRD)

> **Document Status:** Phase 1 Specification (Authoritative V1 Baseline)  
> **Implementation Status:** In Phase 1, business workflows described below are **specification-only** unless explicitly noted under Phase 1 Foundation deliverables (application shells, design system, health endpoint, and Mongoose schemas).

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Homeowners and tenants in Jordan frequently struggle to find reliable, qualified home-maintenance technicians. Existing discovery channels rely on informal word-of-mouth or unmoderated classified listings where provider qualifications are opaque, service coverage and availability are unclear, pricing expectations are inconsistent, and customers have no structured record of booking status or verified post-job reviews. Conversely, skilled independent technicians lack a trusted digital storefront to showcase their expertise, define their operating areas, and manage service requests systematically.

### 1.2 Target Audience
- **Customers (Homeowners, Tenants, Small Office Managers):** Residents in Jordan (initially Greater Amman and major governorates) seeking dependable, transparent home maintenance with clear scheduling and bilingual (Arabic/English) support.
- **Service Providers (Independent Technicians & Small Maintenance Teams):** Qualified professionals in plumbing, electrical repair, HVAC/AC servicing, cleaning, painting, and carpentry who want structured lead generation and schedule management.
- **Platform Administrators (FixMate Operations & Trust Team):** Internal staff responsible for vetting provider applications, curating the service catalog, monitoring marketplace health, and moderating reviews.

### 1.3 Value Proposition
**FixMate** is a bilingual (Arabic RTL / English LTR) curated marketplace that connects customers directly with admin-approved home-maintenance providers. By enforcing structured booking lifecycles, transparent indicative pricing in Jordanian Dinars (JOD), verified completion-gated reviews, and explicit capacity protection, FixMate builds bilateral trust without requiring complex online payment gateways or invasive live-GPS tracking in V1.

### 1.4 Initial Service Taxonomy (V1)
1. **Plumbing (`plumbing`):** Leak repair, pipe fitting, water heater maintenance, fixture installation, drain unblocking.
2. **Electrical Repairs (`electrical-repairs`):** Circuit troubleshooting, socket/switch replacement, lighting installation, distribution board inspection.
3. **AC Maintenance (`ac-maintenance`):** Split/central AC cleaning, refrigerant check, filter replacement, seasonal servicing.
4. **Cleaning (`cleaning`):** Deep residential cleaning, post-maintenance cleanup, kitchen/bathroom sanitization, water tank cleaning.
5. **Painting (`painting`):** Interior wall painting, touch-ups, damp-proof coating, decorative finishes.
6. **Carpentry (`carpentry`):** Door/lock alignment, cabinet repair, custom shelving, wooden furniture assembly.

---

## 2. Roles, Responsibilities & Permission Boundaries

| Role | Core Responsibilities | Permission Boundaries |
| :--- | :--- | :--- |
| **Anonymous Visitor** | Browse active service categories, services, and public profiles of `APPROVED` providers; switch UI language (`ar`/`en`). | Read-only access to public projections. Cannot view customer data, provider private documents, or submit bookings. |
| **Customer (`CUSTOMER`)** | Manage own profile and manual Jordanian addresses; browse services/providers; create bookings with `APPROVED` providers; view own booking history; cancel own bookings when permitted; mark `WORK_DONE` bookings as `COMPLETED`; submit one review per completed booking. | Cannot access other customers' bookings or addresses. Cannot accept/reject bookings or alter booking statuses reserved for providers/admins. |
| **Provider (`PROVIDER`)** | Create and update professional profile; submit application for admin approval; configure offered services, indicative prices, service areas, and availability windows; accept or reject `REQUESTED` bookings assigned to them; advance assigned bookings through `IN_PROGRESS` and `WORK_DONE`; cancel accepted bookings only under strict policy. | Cannot appear in public search or accept bookings unless `approvalStatus === 'APPROVED'` and account status is `ACTIVE`. Cannot modify catalog categories or moderate reviews. |
| **Admin (`ADMIN`)** | Review, approve, reject, or suspend provider profiles; manage user account statuses; create/update/deactivate categories and services; inspect bookings and event logs; moderate reviews; audit platform activity. | Full administrative oversight via explicit admin endpoints. Cannot impersonate users silently; all administrative state changes record an actor ID in audit/event logs. |

---

## 3. V1 Scope Boundaries

### 3.1 In-Scope for V1 (Across Phases 1–4)
- Bilingual UI (Arabic RTL default-ready and English LTR) using CSS logical properties and runtime language switching.
- Role-based authentication (`CUSTOMER`, `PROVIDER`, `ADMIN`) with JWT access/refresh tokens and bcrypt password hashing (Phase 2).
- Admin-curated service categories and services with localized names/descriptions and indicative pricing policies in JOD minor units (`fils`, `1 JOD = 1000 fils`).
- Provider onboarding workflow with explicit `PENDING_REVIEW` → `APPROVED` / `REJECTED` / `SUSPENDED` lifecycle.
- Manual Jordanian address management (Governorate, City/District, Street, Building, Floor/Apartment, Landmark, Contact Phone).
- Direct customer-selects-provider booking workflow (`REQUESTED` → `ACCEPTED` → `IN_PROGRESS` → `WORK_DONE` → `COMPLETED`, plus `REJECTED`, `CANCELLED`, `EXPIRED`).
- Conflict-free provider capacity reservation using discrete time slots (`provider_slots`) upon booking acceptance.
- One customer review (1–5 stars + optional comment) per `COMPLETED` booking, with admin moderation capability.
- In-app notifications, background job processing (BullMQ/Redis), and realtime status updates (Socket.IO) in advanced phases.

### 3.2 Explicitly Out-of-Scope for V1
- **No Online Payment Processing:** V1 does not integrate Stripe, CliQ, eFAWATEERcom, credit card processors, or digital wallets. Settlement occurs offline directly between customer and provider based on the agreed quote/inspection.
- **No GPS / Mapping Integrations:** No Google Maps, Mapbox, or live technician geolocation tracking. Addresses and service coverage areas use structured manual text and canonical Jordanian area identifiers.
- **No SMS / WhatsApp Gateways:** No Twilio or third-party SMS OTP gateways in V1.
- **No Open Bidding / Reverse Auctions:** Customers select a specific approved provider when requesting a booking; requests are not broadcast as open auctions to all providers.
- **No Automated Dispute Escrow:** V1 provides structured booking event logs and admin intervention (`CANCELLED` / notes), not automated financial chargebacks.

---

## 4. End-to-End User Journeys (V1 Specification)

1. **Anonymous Browsing & Service Discovery:**
   - Visitor lands on FixMate home page in Arabic or English, browses the 6 core categories, selects a specific service (e.g., Split AC Maintenance), filters by Amman district, and views public cards of `APPROVED` providers offering that service along with their indicative pricing and verified rating summary.
2. **Customer Registration & Login (Design Only in Phase 1):**
   - Visitor registers as a `CUSTOMER` with name, email, password, and phone number, then logs in to access booking creation and saved addresses.
3. **Provider Onboarding & Admin Approval (Design Only in Phase 1):**
   - Technician registers as a `PROVIDER`, completes their `provider_profiles` record (bio, years of experience, coverage areas, selected services with custom starting/fixed rates), and submits for review (`PENDING_REVIEW`).
   - Admin inspects the profile, verifies completeness against FixMate criteria, and transitions the profile to `APPROVED` (recording `approvedBy`, `approvedAt`). Only then does the provider become publicly visible and bookable.
4. **Booking Request → Acceptance / Rejection:**
   - Customer selects an approved provider and service, chooses a saved or newly entered manual address, selects a preferred date/time window (displayed in `Asia/Amman`, converted to UTC), adds problem notes, and submits.
   - Booking starts in `REQUESTED` state. Capacity is **not** locked yet.
   - Provider reviews the request. If accepted, the backend atomically verifies and reserves the required `provider_slots` for that window and transitions the booking to `ACCEPTED`. If declined, the booking transitions to `REJECTED` with a reason.
5. **Execution → Work Done → Customer Confirmation → Review:**
   - When the technician begins work on-site, the provider transitions `ACCEPTED` → `IN_PROGRESS`.
   - Upon finishing the task, the provider records the final agreed amount (if applicable) and transitions `IN_PROGRESS` → `WORK_DONE`.
   - Customer inspects the completed work and confirms `WORK_DONE` → `COMPLETED`.
   - Once `COMPLETED`, the customer is eligible to submit a single review (`1–5` stars) linked uniquely to that `bookingId`.
6. **Cancellation & Expiration Flows:**
   - Customer may cancel a `REQUESTED` or `ACCEPTED` booking prior to work starting (`IN_PROGRESS`).
   - Provider may cancel an `ACCEPTED` booking prior to `IN_PROGRESS` with a mandatory cancellation reason (releasing reserved `provider_slots`).
   - If a `REQUESTED` booking passes its scheduled start time (or response SLA) without provider acceptance, it transitions to `EXPIRED`.
7. **Admin Oversight:**
   - Admin monitors bookings, suspends non-compliant providers, deactivates obsolete catalog items without breaking historical booking snapshots, and hides abusive reviews (`HIDDEN`).

---

## 5. Testable User Stories

| ID | Actor | Preconditions | Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `US-01` | Visitor | Categories and services exist with `isActive: true`. | Requests public catalog list in Arabic or English. | Receives active categories and services with localized titles and pricing policy metadata. |
| `US-02` | Visitor | Providers exist in `PENDING_REVIEW`, `APPROVED`, and `SUSPENDED` states. | Searches providers for a service and area. | Receives **only** `APPROVED` providers whose user account is `ACTIVE` and whose `provider_services` entry is enabled; no private contact/verification fields are exposed. |
| `US-03` | Visitor | Using any page in the web client. | Toggles language switcher between Arabic and English. | Document root `lang` (`ar`/`en`) and `dir` (`rtl`/`ltr`) update immediately; layout mirrors logically via CSS logical properties. |
| `US-04` | Customer | Authenticated `CUSTOMER` with `ACTIVE` account. | Creates a manual Jordanian address (Governorate, District, Street, Building). | Address is validated and persisted in `addresses` owned by `customerId`. |
| `US-05` | Customer | Authenticated `CUSTOMER`; target provider is `APPROVED` and offers active service. | Submits booking request for a future time window with a valid address. | Booking is created in `REQUESTED` state with immutable snapshots of address, service title, and indicative price in `fils`; `booking_events` entry is recorded. |
| `US-06` | Customer | Authenticated `CUSTOMER` owns a booking in `REQUESTED` or `ACCEPTED` state. | Cancels the booking with an optional reason. | Booking transitions to `CANCELLED`; if previously `ACCEPTED`, reserved `provider_slots` are released atomically. |
| `US-07` | Customer | Authenticated `CUSTOMER` owns a booking in `WORK_DONE` state. | Confirms job completion. | Booking transitions to `COMPLETED`; `completedAt` UTC timestamp and `booking_events` audit entry are persisted. |
| `US-08` | Customer | Authenticated `CUSTOMER` owns a `COMPLETED` booking with no existing review. | Submits a 1–5 star rating and text comment. | Review is saved in `reviews` with unique `bookingId`; duplicate review attempts on the same booking are rejected with `409 Conflict`. |
| `US-09` | Provider | Authenticated `PROVIDER` with `DRAFT` or `REJECTED` profile. | Updates bio, experience, coverage areas, and submits profile for approval. | Profile status transitions to `PENDING_REVIEW` and awaits admin decision. |
| `US-10` | Provider | Authenticated `PROVIDER` with `APPROVED` profile. | Configures supported services and pricing in `fils` (starting price or fixed fee). | `provider_services` records are created/updated; negative or non-integer currency amounts are rejected. |
| `US-11` | Provider | Authenticated `PROVIDER` assigned to a `REQUESTED` booking; target time slots are free. | Accepts the booking request. | System atomically locks discrete `provider_slots` for the booking window and transitions booking to `ACCEPTED`. |
| `US-12` | Provider | Authenticated `PROVIDER` has two `REQUESTED` bookings for overlapping time slots. | Accepts the first booking, then attempts to accept the second overlapping booking. | First acceptance succeeds; second acceptance fails with `409 Conflict` because `provider_slots` are already reserved. |
| `US-13` | Provider | Authenticated `PROVIDER` assigned to an `ACCEPTED` booking. | Marks job as `IN_PROGRESS` and subsequently `WORK_DONE`. | Status advances sequentially (`ACCEPTED` → `IN_PROGRESS` → `WORK_DONE`); skipping `IN_PROGRESS` is rejected with `400/422`. |
| `US-14` | Admin | Authenticated `ADMIN` viewing a `PENDING_REVIEW` provider profile. | Approves or rejects the provider with verification notes. | `approvalStatus` updates to `APPROVED` or `REJECTED` with `reviewedBy` and `reviewedAt` metadata. |
| `US-15` | Admin | Authenticated `ADMIN` viewing an active service referenced by existing bookings. | Deactivates the service (`isActive: false`) instead of deleting it. | Service no longer appears in new booking flows, while historical bookings retain their reference and embedded snapshot data intact. |
| `US-16` | Admin | Authenticated `ADMIN` reviewing a reported review. | Changes review `moderationStatus` to `HIDDEN` with a moderation reason. | Review is excluded from public provider profile views and rating aggregations. |

---

## 6. Concrete Business Rules

- **`BR-01` (Provider Approval Gate):** A provider profile must have `approvalStatus === 'APPROVED'` and an `ACTIVE` user account before appearing in public search results or receiving/accepting booking requests.
- **`BR-02` (Strict Resource Ownership):** A `CUSTOMER` may only view or mutate their own addresses and bookings (`booking.customerId === currentUser.id`). A `PROVIDER` may only view or mutate bookings explicitly assigned to their `providerProfileId`. Role checks (`RolesGuard`) never substitute for ownership verification.
- **`BR-03` (Server-Enforced State Machine):** Booking status transitions must follow the canonical transition matrix in `BOOKING_LIFECYCLE.md`. Any client request attempting an unlisted transition or acted upon by an unauthorized role is rejected server-side.
- **`BR-04` (No Double-Reservation of Pending Requests):** Bookings in `REQUESTED` status do **not** lock provider capacity. Multiple customers may request overlapping windows; capacity is locked exclusively when a booking transitions to `ACCEPTED`.
- **`BR-05` (Atomic Conflict-Free Acceptance):** A provider cannot have two `ACCEPTED` or `IN_PROGRESS` bookings with overlapping time slots. Slot reservation (`provider_slots`) must be enforced atomically at the database level via a unique index on `{ providerProfileId, slotStartUtc }`.
- **`BR-06` (Immutable Booking Snapshots):** When a booking is created, the customer's selected address fields, the localized service title, and the provider's pricing snapshot are copied into the `bookings` document. Subsequent edits to the customer's `addresses` book or the provider's `provider_services` catalog must never mutate historical bookings.
- **`BR-07` (Integer Minor Currency Units):** All monetary values across schemas, DTOs, and calculations are stored and transmitted as non-negative integers in **JOD minor units (`fils`)**, where `1 JOD = 1000 fils` (e.g., `15.500 JOD` is stored as `15500`). Floating-point monetary storage is strictly forbidden.
- **`BR-08` (UTC Storage & Amman Presentation):** All timestamps (`requestedStartUtc`, `requestedEndUtc`, `createdAt`, etc.) are validated and persisted in UTC (`ISO-8601`). User-facing scheduling interfaces convert and display times in the `Asia/Amman` timezone.
- **`BR-09` (Future-Only Booking Requests):** A booking request must specify a `requestedStartUtc` strictly in the future (at least 60 minutes ahead of request creation time by default) and `requestedEndUtc > requestedStartUtc` aligned to 30-minute slot boundaries.
- **`BR-10` (Cancellation Boundaries):** Neither customer nor provider may self-cancel a booking once it has entered `IN_PROGRESS`, `WORK_DONE`, or `COMPLETED`. Post-start termination requires `ADMIN` intervention with an explicit audit reason.
- **`BR-11` (Completion-Gated Single Review):** A review may only be created by the `customerId` of a booking whose status is `COMPLETED`. Exactly one review is permitted per booking (`unique` index on `bookingId`), with an integer rating between `1` and `5`.
- **`BR-12` (Soft Deactivation over Hard Deletion):** Categories, services, users, and provider profiles referenced by historical bookings must be deactivated (`isActive: false` or `status: 'SUSPENDED'`) rather than hard-deleted from MongoDB.
- **`BR-13` (Public Privacy Boundary):** Public API endpoints must never return customer residential addresses, customer phone numbers, user password hashes, or internal admin verification notes.

---

## 7. Edge Cases & System Handling

1. **Concurrent Acceptance Race Condition:** Two requests (`Booking A` and `Booking B`) overlap on Tuesday 10:00–11:00 UTC. If the provider clicks "Accept" on both nearly simultaneously, both transactions attempt to insert/claim `{ providerProfileId, slotStartUtc }` records in `provider_slots`. MongoDB's unique compound index guarantees at most one succeeds; the second fails with duplicate key (`E11000`), which NestJS maps to `409 Conflict`.
2. **Double-Click Submit on Booking Creation:** Frontend disables submit controls while a request is in flight. Backend validates idempotency/duplicate pending request checks (same `customerId`, `providerProfileId`, `serviceId`, and `requestedStartUtc` within an active `REQUESTED` booking) to prevent accidental duplicate requests.
3. **Provider Suspended While Pending or Accepted Bookings Exist:**
   - When an admin suspends a provider (`approvalStatus: 'SUSPENDED'`), the provider is immediately hidden from public discovery and blocked from accepting any `REQUESTED` bookings.
   - Existing `REQUESTED` bookings cannot be accepted by the suspended provider; admin or system workflow can bulk-transition pending requests to `CANCELLED` (reason: `PROVIDER_SUSPENDED`).
4. **Booking Expired Before Acceptance:** If `nowUtc >= requestedStartUtc` while a booking is still `REQUESTED`, a provider's attempt to accept it is rejected by precondition check (`requestedStartUtc > nowUtc`), and the booking transitions to `EXPIRED` (either lazily on read/mutation or via scheduled job in later phases).
5. **Timezone Changes / DST Alignment:** Because Jordan (`Asia/Amman`) currently observes permanent UTC+03:00 (and historical DST rules are handled by standard IANA `Intl.DateTimeFormat` timezone databases), persisting all instants in UTC avoids ambiguity.
6. **Zero Approved Providers in a Category/Area:** Public UI renders an accessible empty-state component explaining that no approved providers are currently available in the selected filter and invites the user to clear filters or explore other categories — never fabricating placeholder providers.
7. **Customer Edits or Deletes Saved Address After Booking:** Because `bookings.addressSnapshot` embeds a full copy of the address at booking creation (`BR-06`), editing or deactivating the record in `addresses` has zero effect on existing bookings.
8. **Invalid Status Transitions:** Attempting `REQUESTED` → `COMPLETED` or `REJECTED` → `ACCEPTED` fails immediately in the domain state machine helper and returns `400 Bad Request` / `422 Unprocessable Entity` without modifying the database.
9. **Disabled Service (`isActive: false`):** New booking requests referencing an inactive service or disabled `provider_services` link are rejected, while existing `ACCEPTED` or `IN_PROGRESS` bookings for that service can proceed to completion using their embedded service snapshot.

---

## 8. Explicit Assumptions & Nonblocking Defaults

| Topic | Assumed Default for V1 | Rationale & Impact |
| :--- | :--- | :--- |
| **Slot Granularity** | `30 minutes` (`1800 seconds`), aligned to `:00` and `:30` UTC boundaries. | Balances scheduling flexibility with a compact number of atomic slot documents per booking (e.g., a 2-hour booking locks 4 slots). |
| **Default Booking Duration** | Minimum `60 minutes` (2 slots), maximum `480 minutes` (16 slots / 8 hours) per single booking request. | Prevents unbounded slot creation while covering standard residential maintenance visits. |
| **Work Done Confirmation Window** | Customer explicitly confirms `WORK_DONE` → `COMPLETED`. Auto-completion after 72 hours is documented for future cron phase. | Keeps V1 state transitions deterministic and explicit before `@nestjs/schedule` jobs are added. |
| **Dispute Handling on `WORK_DONE`** | If a customer disputes `WORK_DONE`, an `ADMIN` can inspect `booking_events` and transition `WORK_DONE` → `CANCELLED` (with admin audit metadata) or mediate offline. | Avoids building a complex financial arbitration engine in V1 when no online payments exist. |
