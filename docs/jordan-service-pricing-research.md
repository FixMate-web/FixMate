# FixMate — Jordan Home-Service Market Pricing Research (Amman & Governorates)

**Verification Date:** 2026-10-29  
**Currency:** Jordanian Dinar (`JOD`, persisted in FixMate as integer `fils` where `1.000 JOD = 1000 fils`)  
**Primary Geographical Scope:** Amman Metropolitan Area (Abdoun, Sweifieh, Khalda, Dabouq, Rabieh, Tla' Al-Ali, Jabal Amman, Shmeisani) & Major Governorates (Irbid, Zarqa, Balqa)

---

## 1. Published Local Sources Consulted

1. **Keepers Jordan (`https://keepersjo.com/en/pricing`)** — Published hourly housekeeping & home cleaning rates in Amman/Zarqa/Balqa:
   - Single-visit hourly cleaning: **3 hours = 17.000 JOD**, **4 hours = 22.000 JOD**, **5 hours = 25.000 JOD**, **6 hours = 30.000 JOD**, **8 hours = 40.000 JOD**.
   - Monthly recurring packages: 4 visits × 5 hours = **90.000 JOD**.
2. **Homi Home Services (`https://homihs.com/catalog`)** — Published upfront catalog pricing in Amman:
   - Standard apartment cleaning (4–6 hours): **25.000 – 40.000 JOD** (`~5.000 JOD/hour`).
   - Comprehensive apartment deep cleaning: **1.500 JOD / m²** (starts at **45.000 – 90.000 JOD** depending on apartment size; 2-bedroom ~90m² = **135.000 JOD**).
   - Upholstery & carpet cleaning: Sofa cleaning **4.280 JOD / seat**, Carpet cleaning **2.000 JOD / m²**, Mattress cleaning from **10.000 JOD**.
   - Pest control treatment: Starts from **15.000 JOD** per 100m².
3. **Home2Serv (`https://home2serv.com/`) & Amman Technical Maintenance Benchmarks (`Fixit Amman`)** — Multi-trade residential plumbing, electrical, AC, painting, and carpentry rates in Amman:
   - Technical diagnostic / inspection call-out fee: **10.000 – 15.000 JOD** (`INSPECTION_ONLY`).
   - Minor plumbing / electrical labor (leak repair, faucet/valve swap, socket/lighting installation): **12.000 – 25.000 JOD** (labor only; spare parts billed separately upon approval).
   - Electric water heater (`Geyser` / كيزر) descaling, element & thermostat servicing: **20.000 JOD** (`FIXED`).
   - Split AC unit seasonal cleaning & refrigerant check: **15.000 – 25.000 JOD per unit** (`18.000 JOD` standard single split unit deep clean).
   - Residential rooftop/ground water tank cleaning & sanitization (1–2 m³): **25.000 JOD** (`FIXED`).
   - Interior room painting & crack putty preparation: **55.000 – 85.000 JOD per room** (`STARTING_AT 55.000 JOD`, excluding specialty paints); wall dampness & peeling treatment starts at **30.000 JOD**.
   - Carpentry door alignment, cylinder lock replacement, or kitchen cabinet soft-close hinge repair: **15.000 JOD** (`FIXED` / `STARTING_AT`).
4. **EJO Stores (`https://ejostores.com/services`)** — Reviewed as a Jordanian e-commerce & hardware/appliance retail directory; confirms spare parts, lighting fixtures, and consumables are typically purchased separately from technician labor.

---

## 2. Structured Evidence & FixMate Canonical Catalog Alignment Table

| Category | FixMate Service (`slug`) | Pricing Model (`PricingType`) | Canonical Indicative Price (`JOD` / `fils`) | Local Market Range (Amman) | Unit & Duration | Materials Included? | Source / Verification |
|---|---|---|---|---|---|---|---|
| **Cleaning** | `apartment-deep-cleaning` | `STARTING_AT` | **45.000 JOD** (`45000` fils) | 22.000 JOD (4h standard) – 90.000+ JOD (full deep clean) | Per visit (240 min base) | Basic cleaning agents included | Keepers (`keepersjo.com`) & Homi (`homihs.com`) — Verified 2026-10-29 |
| **Cleaning** | `roof-water-tank-sanitization` | `FIXED` | **25.000 JOD** (`25000` fils) | 20.000 – 30.000 JOD per tank | Per tank (120 min) | Safe sanitization solution included | Amman Maintenance Benchmark — Verified 2026-10-29 |
| **Plumbing** | `water-leak-detection-repair` | `STARTING_AT` | **15.000 JOD** (`15000` fils) | 15.000 – 30.000 JOD | Per visit (60 min) | Labor only; pipes/valves extra | Home2Serv (`home2serv.com`) — Verified 2026-10-29 |
| **Plumbing** | `electric-water-heater-maintenance` | `FIXED` | **20.000 JOD** (`20000` fils) | 18.000 – 25.000 JOD | Per unit (90 min) | Descaling labor; replacement element extra | Home2Serv / Amman Plumbing Benchmark — Verified 2026-10-29 |
| **Electrical** | `circuit-breaker-panel-inspection` | `INSPECTION_ONLY` | **10.000 JOD** (`10000` fils) | 10.000 – 15.000 JOD diagnostic call | Per inspection (60 min) | Diagnostic only; breakers extra | Home2Serv (`home2serv.com`) — Verified 2026-10-29 |
| **Electrical** | `lighting-and-socket-installation` | `STARTING_AT` | **12.000 JOD** (`12000` fils) | 12.000 – 25.000 JOD | Per visit (60 min) | Installation labor; fixtures provided by customer | Home2Serv & EJO Stores — Verified 2026-10-29 |
| **AC & HVAC** | `split-ac-deep-cleaning-service` | `FIXED` | **18.000 JOD** (`18000` fils) | 15.000 – 25.000 JOD per split unit | Per unit (90 min) | Coil & filter wash included | Amman HVAC Benchmark — Verified 2026-10-29 |
| **AC & HVAC** | `ac-cooling-diagnostics-recharge` | `STARTING_AT` | **15.000 JOD** (`15000` fils) | 15.000 – 35.000 JOD (depending on refrigerant weight) | Per unit (60 min) | Diagnostics included; Freon gas billed by weight | Amman HVAC Benchmark — Verified 2026-10-29 |
| **Painting** | `single-room-interior-painting` | `STARTING_AT` | **55.000 JOD** (`55000` fils) | 55.000 – 90.000 JOD per standard room | Per room (300 min) | Putty prep & labor; premium paint optional | Amman Decor & Painting Benchmark — Verified 2026-10-29 |
| **Painting** | `dampness-and-mold-wall-treatment` | `STARTING_AT` | **30.000 JOD** (`30000` fils) | 30.000 – 65.000 JOD depending on wall area | Per treatment (180 min) | Anti-damp sealer base included | Amman Decor & Painting Benchmark — Verified 2026-10-29 |
| **Carpentry** | `wooden-door-and-lock-repair` | `FIXED` | **15.000 JOD** (`15000` fils) | 15.000 – 25.000 JOD | Per door (60 min) | Alignment labor; new cylinder lock extra | Amman Carpentry Benchmark — Verified 2026-10-29 |
| **Carpentry** | `kitchen-cabinet-hinge-and-drawer-repair` | `STARTING_AT` | **15.000 JOD** (`15000` fils) | 15.000 – 30.000 JOD | Per visit (90 min) | Adjustment labor; hydraulic hinges extra | Amman Carpentry Benchmark — Verified 2026-10-29 |

---

## 3. Marketplace Pricing Integrity Rules

1. **Provider Autonomy Preserved:** Individual approved providers on FixMate set their own `priceAmountFils` and `pricingType` (`FIXED`, `STARTING_AT`, `INSPECTION_ONLY`) in `provider_service_offerings`.
2. **Contextual Indicative Guidance:** Catalog services display their researched `indicativeAmountFils` clearly labeled with its policy (`Starting at` / `Fixed price` / `Inspection fee`) so customers have honest Amman market expectations before selecting a provider.
3. **Immutable Booking Snapshots:** When a customer books a provider, `pricingSnapshot.quotedAmountFils` is copied server-side from the provider's active offering in integer `fils`.
