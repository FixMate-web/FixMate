# FixMate deployment engineering report — 2026-10-30

## Git and scope

- Original branch: `feat/partial-hero-discovery-integration`, original HEAD `337cb6a`; working tree was clean, including untracked files.
- Cleanup branch: `chore/remove-reference-assets`, commit `e21974b`.
- Deployment branch: `deploy/atlas-vercel-render`, code/configuration commit `52aec65`, followed by the documentation/report commit.
- Deployment branch contains the cleanup commit. Original branch and main were not modified. Nothing was pushed, merged or deployed. Local real environment files were preserved and remain ignored.
- `AGENT_SWITCH_HANDOFF.md` was absent; consolidated/phase handoffs and current implementation were inspected. Existing features were retained rather than rebuilt.

## Reference cleanup and homepage

See [cleanup inventory](REFERENCE_CLEANUP.md) and the cleanup commit for exact deleted paths. Removed 15 inspiration screenshots, their analysis manifest, duplicate logo copy, two reference-only documents, 187 tracked temporary design/evidence files and four undocumented/unused legacy images. Preserved the original production logo, functional image assets, photography/font license records, development handoffs and generation provenance (moved into docs). About now uses documented stock photography. The README homepage capture was refreshed after cleanup.

Removed `.hero-caption-pill`, its title/description, styles, homepage state and slideshow event output, plus unused per-slide caption metadata. Affected components: `HomePageComponent`, `HeroSlideshowComponent`, `hero-slides.ts`, and their verification. The seven generated scenes, zoom, fade, foreground search/headline and overlapping `.discovery-transition` card remain. Source contains no competitor-brand references.

Retained stock images have documented Unsplash/Pexels sources; fonts retain their licenses. The user-supplied logo's rights were not independently established. Generated scenes are illustrative, with no claim of exclusive rights. Historical verification reports may refer to captures removed during cleanup.

## Production changes

- MongoDB Atlas SRV URI support remains environment-driven through `MONGODB_URI`; local MongoDB is preserved. Connection attempts/timeouts are bounded and errors are sanitized before Nest/Mongoose retry logging. Initial failure exits instead of serving an unready API.
- Added compiled `db:indexes` initialization for all registered schemas. Uses additive `createIndexes()`, never drops existing indexes. Required before public use because production autoIndex is disabled. Catalog/admin compiled CLI commands are available; production needs explicit DB configuration and existing admin opt-in.
- Added a single Free Render service Blueprint, backend root, reproducible build, production start, health path, Node version and secret inputs. Backend binds Render PORT on 0.0.0.0 and trusts the nearest ingress hop.
- `/api/v1/health` now responds 503 when the database is unavailable; `/api/v1/health/live` distinguishes process liveness.
- Added Vercel Build Output API v3 packaging for existing Angular CSR output. `RENDER_API_ORIGIN` generates an external API proxy at build time, with API-first routing, filesystem handling and application-route fallback. Missing assets and unsupported API prefixes stay 404. Ordinary local Angular development is unchanged. Browser production output contains no localhost/loopback strings.
- Production config rejects missing/default/wildcard/non-HTTPS frontend origins and placeholder/short signing secrets. Production refresh/logout require an origin or Referer plus the existing custom header. Cookies remain Secure/HttpOnly/Lax, host-only, auth-path scoped; access tokens remain in memory. API responses explicitly use no-store.
- Fixed a demonstrated refresh race: family revocation could complete before a concurrent successor insertion. Family reasons now mark ancestors as well, and a post-insertion predecessor check revokes any successor that escaped an in-flight replay/logout. Deterministic regression tests cover both cases without a schema change or replica-set requirement.
- Tightened frontend bearer-token URL matching to exact API origin/path boundaries and removed an unnecessary retry header. Production no longer registers the UI showcase route. Development email-stub logging is suppressed in production.
- Patched transitive Multer to 2.5.0 through a targeted override, retaining NestJS 11. No new application dependencies or paid resources were introduced.

## Executed verification

All final checks below passed unless explicitly qualified.

