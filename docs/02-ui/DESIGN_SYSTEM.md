# FixMate — UI Design System & Bilingual Accessibility Specification

> **Document Status:** Phase 1 Specification & Implemented Foundation (`frontend/src/styles/`)  
> **Technology Constraint:** Pure HTML5, CSS3, and modular SCSS (`sass`) with CSS Custom Properties and CSS Logical Properties. No Tailwind, Bootstrap, Angular Material, or external component libraries.

---

## 1. Visual Direction & Core Principles

FixMate's interface is engineered for **clarity, bilateral trust, architectural calm, and bilingual accessibility**:
1. **Trust-First Hierarchy:** Clear status badges, explicit verification indicators, transparent JOD (`fils`) pricing labels, and unambiguous distinctions between active controls and Phase 1 structural placeholders.
2. **True Bilingual Symmetry (Arabic RTL & English LTR):** Layouts rely on **CSS Logical Properties** (`margin-inline`, `padding-inline`, `border-inline-start`, `inset-inline`, `text-align: start`) so switching `<html dir="rtl" lang="ar">` and `<html dir="ltr" lang="en">` mirrors the entire interface natively without brittle `.rtl` override hacks.
3. **Zero Fabricated Marketplace Data:** Phase 1 shells never display fake provider ratings, fake bookings, or deceptive non-functional submit buttons.

---

## 2. Design Tokens (`frontend/src/styles/_tokens.scss`)

### 2.1 Color Palette & Semantic Tokens

| Token Name | Hex / Value | Usage & Contrast Rationale |
| :--- | :--- | :--- |
| `--fm-color-brand-teal` | `#126C73` | Primary brand identity, primary buttons, active navigation accents (WCAG AA compliant with `#FFFFFF` text, contrast `5.75:1`). |
| `--fm-color-brand-teal-hover` | `#0E555B` | Hover/active state for primary interactive elements (contrast `7.8:1` on white). |
| `--fm-color-brand-teal-subtle` | `#E6F2F3` | Subtle tinted backgrounds for selected cards, focus halos, and info badges. |
| `--fm-color-deep-navy` | `#1F3447` | Primary headings, topbar/sidebar dark accents, high-contrast structural text (contrast `12.6:1` on white). |
| `--fm-color-surface-light` | `#F4F8F8` | Default page canvas background, subtle card headers, and secondary containers. |
| `--fm-color-surface-white` | `#FFFFFF` | Elevated cards, form controls, modals, and navigation surfaces. |
| `--fm-color-warm-accent` | `#F0A34B` | Warm highlight accent, pending/attention indicators, subtle callout borders (paired with `--fm-color-deep-navy` text for `7.4:1` contrast). |
| `--fm-color-text-primary` | `#162533` | Default body copy (`> 14:1` contrast on white). |
| `--fm-color-text-secondary` | `#4A5D6E` | Supporting descriptions, metadata, form helper text (`6.6:1` contrast on white). |
| `--fm-color-border` | `#D5E1E3` | Card borders, dividers, table rules. |
| `--fm-color-border-strong` | `#94AEB3` | Form input borders at rest (ensures `> 3:1` non-text contrast). |
| `--fm-color-success` / `bg` | `#1B6E44` / `#E8F6EE` | Approved / Completed / Connected states. |
| `--fm-color-warning` / `bg` | `#8A5300` / `#FEF4E6` | Pending Review / Requested / Degraded states. |
| `--fm-color-danger` / `bg` | `#B42318` / `#FEECEB` | Destructive actions, form validation errors, Cancelled / Rejected states. |

### 2.2 Typography Stack (Zero External Font Downloads Required)
To guarantee instant rendering without external network font dependencies or licensing issues, FixMate defines system-native bilingual font stacks:
- **English (LTR) & Base Stack (`--fm-font-sans`):**
  `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans Arabic', 'Tahoma', sans-serif`
- **Arabic (RTL) Optimized Stack (`html[lang="ar"]`):**
  `'Noto Sans Arabic', 'Segoe UI', 'Tahoma', system-ui, -apple-system, sans-serif`
