# FixMate — Local Photography & Image Assets Inventory

**Last Updated:** 2026-10-29  
**Storage Location:** `frontend/public/images/` (served statically with zero third-party runtime CDN dependencies)

---

## 1. Asset Inventory & Usage Mapping

| Asset Path | Dimensions / Responsive Variants | Format | Used In | Visual Subject & Alt Context |
|---|---|---|---|---|
| `/images/hero/home-480.webp`, `/images/hero/home-960.webp`, `/images/hero/home-1600.webp` | `480w`, `960w`, `1600w` (`1600×1046`) | WebP | Homepage Hero, Explore Projects Featured Banner | Warm modern residential architectural interior & recessed lighting |
| `/images/home-interior.jpg` | `1200×800` | JPEG | Explore Projects (`Home Remodeling` featured banner) | Contemporary bright living space & interior finish |
| `/images/categories/cleaning-480.webp`, `cleaning-960.webp` | `480w`, `960w` | WebP | Pros for Every Project (`cleaning`), Service Cards, Resources (`Maintenance tips`) | Professional residential cleaning & sanitization |
| `/images/categories/plumbing-480.webp`, `plumbing-960.webp` | `480w`, `960w` | WebP | Pros for Every Project (`plumbing`), Service Cards | Plumber repairing residential water fixture & pipe fitting |
| `/images/categories/electrical-repairs-480.webp`, `electrical-repairs-960.webp` | `480w`, `960w` | WebP | Pros for Every Project (`electrical-repairs`), Service Cards | Electrician inspecting residential breaker & wiring |
| `/images/categories/ac-maintenance-480.webp`, `ac-maintenance-960.webp` | `480w`, `960w` | WebP | Pros for Every Project (`ac-maintenance`), Service Cards | Technician servicing split air-conditioning unit |
| `/images/categories/painting-480.webp`, `painting-960.webp` | `480w`, `960w` | WebP | Pros for Every Project (`painting`), Resources (`Cost guides`), Service Cards | Interior wall painting with roller & crisp finish |
| `/images/categories/carpentry-480.webp`, `carpentry-960.webp` | `480w`, `960w` | WebP | Pros for Every Project (`carpentry`), Resources (`Project guides`), Service Cards | Custom woodwork, door alignment & cabinetry craftsmanship |
| `/images/marketing/craftsman-480.webp`, `craftsman-960.webp` | `480w`, `960w` (`960×640`) | WebP | Homepage Provider Recruitment CTA Banner | Professional craftsperson working in workshop |

---

## 2. Image Delivery & Performance Standards

1. **Zero Copyrighted Thumbtack Assets:** None of the images are copied from Thumbtack. All assets are locally hosted royalty-free/permissively licensed commercial photography optimized to WebP (`480w`, `960w`, `1600w`).
2. **LCP Optimization:** The homepage hero image uses `fetchpriority="high"` with explicit `width="1600" height="1046"` and responsive `srcset` to prevent Cumulative Layout Shift (`CLS = 0`).
3. **Below-the-Fold Lazy Loading:** All category, project, and resource cards below the fold use `loading="lazy"` and `object-fit: cover` inside fixed `aspect-ratio` containers.