| Check | Command / method | Result |
| --- | --- | --- |
| Reproducible dependency install | `npm ci --prefix backend`, `npm ci --prefix frontend`; backend reinstalled after lock update | Pass; native bcrypt and Angular compilation exercised successfully |
| Backend compilation | `npm run build --prefix backend` | Pass |
| Backend lint | `npm run lint --prefix backend` | Pass, no warnings |
| Backend unit/integration | `npm test --prefix backend -- --runInBand` | 10 suites, **52 tests passed** against local MongoDB |
| Frontend production compilation | `npm run build --prefix frontend` | Pass; actual browser output `frontend/dist/fixmate-frontend/browser` |
| Frontend unit/component tests | `npm test --prefix frontend -- --watch=false` | 11 files, **41 tests passed** |
| Frontend lint | Package-script inspection | No frontend lint command configured; no lint pass claimed |
| Deployment routing tests | `npm run test:deployment --prefix frontend` | **2 tests passed** |
| Vercel production packaging | `RENDER_API_ORIGIN=https://api.example.com npm run build:vercel --prefix frontend` | Pass; reserved example origin only in ignored test output, not a real destination |
| Hosting configuration schemas | Render published schema; Vercel published configuration/route schemas | Pass locally; no provider-account/API validation or deployment performed |
| Hero browser verification | `node frontend/tools/service-hero-review.cjs` | Seven scenes plus natural wraparound in EN/AR desktop and mobile; 12 responsive widths/directions, reduced motion, no visible zoom resets, broken hero images or page errors; overlay absent and discovery card present |
| Production HTTPS browser smoke | `node frontend/tools/deployment-smoke.cjs` | Built frontend → local HTTPS proxy emulating generated routes → production-mode Nest → isolated local MongoDB; all checks passed |
| Startup failure and log hygiene | Compiled backend with an unreachable loopback URI containing sentinel credentials | Exit 1 in **17.4 seconds**; credentials, URI and signing secret absent from captured logs |
| Dependency audit | npm audit for both applications; backend also `--omit=dev` | Frontend: 0; backend runtime: 0; backend all dependencies: **9 low** development-tooling findings, no high/critical |
| Secret/history hygiene | Tracked-file review, env history paths, pattern scan of 283 historical text blobs | Only environment examples tracked; no high-confidence credential-pattern hits; no history rewriting |
| Git whitespace | `git diff --check` | Pass |

Backend integration coverage includes registration/login/profile, account suspension and RBAC, production cookie flags, invalid/missing origins, expired access and refresh tokens, rotation/replay/logout, deterministic revocation races, authentication throttling, provider onboarding/moderation, catalog management/search, address ownership, booking idempotency and concurrent slot acceptance, full booking/review/notification lifecycle, and project requests/response/cancellation/ownership.

The production browser smoke verifies eight public/auth route refreshes, service details, search, governorate filtering, customer/provider registration forms, login forms and all three role dashboards, protected profile requests, refresh/cookie rotation, dashboard reload, logout and RBAC. It tests first-party Secure cookies with Chrome's third-party-cookie phaseout switch enabled. It initializes indexes and verifies slot uniqueness. It reports no uncaught runtime errors, unexpected console errors or failed page assets. Screenshots were inspected at desktop/mobile sizes. It removes only its own new test database and temporary TLS files.

Resolved failures during this work: an early hero review was interrupted by development hot reload while files were still changing; rerun after stable files passed. An initial smoke harness used Node's DNS resolver for a browser-only mapped hostname; switching its final probes to browser fetch resolved that harness error. The deterministic security regression failed against the old refresh code (200 after family revocation) and passes with the fix. No tests were disabled to achieve the final results; authentication rate windows are reset between isolated test cases and a separate case verifies the real 429 limit.

## Remaining external checks and owner actions

Engineering/configuration work is complete locally. Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for exact setup and commands. You must supply Atlas/hosting accounts, database credentials, actual service origins and Render outbound CIDRs, initialize indexes/catalog and explicitly provision an administrator. No final service URL or credential was invented.

Live Atlas DNS/TLS/network permissions, actual Render startup/health/cold starts, Vercel external forwarding of Origin/Cookie/Set-Cookie, CDN no-store behavior, real client-IP throttling behavior and Firefox/Safari/private-mode behavior remain **unverified on hosted services**. Rehearse major workflows with approved providers in the deployed environment before public launch. Full first-party-cookie blocking cannot preserve a cookie session; frontend tests verify safe unauthenticated behavior when refresh fails. Direct cross-site cookie deployment is not the configured architecture.

The remaining deepmerge advisory has no upstream patch listed and is confined to development/build tooling. Track it without a forced Jest/Nest downgrade. There is no implemented persistent upload, Redis/queue, SMTP or WebSocket dependency. Render Free does not provide always-on jobs or durable filesystem storage. Product-owner publication work includes choosing support contacts, policies and operational monitoring/backups. None of these were represented as completed live work.
