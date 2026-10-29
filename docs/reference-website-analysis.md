# FixMate — Reference Website & Screenshot Analysis (`thumbtack.com`)

**Verification Date:** 2026-10-29  
**Primary Reference:** `https://www.thumbtack.com/` + 7 User-Provided Reference Screenshots  
**Target Branch:** `feat/premium-thumbtack-transformation`

---

## 1. Visual & Structural Audit of the 7 Reference Screenshots

### 1.1 Screenshot 1 (`Screenshot from 2026-10-29 21-03-31.png`) — Full-Bleed Architectural Hero & Header
- **Top Header Bar:**
  - Clean white sticky header (`64px–72px` height), crisp bottom border (`1px solid #e5e7eb`).
  - Left: Bold brand wordmark (`FixMate` with circular cyan-teal badge).
  - Right: `Explore Services ⌄` (triggers a two-column floating mega-menu), `Join as a pro`, `Log in`, and a pill-shaped `Sign up` button (`border-radius: 999px`).
- **Hero Section:**
  - Edge-to-edge full-width architectural photograph of an inviting modern residential porch/home with warm recessed step lighting and wood pergola (`min-height: 600px`).
  - Subtle dark directional overlay (`linear-gradient(90deg, rgba(7, 28, 38, 0.76) 0%, rgba(7, 28, 38, 0.42) 55%, rgba(7, 28, 38, 0.18) 100%)`) preserving photographic clarity while guaranteeing `AAA` white text contrast on the start side.
  - Headline: Large, tight-tracking bold white typography (`clamp(2.5rem, 4.2vw, 3.75rem)`, `font-weight: 800`, `line-height: 1.08`).
  - Supporting copy: Concise 2-line white subheadline (`1.05rem`, `max-width: 480px`).
  - **Two-Tier Floating White Search Card (`border-radius: 16px`, `max-width: 560px`, `background: #ffffff`, `padding: 14px 16px`):**
    - **Top Row:** Magnifying glass icon + borderless full-width search input (`"Describe your project or problem — be as detailed as you'd like!"`) with live debounced service autocomplete suggestions.
    - **Bottom Row:** Pill-shaped location selector (`border-radius: 999px`, `border: 1px solid #d1d5db`, map-pin icon + Jordan Governorate dropdown) paired with a wide deep-navy pill button (`background: #072f40`, `border-radius: 999px`, `"Find a pro →"`).
  - **Trust Indicators Below Search:**
    - Lock icon + `"Direct booking or project request — no hidden fees."`
    - 3 honest, real-data columns below (`JOD Upfront Pricing`, `Admin-Reviewed Pros`, `30-Min Slot Booking` + live catalog counts).
  - **Bottom-Right Project Caption Pill:** Translucent dark glass badge (`AMMAN HOME CARE · Modern residential repairs, cooling, plumbing & finishes`).

### 1.2 Screenshot 2 (`Screenshot from 2026-10-29 21-03-59.png`) — "Pros for every project in Your Area."
- **Section Heading:** Centered 2-line bold heading (`"Pros for every project in"` in `#111827` + `"Your Area."` in signature cyan-blue `#009fd9`).
- **Horizontal Icon Category Bar:**
  - Centered horizontal row of category tabs with minimal line-art SVG icons (`24x24`) stacked above the category label (`Cleaning`, `Plumbing`, `Electrical`, `AC & Cooling`, `Painting`, `Carpentry`, `All Services`).
  - Active category tab highlighted in `#009fd9` with a `3px` bottom indicator bar and a floating circular scroll button (`>`) on the end.
- **4-Column Portrait Photographic Cards (`aspect-ratio: 3 / 3.8`, `border-radius: 16px`):**
  - Edge-to-edge service photography with a smooth dark bottom gradient (`linear-gradient(180deg, transparent 48%, rgba(7, 25, 35, 0.86) 100%)`).
  - Bold white service title anchored at the bottom-start (`1.125rem`, `font-weight: 700`) plus a subtle JOD starting/fixed price pill derived from the real catalog.

