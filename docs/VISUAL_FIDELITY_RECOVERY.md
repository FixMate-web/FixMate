# Visual fidelity recovery — 2026-10-29

## Starting point and reference

Started from a clean working tree, HEAD `621b8dc763f40e8e28602059368e06bc5e6e3646`. Changes are isolated on `fix/visual-fidelity-overhaul`. No backend implementation, schemas, authentication contracts, or application routes were replaced.

The Browser skill runtime reported “No browser is available” and an empty browser list. Installed Google Chrome was used through the existing Playwright dependency for real local rendering. Initial the design reference navigation produced a blank screenshot and its web response requested robot verification. A later ordinary navigation succeeded at desktop and mobile sizes; no restriction was bypassed. The live page and supplied screenshots were both inspected. Live computed styles confirmed a 588px hero column at x=423, 946px content width, 48px/50.4px desktop headings with the proprietary Rise font. FixMate uses independently licensed Inter instead.

## Screenshot specification

The supplied hero is 1855×893 including browser edges; the following sections are approximately 1840px wide. Their centered content is approximately 946px wide (x≈448–1394). Normalizing this to 1792px gives x≈423–1369.

| Area | Reference composition | Implementation target |
| --- | --- | --- |
| Header | White, ~72px high, edge-aligned brand/actions | 72px desktop, 64px mobile, responsive menu |
| Hero | Entire remaining viewport, photograph, dark overlay, left-of-center content | `100svh - 72px`, 588px content/search column at x≈423 on 1792px viewport |
| Typography | ~46px headings, ~16px body, restrained weights | Self-hosted Inter and Noto Sans Arabic, 46px/1.08 hero, 46px/1.1 section titles |
| Search | Two rows, white rounded panel, navy pill action | ~588×110px, 40px desktop controls; stacked 44px touch controls |
| Discovery | Two-line heading, minimal icon categories, four cards | 946px inner width, 16px gaps, ~224×291px cards |
| Projects | Heading/tabs, wide feature, three supporting cards | 946×300px feature, ~305×224px supporting cards; pale curved accent on one side |
| Resources | Soft neutral background, centered title/subtitle, three portraits | ~305×401px cards, 16px gaps, bottom white text |
| Mobile | Deliberate layout adaptation | Two-column services, scrollable categories/themes, scrollable landscape project cards, stacked resource cards |

Different photographs and bilingual content intentionally change crops and line wraps. No pixel-perfect score is claimed.

## Baseline discrepancies, ranked

1. **Critical:** `/images/services/` URLs did not exist; nearly all photographic sections were navy placeholders. Editorial/navigation links also targeted nonexistent slugs.
2. **High:** Hero was only 580px tall, with a 1240px container placing content too far toward the edge; overly dark overlay and heavier type.
3. **High:** Image semantics were wrong (the AC photo showed a guitar), with repeated service pictures and long labels.
4. **High:** Cards and banner exceeded the reference width; decorative price badges, duplicate category pills, extra panels, and a slanted full-section backdrop altered the composition.
5. **Medium:** Header spacing, menu viewport positioning, mobile button sizing, resource interaction, and form styling needed refinement.

## Review passes and changes

1. Baseline screenshots and structural pass: repaired images/routes, narrowed geometry, full-height hero, photographic project/resource layouts.
2. Typography/imagery pass: inspected desktop sections and mobile/RTL, introduced local fonts, replaced unrelated/weak photographs, shortened labels, tightened search and feature copy.
3. Final pass: restarted the development server after detecting stale Sass state; adapted the mobile hero to the live reference’s photograph-above-content layout and repeated all widths/languages, verified image loading and overflow, dropdown positioning/focus, resource dialogs, category/theme changes, search, and real API destinations.

Main files: homepage TS/HTML/SCSS; public and auth layouts; shared discovery search; provider row/discovery styles; login/register presentation; service-detail booking copy; local image/font assets. Resource cost labels are taken from the live catalog instead of hardcoded ranges. Static editorial links use canonical seeded slugs. There are no fabricated ratings or marketplace counts.

## Evidence and reproducibility

Evidence is in `artifacts/visual/`. `before-desktop.png` and `before-mobile.png` are original baseline captures. `after-en-1792.png`, `after-en-390.png`, and `after-ar-390.png` provide full-page comparisons. `after-hero.png`, `after-services.png`, `after-projects.png`, and `after-resources.png` isolate the principal sections.

Run `node frontend/tools/visual-review.cjs` from the repository root while Angular `:4200` and Nest `:3000` run. It uses the real API and writes screenshots plus `verification.json`; it does not inject fake services or providers. Chrome path can be overridden with `CHROME_PATH`.

## Limits

- the design reference loaded on ordinary retry. Its desktop/mobile appearance and computed styles were inspected; attempted desktop Explore/category/theme clicks did not consistently produce a visible change in the partially loaded session. Those interactions are not claimed as observed working reference behavior. FixMate’s equivalents were exercised independently.
- Only two services exist per current catalog category. Selecting a category correctly shows those two, rather than duplicating cards to fill four slots.
- The local provider directory is empty. Real profile data, authenticated booking completion, provider onboarding submission, and account creation were not fabricated for visual testing. Existing backend tests cover business logic, but these authenticated UI flows still need a seeded approved account walkthrough.
- Secondary pages receive shared typography, image, form, filter, and provider-row improvements. They have not all undergone the same detailed reference reconstruction as the homepage.

## Additional live reference observations

Desktop header is white and approximately 72px tall. At 390px, the reference uses a short top photograph and a light neutral text/search area below, with a hamburger menu and horizontally scrollable categories. FixMate follows that mobile composition while keeping its white brand header and Jordanian location selector. Reference project themes are native buttons, service categories are horizontal controls, and search becomes compact/sticky after scrolling. Reference source images intermittently loaded late; the supplied screenshots remain the visual authority for photography placement.

## Final verification

- Frontend production build: PASS, no budget warnings.
- Frontend tests: 8 suites / 23 tests PASS.
- Backend build: PASS; backend tests: 9 suites / 42 tests PASS. Backend source remains unchanged.
- Browser: all 16 requested viewport/language combinations passed overflow and loaded-image assertions; zero page errors. Live suggestions/search (including Irbid URL preservation), category filtering, project themes, dialogs, dropdown keyboard/outside closing, mobile menu, catalog/detail/auth routes and the protected requests route were exercised. See `artifacts/visual/verification.json`.
- Three visual review stages were performed with real Chrome screenshots. Desktop proportions were compared against the supplied screenshots and subsequently confirmed against live the design reference geometry.
- Git changes are intentionally uncommitted on the recovery branch; no unrelated files were staged.
