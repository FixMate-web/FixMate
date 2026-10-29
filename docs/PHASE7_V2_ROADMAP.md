# FixMate — Phase 7 V2 Post-Launch Evolution Roadmap (Checkpoint C8)

**Timestamp:** 2026-10-29T18:41:00+03:00  
**Scope:** Part 23 — Architectural Roadmap for Post-V1 Marketplace Evolution

---

## 1. V1 Foundation vs V2 Evolution

FixMate V1 delivers a complete, verified, bilingual (`ar`/`en`) home-maintenance marketplace for Jordan with:
- Real JWT + rotated `httpOnly` refresh session authentication
- Bilingual service catalog (`JOD` integer `fils`)
- Provider onboarding, 30-minute availability windows, and admin approval workflow
- End-to-end appointment booking engine with immutable snapshots, atomic 30-minute `provider_slots` capacity locking, and full 8-state lifecycle
- Project requests (`OPEN`, `RESPONDED`, `DECLINED`, `CANCELLED`)
- Verified post-completion reviews & automatic provider rating aggregation
- Persistent bilingual in-app notifications and Admin Operational Dashboard

---

## 2. Prioritized V2 Epics

### Epic 1 — Online Payments & Escrow in JOD (`CliQ` / Local Payment Gateways)
- **Current V1 State:** Offline cash/CliQ settlement on site based on immutable `pricingSnapshot.quotedAmountFils` / `agreedAmountFils`.
- **V2 Architecture:** Introduce a `PaymentIntent` collection storing integer `fils`, webhook signature verification, and escrow release upon `WORK_DONE -> COMPLETED`.

### Epic 2 — Provider Identity & Trade License Document Verification (S3 / Cloud Object Storage)
- **Current V1 State:** Admin approval (`ProviderApprovalStatus.APPROVED`) moderates marketplace listing readiness with clear UI disclaimers that approval is not government licensing.
- **V2 Architecture:** Integrate pre-signed S3/R2 uploads for vocational licenses and national ID verification documents with encrypted storage and expiration alerts.

### Epic 3 — Real-Time Customer ↔ Provider In-Booking Chat & Photo Attachments
- **Current V1 State:** Structured `customerNotes`, `providerNotes`, and `ProjectRequests` descriptions/responses.
- **V2 Architecture:** Scoped Socket.IO rooms per `bookingId` (`booking:<id>`) allowing customers to share issue photos and providers to share before/after completion photos.

### Epic 4 — Geospatial Address Pinning & Provider Route Optimization
- **Current V1 State:** Structured Jordan governorate + district/area + street/building/landmark snapshots.
- **V2 Architecture:** Optional GeoJSON `Point` coordinates (`2dsphere` index) on `addresses` to calculate travel buffers between consecutive 30-minute `provider_slots`.