### 1.3 Screenshot 3 (`Screenshot from 2026-10-29 21-04-53.png`) — "Explore more projects."
- **Background Accent:** Soft diagonal ice-blue geometric backdrop (`#eef8fc`) spanning the right half of the section.
- **Centered Heading & Text Tabs:**
  - `"Explore more projects."` (`2.25rem`, `font-weight: 800`).
  - 4 interactive project group tabs (`Home Maintenance`, `Home Remodeling`, `Seasonal & Tank Care`, `Essential Repairs`) with `#009fd9` active underline.
- **1 Wide Featured Banner + 3 Supporting Cards:**
  - **Featured Banner (`height: 360px`, `border-radius: 16px`):** Wide lifestyle/home photograph with left dark gradient, 2-line white editorial headline, and `"See all ... projects. →"` CTA link.
  - **3 Supporting Cards (`aspect-ratio: 16 / 10`, `border-radius: 16px`):** 3 equal-width photographic cards below the banner, each linking to a real FixMate catalog service or category.

### 1.4 Screenshot 4 (`Screenshot from 2026-10-29 21-05-10.png`) — "Resources for your home."
- **Centered Heading & Subtitle:**
  - `"Resources for your home."` + 2-line muted subtitle (`"Sometimes getting started is the hardest part. We've got expert guidance for your next project."`).
- **3 Portrait Editorial Resource Cards (`aspect-ratio: 3 / 3.8`, `border-radius: 16px`):**
  - **Card 1 — Cost guides:** Real Jordan home-maintenance JOD cost ranges (based on verified Amman market research).
  - **Card 2 — Maintenance tips:** Seasonal Amman home readiness (pre-summer AC servicing, winter water heater & roof drainage checks).
  - **Card 3 — Project guides:** How to compare fixed-price vs starting-at vs inspection-only offerings and book 30-minute capacity slots on FixMate.
  - Interactive guide reader modal/drawer so clicking any resource card opens structured, actionable Jordan-specific guidance.

### 1.5 Screenshots 5 & 6 (`21-14-12.png` & `21-14-48.png`) — Clean Centered Auth Cards (`Welcome back` & `Create your account`)
- White top bar with circular cyan-blue brand mark + navigation links.
- Centered page heading (`Welcome back` / `Create your account`) above a clean white bordered card (`max-width: 460px`, `border: 1px solid #e5e7eb`, `border-radius: 12px`, `padding: 32px`).
- Pill-shaped form inputs (`border-radius: 999px`, `min-height: 48px`, `border: 1px solid #d1d5db`, `#009fd9` focus ring).
- Clear password requirement bullet list on account creation, role selector (`Homeowner / Customer` vs `Service Professional`), and full-width deep-navy pill submit button (`background: #072f40`, `border-radius: 999px`, `height: 48px`).

### 1.6 Screenshot 7 (`21-15-46.png`) — Two-Column "Explore Services" Header Mega-Menu
- Clicking `Explore Services ⌄` in the header opens a floating two-column menu:
  - Left column: Service categories with right chevrons (`>`).
  - Right column: Direct links to the services within the hovered/selected category + quick link to browse all services and approved pros.

---

## 2. What Remains Uniquely FixMate
- **Original Brand Identity:** FixMate wordmark & house-check emblem, deep navy-teal (`#072f40`) + vibrant Jordan cyan-blue (`#009fd9`) palette, bilingual Arabic (`RTL`) + English (`LTR`) support.
- **Honest Jordan Market Data:** All prices are in **JOD** (persisted as integer `fils`), locations use the 12 Jordanian Governorates (`Amman`, `Irbid`, `Zarqa`, etc.), and no fake US review counts (`15M+ reviews`, `300K+ pros`) are ever displayed.
