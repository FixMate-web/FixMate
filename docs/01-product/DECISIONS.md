# FixMate — Architecture Decision Records (ADRs)

> **Document Status:** Phase 1 Authoritative Decision Log

---

## ADR-01: Core Stack — Angular v22 + NestJS + MongoDB/Mongoose
- **Status:** Final
- **Context:** FixMate requires a strongly typed, maintainable full-stack web architecture that aligns strictly with the approved course technology inventory (`full_stack_course_technologies.md`).
- **Decision:** Use **Angular v22** (standalone components, Signals, SCSS, Reactive Forms, Angular Router, HttpClient) for the frontend, **NestJS** (Express adapter, TypeScript, `class-validator`, `class-transformer`, `@nestjs/config`, `helmet`) for the backend REST API, and **MongoDB with Mongoose** (`@nestjs/mongoose`) for persistence.
- **Rationale:** Provides end-to-end TypeScript type safety, structured dependency injection on both client and server, built-in validation pipelines, and flexible document modeling for localized catalogs and immutable booking snapshots.
- **Consequences:** All contributors and automated phases must work within Angular v22 + NestJS + Mongoose conventions; unapproved frameworks are rejected.
- **Alternatives Considered:** React/Next.js, Vue, Express without NestJS, PostgreSQL/Prisma — rejected due to binding course technology constraints.

---

## ADR-02: Modular Monolith vs. Microservices
- **Status:** Final
- **Context:** The platform encompasses catalog browsing, provider onboarding, booking state management, slot locking, and reviews. We must choose between deploying multiple microservices or a single modular NestJS codebase.
- **Decision:** Build FixMate as a **Modular Monolith** (`backend/src/*` organized by domain module) backed by a single MongoDB database.
- **Rationale:** Booking acceptance requires atomic coordination across `bookings`, `provider_slots`, and `booking_events`. A modular monolith enforces clean logical boundaries via NestJS modules while avoiding distributed transactions, network serialization overhead, and multi-service operational complexity.
- **Consequences:** Modules must communicate via explicit exported NestJS services and domain contracts rather than bypassing module boundaries.
- **Alternatives Considered:** Separate Auth, Catalog, and Booking microservices — rejected as premature complexity and forbidden by the project brief.

---

## ADR-03: Customer-Selects-Provider Direct Booking Flow
- **Status:** Final
- **Context:** Home-maintenance marketplaces can operate via open broadcast auctions (customer posts a job, many providers bid) or direct selection (customer browses approved providers and requests a specific provider).
- **Decision:** Use a **direct customer-selects-provider workflow**: the customer selects a specific `APPROVED` provider and service, submits a `REQUESTED` booking, and that specific provider accepts or rejects it.
- **Rationale:** Keeps ownership, pricing expectations, and state transitions (`REQUESTED` → `ACCEPTED` → `IN_PROGRESS` → `WORK_DONE` → `COMPLETED`) deterministic and auditable in V1.
- **Consequences:** Every booking document has a required `providerProfileId` from creation time.
- **Alternatives Considered:** Open bidding marketplace or automated algorithmic dispatch — rejected as out of V1 scope.

---

## ADR-04: Bilingual Arabic (RTL) & English (LTR) Architecture
- **Status:** Final
- **Context:** FixMate targets Jordan, where users expect seamless switching between Arabic (`ar`, right-to-left) and English (`en`, left-to-right).
- **Decision:** Implement runtime language and direction switching using an Angular Signal-backed `LanguageService` that updates `<html lang="..." dir="...">` (`rtl` for `ar`, `ltr` for `en`), paired with **CSS Logical Properties** (`margin-inline-start`, `padding-inline`, `inset-inline-start`, `border-inline-start`) across all SCSS stylesheets and localized `{ ar, en }` text subdocuments in MongoDB catalog schemas.
- **Rationale:** Allows instant runtime switching without full page reloads or separate builds during development while keeping layout geometry direction-agnostic.
- **Consequences:** Physical directional CSS properties (`margin-left`, `padding-right`, `left`, `right`, `text-align: left`) are avoided in layout components in favor of logical equivalents.
- **Alternatives Considered:** Separate compile-time-only bundles without runtime switcher — less ergonomic for interactive evaluation and testing.

---

## ADR-05: Jordan Timezone (`Asia/Amman`), UTC Persistence, and JOD Minor Units (`fils`)
- **Status:** Final (Market Default)
- **Context:** Scheduling and pricing bugs commonly arise from mixing local timezone strings in databases or using IEEE-754 floating-point numbers for currency. Furthermore, the Jordanian Dinar (`JOD`) is subdivided into **1000 fils** (3 decimal places), unlike 100-cent currencies.
- **Decision:**
  1. Persist all timestamps in MongoDB and transmit API timestamps as **UTC ISO-8601** instants.
  2. Format user-facing dates and scheduling slots in the **`Asia/Amman`** timezone (`UTC+03:00`).
  3. Store and transmit all monetary amounts as **non-negative integers in JOD minor units (`fils`)**, where `1 JOD = 1000 fils`.
- **Rationale:** Eliminates floating-point rounding errors and timezone ambiguity.
- **Consequences:** Schema validators enforce `Number.isInteger` and `min: 0` on all `*Fils` fields; UI formatters divide by `1000` for display only.
- **Alternatives Considered:** Floating-point JOD numbers (`15.5`) or storing local wall-clock strings — rejected due to precision and timezone bugs.

---

