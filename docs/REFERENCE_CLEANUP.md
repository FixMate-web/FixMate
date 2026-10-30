# Reference and hero cleanup — 2026-10-30

Started from clean `feat/partial-hero-discovery-integration` at `337cb6a`.

- Removed all 15 inspiration screenshots under `docs/fixmate_astra_visual_references/reference/`, the reference manifest, and the analysis-only `reference-website-analysis.md` and `THUMBTACK_REFERENCE_AUDIT.md`.
- Removed tracked temporary design captures and reports under `artifacts/` (187 files). The exact paths remain reviewable in the cleanup commit. Future captures are ignored.
- Preserved generation prompts/hashes in `docs/hero-generation-provenance.json`; retained functional handoffs, asset sources, README application screenshots, fonts and licenses.
- Preserved the supplied original FixMate emblem at `frontend/public/brand/fixmate-logo-original.png`; removed its duplicate in the reference pack.
- Removed three unused legacy `images/hero/home-*.webp` files and the undocumented `images/home-interior.jpg`. About now uses documented `images/editorial/living.webp`.
- Removed irrelevant competitor naming from source comments and retained historical engineering findings in handoffs. No competitor assets or URLs remain in runtime source.
- Removed the homepage caption container, title, description, SCSS, state binding, slideshow output and caption-only metadata for every slide. The discovery transition card and seven-scene slideshow remain.

Retained stock assets have documented Pexels/Unsplash provenance, and font licenses remain alongside the files. Stock images and generated scenes are illustrative. The supplied logo's ownership/license is user-provided, not independently established; application source has no open-source license. No claim of exclusive rights is made. Historical verification reports refer to temporary captures that have been removed; their counts are historical, not current verification results.

Verification: frontend production build and 37 unit tests pass. Updated Playwright review checks overlay absence and discovery-card presence on every slide, natural rotation/wraparound in EN/AR desktop and mobile, responsive widths and reduced motion. See deployment verification report for final results.
