# FIXMATE / ASTRA — VISUAL REFERENCE PACK

This pack contains one user-provided FixMate brand logo and 15 user-provided visual screenshots for analysis. Images of Thumbtack are **visual references only**; do not copy copyrighted photograph assets or Thumbtack branding into FixMate.

## Brand

- `brand/fixmate-logo-original.png` — the exact logo chosen by the user, a navy/turquoise house-and-wrench icon, no wordmark. Image has an opaque near-white background and substantial margins: crop/prepare a transparent variant while preserving the original emblem. Reuse it for navigation and favicon.

## Hero and mega-menu

- `reference/01-hero-kitchen.png` — full-bleed hero, rotating photo theme, text-search panel, dark overlay, trust markers. Add a gently zooming crossfade slideshow with several licensed distinct images.
- `reference/15-explore-mega-menu.png` — Explore dropdown in open state: white two-panel mega-menu, grouped categories in left panel, selected section's services on right, visible scroll, separator, and dark translucent backdrop over the hero. Make accessible and responsive.

## Service discovery — 13 separate tab screenshots

The requested **complete** set should include these 13 screenshot categories PLUS `Cleaners` from the earlier user reference (total 14 tabs / 56 example subservices). Adapt language and backend slugs to the Jordan market, but don't silently omit categories. If some services have no providers, show an honest empty state and don't fabricate them.

| Reference | Category | Four cards shown |
|---|---|---|
| 02-handymen | Handymen | Appliance Repair or Maintenance; Lock Installation and Repair; Furniture Assembly; Holiday Lighting Installation and Removal |
| 03-landscapers | Landscapers | Lawn Mowing and Trimming; Tree Trimming and Removal; Sprinkler and Irrigation System Repair and Maintenance; Full Service Lawn Care |
| 04-movers | Movers | Packing and Unpacking; Long Distance Moving; Furniture Moving and Heavy Lifting; Piano Moving |
| 05-plumbers | Plumbers | Emergency Plumbing; Water Heater Repair or Maintenance; Septic System Repair, Maintenance or Inspection; Plumbing Pipe Repair |
| 06-electrical | Electrical pros | Electrical and Wiring Repair; Switch and Outlet Installation; Wiring Installation; Generator Installation |
| 07-painters | Painters | Wallpaper Installation or Repair; Interior Painting; Exterior Painting; Fence Painting |
| 08-hvac | HVAC pros | Duct and Vent Cleaning; Heating System Installation or Replacement; Heating System Repair or Maintenance; Fireplace and Chimney Cleaning or Repair |
| 09-contractors | Contractors | General Carpentry; Home Remodeling; Demolition Services; Water Damage Cleanup and Restoration |
| 10-pool-spa | Pool & spa | Swimming Pool Repair; Hot Tub and Spa Repair; Swimming Pool Cleaning, Maintenance, and Inspection; Hot Tub and Spa Cleaning and Maintenance |
| 11-roofing | Roofing | Gutter Cleaning and Maintenance; Roof Repair or Maintenance; Duct and Vent Installation or Removal; Roof Installation or Replacement |
| 12-windows-doors | Windows & doors | Garage Door Repair; Window Repair; Window Treatment Installation or Repair; Door Installation |
| 13-concrete-masonry | Concrete & masonry | Concrete Repair and Maintenance; Concrete Installation; Stucco Application; Masonry Construction Services |
| 14-exterminators | Exterminators | Rodent and Animal Removal; Termite Control Services; Bed Bug Extermination; Pest Control Services |
| earlier reference, not in this pack | Cleaners | House Cleaning; Carpet Cleaning; Junk Removal; Pressure Washing |

## Required visual/functional outcomes

1. Use the exact user-supplied FixMate emblem; no surrogate brand icon.
2. Full-bleed high-resolution home-photo HERO slideshow that smoothly slowly zooms and crossfades; first frame visible immediately, no flashing; respect prefers-reduced-motion and document.visibilityState.
3. Fully functional two-panel, scrollable, accessible Explore Services mega-menu, based on its supplied open screenshot, same category and service taxonomy as homepage.
4. 14 named categories in a horizontally scrolling tab rail, active icon and underline. Exactly four relevant image service cards shown for each selected tab on desktop. Left/right controls and swipe support with correct RTL. Do not duplicate generic cards or pretend unavailable providers exist.
5. Data-driven mapping from real taxonomy and supported routes; don't treat example card names as fabricated bookable inventory. All names translated Arabic/English; appropriate Jordan local context. Do not invent prices, ratings, providers, availability.
6. Screenshot and review desktop & mobile, both EN LTR and AR RTL, and run build/tests without losing existing functionality.