- **Monospace Stack (`--fm-font-mono`):**
  `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

| Scale Token | Size (`rem` / `px`) | Line Height | Typical Usage |
| :--- | :--- | :--- | :--- |
| `--fm-text-xs` | `0.75rem` (`12px`) | `1.4` | Badges, timestamps, code tags |
| `--fm-text-sm` | `0.875rem` (`14px`) | `1.5` | Form labels, secondary metadata, table cells |
| `--fm-text-base` | `1rem` (`16px`) | `1.6` | Primary body copy, form inputs (prevents iOS auto-zoom) |
| `--fm-text-lg` | `1.125rem` (`18px`) | `1.5` | Card titles, lead paragraphs |
| `--fm-text-xl` | `1.375rem` (`22px`) | `1.35` | Section headings (`h2`/`h3`) |
| `--fm-text-2xl` | `1.75rem` (`28px`) | `1.25` | Page headings (`h1`) |
| `--fm-text-3xl` | `2.25rem` (`36px`) | `1.2` | Public hero headline |

### 2.3 Spacing, Radius, Shadow & Breakpoint Tokens
- **Spacing Scale (`4px` base):**
  - `--fm-space-1`: `0.25rem` (`4px`)
  - `--fm-space-2`: `0.5rem` (`8px`)
  - `--fm-space-3`: `0.75rem` (`12px`)
  - `--fm-space-4`: `1rem` (`16px`)
  - `--fm-space-5`: `1.25rem` (`20px`)
  - `--fm-space-6`: `1.5rem` (`24px`)
  - `--fm-space-8`: `2rem` (`32px`)
  - `--fm-space-10`: `2.5rem` (`40px`)
  - `--fm-space-12`: `3rem` (`48px`)
- **Border Radius:**
  - `--fm-radius-sm`: `6px` (badges, small controls)
  - `--fm-radius-md`: `10px` (buttons, inputs, alerts)
  - `--fm-radius-lg`: `14px` (cards, dialogs, shell panels)
  - `--fm-radius-pill`: `9999px` (status pills)
- **Elevation / Shadows:**
  - `--fm-shadow-sm`: `0 1px 3px rgba(31, 52, 71, 0.07)`
  - `--fm-shadow-md`: `0 4px 12px rgba(31, 52, 71, 0.09)`
  - `--fm-shadow-lg`: `0 12px 28px rgba(31, 52, 71, 0.14)`
- **Responsive Breakpoints (Mobile-First):**
  - Mobile base: `< 640px` (single-column stack, collapsible navigation drawer/menu)
  - `sm` (`640px`): Large handset / compact tablet
  - `md` (`768px`): Tablet (2-column grids, expanded header)
  - `lg` (`1024px`): Desktop (persistent dashboard sidebar, 3-column catalog grids)
  - `xl` (`1280px`): Max content container (`1200px` centered with `padding-inline`)

---

## 3. Core Reusable UI Primitives (`frontend/src/app/shared/ui/`)

All UI primitives are implemented as **lean Angular v22 standalone components** using `ChangeDetectionStrategy.OnPush` and signal inputs/outputs:

1. **`FmButtonComponent` (`<app-fm-button>`):**
   - Variants: `primary` (Brand Teal `#126C73`), `secondary` (Deep Navy outline/surface), `accent` (Warm Accent `#F0A34B` with Deep Navy text), `ghost`, `danger` (`#B42318`).
   - Sizes: `sm`, `md`, `lg`; supports `disabled`, `loading` (with inline spinner & `aria-busy`), and explicit `type="button" | "submit"`.
2. **`FmInputComponent` (`<app-fm-input>`):**
   - Accessible `<label [for]="id">`, `<input>`, optional helper text, and `aria-describedby` validation error message with `aria-invalid`.
3. **`FmSelectComponent` (`<app-fm-select>`):**
   - Strongly typed option list (`{ value, label }`), accessible `<label>`, placeholder option, and error state.
4. **`FmTextareaComponent` (`<app-fm-textarea>`):**
   - Accessible multi-line input with configurable `rows`, helper text, and validation feedback.
5. **`FmCardComponent` (`<app-fm-card>`):**
   - Structured surface container with optional header title/subtitle, badge slot, body projection, and footer slot.
6. **`FmBadgeComponent` (`<app-fm-badge>`):**
   - Semantic status pills (`neutral`, `teal`, `navy`, `success`, `warning`, `danger`) mapping cleanly to `BookingStatus` and `ProviderApprovalStatus`.
7. **`FmSpinnerComponent` (`<app-fm-spinner>`):**
   - Accessible SVG/CSS loading indicator with `role="status"` and localized screen-reader label; respects `prefers-reduced-motion: reduce`.
8. **`FmEmptyStateComponent` (`<app-fm-empty-state>`):**
   - Clean, honest empty-state panel with icon, localized title, explanation text, and optional action slot.
9. **`FmAlertComponent` (`<app-fm-alert>`):**
   - Contextual feedback banner (`info`, `success`, `warning`, `danger`) with `role="status"` or `role="alert"`.
10. **`FmConfirmDialogComponent` (`<app-fm-confirm-dialog>`):**
    - Accessible modal confirmation dialog (`role="dialog"`, `aria-modal="true"`, Escape key dismissal, explicit confirm/cancel buttons).

---

## 4. Application Shells (`frontend/src/app/layouts/`)

1. **`PublicLayoutComponent`:**
   - Skip-to-content link (`#main-content`), live API health status pill in top bar, brand logo, responsive navigation (`Home`, `Services`, `Providers`, `About`, `UI Showcase` in dev), runtime Arabic/English switcher (`العربية` / `EN`), auth/dashboard shell links, `<router-outlet>`, and bilingual footer.
2. **`AuthLayoutComponent`:**
   - Focused, distraction-free card frame for `/auth/login` and `/auth/register`, featuring brand header, language switcher, and an explicit Phase 1 notice explaining that authentication submission is scheduled for Phase 2 (controls are disabled or read-only previews — never deceptive dead-end buttons).
3. **`DashboardLayoutComponent`:**
   - Responsive sidebar + topbar shell supporting Customer (`/dashboard/customer`), Provider (`/dashboard/provider`), and Admin (`/dashboard/admin`) workspace previews. Includes an explicit **Phase 1 Structural Shell Banner** clarifying that role switching in Phase 1 previews layout structure only and does not claim active authentication.

---

## 5. Accessibility & RTL/LTR Engineering Rules

- **Skip Navigation:** The first focusable element on every page is a `.skip-link` that jumps directly to `<main id="main-content" tabindex="-1">`.
- **Keyboard Focus Visibility:** All interactive elements use `:focus-visible` with a high-contrast `3px solid var(--fm-color-brand-teal)` outline and `2px` offset.
- **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` disables non-essential transitions and slows/halts continuous animations.
- **Logical CSS Only:** All horizontal margins, paddings, borders, flex/grid alignments, and absolute offsets use logical properties (`inline-start` / `inline-end`) so Arabic (`dir="rtl"`) and English (`dir="ltr"`) share a single stylesheet with zero layout drift.