## ADR-06: Manual Jordanian Addresses Without GPS or Mapping Integrations
- **Status:** Final
- **Context:** Customers need to provide service locations in Jordan, where street addressing often relies on district names, building numbers, and nearby landmarks.
- **Decision:** Represent customer addresses as structured manual fields (`governorate`, `cityOrDistrict`, `street`, `building`, `floorOrApartment`, `landmark`, `contactPhone`) and embed an immutable `addressSnapshot` into each booking at creation time. Do **not** integrate Google Maps, Mapbox, or browser geolocation APIs.
- **Rationale:** Respects the approved technology stack, avoids third-party API key requirements, protects customer privacy, and fits local Jordanian addressing habits (where landmarks are essential).
- **Consequences:** Provider coverage filtering uses canonical Jordanian governorate/area slugs rather than geospatial coordinates.
- **Alternatives Considered:** Google Maps Places Autocomplete / PostGIS / MongoDB `2dsphere` coordinates — rejected per V1 commercial boundaries.

---

## ADR-07: Offline Payment Settlement in V1 (No Online Payment Gateway)
- **Status:** Final
- **Context:** Home maintenance often involves on-site inspection before final repair scope is confirmed.
- **Decision:** V1 does **not** process online payments. Services and provider offerings advertise an explicit `PricingType` (`FIXED`, `STARTING_AT`, or `INSPECTION_ONLY`) in `fils`, and bookings record a `pricingSnapshot` (including optional `agreedAmountFils` recorded when work is done) for transparency. Financial settlement occurs directly between customer and provider offline.
- **Rationale:** Avoids PCI compliance scope, third-party payment gateway dependencies (Stripe/CliQ), and escrow complexity in V1.
- **Consequences:** No payment card forms, webhook handlers, or ledger tables are created in V1.
- **Alternatives Considered:** Stripe or local payment gateway integration — explicitly forbidden by product scope.

---

## ADR-08: Pending Requests vs. Atomic Confirmed Capacity Reservations (`provider_slots`)
- **Status:** Final
- **Context:** Multiple customers may request the same provider for overlapping times. However, once a provider accepts a booking, overlapping accepted bookings must be impossible even under concurrent HTTP requests.
- **Decision:**
  1. `REQUESTED` bookings do **not** reserve slots.
  2. Time is discretized into **30-minute UTC slots** (`:00` and `:30`).
  3. When a provider accepts a booking for `[startUtc, endUtc)`, the system inserts one document per 30-minute interval into `provider_slots` guarded by a **unique compound index `{ providerProfileId: 1, slotStartUtc: 1 }`**.
  4. When an `ACCEPTED` booking is cancelled, its `provider_slots` documents are deleted.
- **Rationale:** A naive unique index on `{ providerProfileId, startAt }` cannot detect partial overlaps (e.g., `10:00–12:00` vs `11:00–13:00`). Decomposing into 30-minute atomic slots enforces overlap prevention directly in the MongoDB index engine.
- **Consequences:** Multi-slot booking acceptance should execute inside a MongoDB transaction (requiring a single-node replica set in local Docker or MongoDB Atlas in cloud).
- **Alternatives Considered:** Application-level `find()` check before save without unique slot documents — rejected due to Time-Of-Check-to-Time-Of-Use (TOCTOU) race conditions.

---

## ADR-09: Rendering Strategy — CSR in Phase 1 with Planned Hybrid SSR/SSG Evaluation
- **Status:** Provisional (CSR implemented in Phase 1; SSR/SSG evaluated for public routes in later phases)
- **Context:** FixMate has both public discovery pages (Home, Services, Providers) and authenticated role dashboards (Customer, Provider, Admin).
- **Decision:** Initialize and run the Angular v22 frontend with **Client-Side Rendering (CSR)** in Phase 1 so that runtime language switching, health checks, and shell layouts operate cleanly with zero server-rendering coupling. Document how `@angular/ssr` hybrid rendering can later prerender/SSR public catalog routes (`/`, `/services`, `/providers`) while keeping `/dashboard/**` and `/auth/**` on CSR.
- **Rationale:** Matches Section 0.1 of the implementation brief ("Angular CSR initially; document potential SSG/SSR with `@angular/ssr` for public routes").
- **Consequences:** Browser-specific APIs (`document.documentElement.dir`, `localStorage`) are still wrapped defensively using Angular `DOCUMENT` injection and platform guards so future `@angular/ssr` adoption requires zero refactoring.
- **Alternatives Considered:** Full SSR from day one — adds unnecessary server deployment complexity during Phase 1 shell foundation.

---

## ADR-10: Strict Adherence to Approved Stack & Custom SCSS Design System
- **Status:** Final
- **Context:** Third-party UI kits (Angular Material, PrimeNG, Bootstrap, Tailwind) or state libraries (NgRx) are often added out of habit.
- **Decision:** Use **only** packages from the approved course inventory. Build the FixMate UI design system from scratch using semantic HTML5, modular SCSS tokens, CSS custom properties, and CSS logical properties, and manage client state with **Angular Signals** and **RxJS**.
- **Rationale:** Ensures complete control over RTL/LTR visual parity, accessibility focus rings, bundle size, and compliance with the binding technology constraint.
- **Consequences:** All UI primitives (Button, Input, Select, Textarea, Card, Badge, Spinner, EmptyState, Alert, ConfirmDialog) are implemented as clean, lightweight standalone components in `frontend/src/app/shared/ui/`.
- **Alternatives Considered:** Tailwind CSS, Angular Material, Bootstrap — strictly forbidden.
