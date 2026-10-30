# FixMate deployment guide: Atlas, Render and Vercel

This guide applies to `deploy/atlas-vercel-render`. Nothing has been pushed or deployed by the agent. Use your own GitHub, MongoDB Atlas, Render and Vercel accounts. Start with the free options where available; review the plan summary before creating resources. No Redis, paid disk, queue, SMTP account or custom domain is required for the implemented workflows.

The browser loads Angular from Vercel and calls **the same origin** at `/api/v1`. Vercel forwards that path to Render, which connects to Atlas. Angular remains a client-rendered (CSR) application; there is no SSR server to run on Vercel. Cookies are first-party to the frontend hostname, HttpOnly, Secure, SameSite=Lax, host-only and scoped to `/api/v1/auth`. The backend never sets a cookie Domain.

## Values you must supply manually

| Value | Where to set it | Meaning |
| --- | --- | --- |
| Atlas project/cluster and database user | Atlas | Dedicated database `fixmate`, user limited to `readWrite` on that database |
| `MONGODB_URI` | Render secret | Atlas Drivers URI including database name and percent-encoded password |
| `JWT_ACCESS_SECRET` | Render secret | Unique random signing secret, at least 32 characters; Blueprint can generate it |
| `CORS_ORIGINS` | Render | Exact approved frontend HTTPS origin(s), comma separated, no slash/path/wildcard |
| `RENDER_API_ORIGIN` | Vercel build environment | Real Render HTTPS origin, without `/api/v1` or trailing slash |
| Render outbound CIDR ranges | Atlas Network Access | Copy from the actual Render service, not examples from this document |
| Admin email and strong password | One-time trusted CLI environment | Explicit administrator provisioning, never public registration or demo seed |
| Deployment branch | Both providers | `deploy/atlas-vercel-render` |

Angle-bracket examples are instructions to replace values, not working credentials or invented service URLs. Never paste secrets in GitHub files, browser code, screenshots or support tickets. Angular does not automatically consume `.env` files. `frontend/.env.example` documents a Vercel build variable, not a browser secret.

## Before creating services

1. Review the local commits and this guide. Push only when you choose:
   ```bash
   git switch deploy/atlas-vercel-render
   git status --short
   git push -u origin deploy/atlas-vercel-render
   ```
   The cleanup branch is included as an ancestor. You can push it separately if wanted; do not merge into main automatically.
2. Use Node 24.x (at least 24.15) and npm 11. Local verification used Node 24.21.0 and npm 11.19.0. Both lockfiles are required. There is no root package install.
3. Verify locally from the repository root:
   ```bash
   npm ci --prefix backend
   npm ci --prefix frontend
   docker compose up -d mongodb
   npm run build --prefix backend
   npm run lint --prefix backend
   npm test --prefix backend -- --runInBand
   npm run build --prefix frontend
   npm test --prefix frontend -- --watch=false
   npm run test:deployment --prefix frontend
   node frontend/tools/deployment-smoke.cjs
   ```
   Backend tests use local isolated test databases. The smoke script creates and deletes its own `fixmate_deployment_smoke_<pid>` loopback database; it never targets Atlas or your development `fixmate` database. It requires OpenSSL, local MongoDB and Chrome (`CHROME_PATH` overrides `/usr/bin/google-chrome`), and uses ports 3131 and 4343. It emulates the generated Vercel route order over local HTTPS. It does not prove actual Vercel forwarding. Visual captures are ignored under `artifacts/deployment/`. There is no frontend lint script; production compilation and unit tests check TypeScript/templates.

## Part A — MongoDB Atlas

1. Sign in to Atlas and create/select a project. Create a free cluster if offered in your account; do not select a paid tier accidentally. Choose a region near the Render service. MongoDB 7-compatible schemas and indexes are preserved; do not downgrade an existing database.
2. Open **Database Access**, create a dedicated database user (different from your Atlas website login), and generate a strong unique password. Assign `readWrite` only on `fixmate`, rather than project-wide administrator access. Keep the credential in your password manager.
3. In the cluster's **Connect → Drivers** dialog, choose Node.js and copy its `mongodb+srv://` URI. Replace its username/password placeholders and set the database path to `/fixmate`. Percent-encode reserved characters in the password (`@`, `:`, `/`, `#`, etc.); do not encode the whole URI. Keep the driver's TLS/default SRV options. Example shape:
   ```text
   mongodb+srv://<database-user>:<encoded-password>@<cluster-host>/fixmate?retryWrites=true&w=majority
   ```
4. Put the real URI in Render's `MONGODB_URI` secret. Never use Vercel for this value.
5. In **Network Access**, allow the actual Render service's outbound ranges. In Render open the service, **Connect → Outbound**, copy every listed CIDR range and add them to Atlas. These are shared regional ranges, so database authentication and least privilege still matter. They are not your frontend users' IP addresses.
6. For initial CLI initialization from your workstation, temporarily allow only your current public IP and remove it afterward. Do not select “allow access from anywhere.” This guide does not authorize `0.0.0.0/0`. Any exceptional broad-access workaround requires your explicit decision after understanding that every Internet host can attempt database authentication.
7. After the Render service starts, check `/api/v1/health`; a 200 response with `database.status=connected` confirms readiness, not just a running process. The application attempts three connections with five-second server-selection timeouts and one-second retry delays; DNS/TLS work can affect total startup time. It exits on failure and emits sanitized advice.

### Initialize collections, indexes and catalog

Production disables automatic indexing. **Run this before accepting public registrations or bookings.** Unique indexes protect email/session/slot constraints; TTL indexes expire refresh records. No schema migration or data rewrite is introduced by this branch.

Use a trusted terminal with the built backend and production variables supplied securely. From the repository root, read secrets without putting them in command history:

```bash
read -r -s -p 'Atlas URI: ' MONGODB_URI
printf '\n'
export MONGODB_URI
read -r -s -p 'JWT signing secret: ' JWT_ACCESS_SECRET
printf '\n'
export JWT_ACCESS_SECRET
read -r -p 'Frontend HTTPS origin: ' CORS_ORIGINS
export CORS_ORIGINS
export NODE_ENV=production
npm run db:indexes --prefix backend
npm run seed:catalog:prod --prefix backend
```

The backend must already have been built (`npm ci --prefix backend`, `npm run build --prefix backend`). Index initialization loads every registered schema, including project requests, and calls `createIndexes()`. It adds declared indexes and **does not drop existing indexes**. A duplicate-key failure needs deliberate investigation of existing data; do not delete records blindly or use `syncIndexes()` as a shortcut. The catalog seed is idempotent and preserves supported administrator edits. Review seed output and the live catalog. Never run `seed:demo` against production; it refuses production and is for loopback development only.

For a new administrator, in the same trusted terminal:

```bash
read -r -p 'Admin email: ' ADMIN_BOOTSTRAP_EMAIL
read -r -s -p 'Admin password: ' ADMIN_BOOTSTRAP_PASSWORD
printf '\n'
export ADMIN_BOOTSTRAP_EMAIL ADMIN_BOOTSTRAP_PASSWORD
ALLOW_PRODUCTION_ADMIN_BOOTSTRAP=true npm run bootstrap:admin:prod --prefix backend
unset ADMIN_BOOTSTRAP_EMAIL ADMIN_BOOTSTRAP_PASSWORD MONGODB_URI JWT_ACCESS_SECRET CORS_ORIGINS NODE_ENV
```

Use a unique password from a password manager, at least 10 characters including letters and numbers. Existing administrators are preserved; this is not a password-reset command. Remove any temporary workstation IP entry after initialization. Render Free may not offer a shell; the workstation route avoids relying on one. Do not run initialization on every HTTP startup or every deployment.

## Part B — Render backend

### Reproducible Blueprint option

Connect this GitHub repository to a Render Blueprint, select branch `deploy/atlas-vercel-render`, and use root `render.yaml`. Review the proposed single **Free Web Service**. There are no paid databases/disks/workers in it. Set prompted `MONGODB_URI` and `CORS_ORIGINS`; the Blueprint generates a signing secret. Automatic deploy triggers are off. Importing a Blueprint creates services, so perform this yourself when ready.

### Equivalent manual option

Create **New → Web Service**, connect `FixMate-web/FixMate`, and use:

| Field | Value |
| --- | --- |
| Branch | `deploy/atlas-vercel-render` |
| Root directory | `backend` |
| Runtime | Node |
| Plan | Free |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm run start:prod` |
| Health check path | `/api/v1/health` |
| Automatic deployments | Off initially |

Set these environment variables:

```dotenv
NODE_ENV=production
NODE_VERSION=24.21.0
MONGODB_URI=<real Atlas Drivers URI>
CORS_ORIGINS=<exact frontend HTTPS origin>
JWT_ACCESS_SECRET=<unique random secret of at least 32 characters>
JWT_ACCESS_TTL_SECONDS=900
REFRESH_SESSION_TTL_DAYS=7
```

Let Render provide `PORT`; do not hardcode it. The compiled server binds `0.0.0.0`. Build-time dev dependencies are needed for Nest/TypeScript compilation; the production process is `node dist/main`, not a watcher. Do not copy `.env` or `.env.demo.local` to the service.

If the final frontend hostname is not known yet, create the Vercel project first to obtain its assigned production domain (its first build can remain unsuccessful until the backend URL is supplied). Configure that exact origin before opening the application to users. Do not invent a hostname or temporarily use wildcard CORS.

Generate a signing secret yourself when using manual setup:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy it only into the provider secret field. Deploy manually. Logs should show normal Nest route registration and listening on the assigned port. Database failures print generic connectivity advice; check the secret fields privately, never add URI logging. Obtain the actual HTTPS backend URL from Render. Open:

```text
https://<actual-render-host>/api/v1/health
https://<actual-render-host>/api/v1/health/live
```

Readiness returns 200 only while Mongoose is connected, otherwise 503 with safe database state. `/health/live` checks process liveness independently. No credentials or connection details are included. Trust-proxy is restricted to the nearest ingress hop; do not replace it with unrestricted `true`. Verify client-IP/throttling behavior on the actual Render/Vercel chain: shared proxy IPs can conservatively share login rate limits.

### Free-service operating limits

Render Free can sleep after inactivity, causing a slow initial API request. Local storage is ephemeral and restarts lose local files. FixMate currently stores domain data and notifications in MongoDB, and serves bundled frontend assets from Vercel; it has no implemented user-upload persistence dependency. Do not add uploads to the Render filesystem later without a separate storage design. No Redis/BullMQ/SMTP/WebSocket service is required. Email is a development stub and is suppressed in production; no email/SMS delivery or password-reset delivery is promised. Stale booking expiry is triggered by implemented booking service operations, not an independent cron worker. Sleeping services cannot perform continuous jobs. Availability, backups, account quotas and monitoring remain your operating responsibilities.

## Part C — Vercel frontend

1. Import the same GitHub repository as a new Vercel project. Set production branch to `deploy/atlas-vercel-render` (Git/Environments settings as applicable).
2. Set **Root Directory** to `frontend`. Framework preset: **Other**, because this project explicitly emits Vercel Build Output API v3; do not add SSR or a framework-specific adapter. Choose Node **24.x**.
3. `frontend/vercel.json` supplies install `npm ci` and build `npm run build:vercel`. Leave the **Output Directory override disabled**. The build emits `.vercel/output/config.json` and `.vercel/output/static/`, which Vercel consumes directly. The underlying Angular browser output was verified at `frontend/dist/fixmate-frontend/browser/`; the generator copies that directory. Do not set a Next.js output directory or serve the parent `dist` directory.
4. Add **`RENDER_API_ORIGIN`** to the Production build environment. Use the actual Render origin, for example the shape `https://<actual-render-host>`, without trailing slash or API path. It is public routing information. Missing/invalid configuration intentionally fails the Vercel build with an actionable error. No production URL is hardcoded in browser source.
5. Deploy. The build runs Angular's production compiler, then `tools/vercel-output.cjs` writes routing and static output using the real environment value. `/api/v1/*` proxies to Render before filesystem and SPA rules. Other `/api` paths return 404. Existing assets resolve normally; missing chunks/images return 404. Known application routes fall back to `index.html`, preserving deep-link refreshes. There are no Vercel Functions or extra paid services.
6. Visit `/`, `/services`, a real `/services/<slug>`, `/providers`, `/auth/login`, and authenticated dashboard routes directly and refresh each. Verify logo, fonts and photographs. Check that `/images/nonexistent.webp` remains 404 and `/api/v1/health` returns API JSON instead of HTML.
7. Confirm the browser Network panel shows API calls to the **Vercel origin `/api/v1`**, never localhost or a direct cross-site Render URL. The Render destination appears only in generated platform routing config.

For a local packaging check, after supplying the real value in your shell:

```bash
export RENDER_API_ORIGIN='https://<actual-render-host>'
npm run build:vercel --prefix frontend
unset RENDER_API_ORIGIN
```

This builds files only; it does not deploy. Do not commit `.vercel` linkage or output. Both are ignored.

## Part D — Connect and verify authentication

1. Put the actual Render origin in Vercel's `RENDER_API_ORIGIN` and the actual Vercel frontend origin in Render's `CORS_ORIGINS`. Restart/redeploy Render after backend settings change. Rebuild/redeploy Vercel after its build variable changes. Keep old approved origins only during a deliberate domain transition.
2. Use a dedicated test account and inspect the browser cookie after login. `fixmate_rt` must be HttpOnly, Secure, SameSite=Lax, host-only to the frontend, and Path `/api/v1/auth`. It must not be visible in `document.cookie`. No JWT/refresh token belongs in localStorage or sessionStorage.
3. Verify registration, login, customer/provider/admin navigation, catalog search, governorate filtering, service details, provider onboarding/approval, profile updates and existing booking/request flows. Test RBAC with separate accounts, not by editing browser state. A provider needs administrator approval and an offering before appearing publicly.
4. Refresh an authenticated dashboard: in-memory access state is restored through cookie rotation. After access expiry, an authenticated API request should get a fresh session and retry once. Confirm the rotated cookie changes. Logout should clear the cookie and revoke its refresh family; expired/revoked/replayed refresh tokens must fail. Integration tests exercise those cases locally.
5. Render rejects refresh/logout requests without `X-Requested-With: FixMateClient` and, in production, without an allowed Origin or Referer. Vercel forwarding must preserve the browser's origin. Test an invalid Origin and expect 403. Never widen allowed origins to “fix” a broken proxy.
6. Responses from the backend and API proxy use `Cache-Control: no-store`. Inspect actual Vercel headers (`Age`/`x-vercel-cache`) and verify login/refresh/private responses are not reused across accounts. Do not enable external rewrite caching for API/session paths.
7. Repeat in current Chrome, Firefox and Safari, including third-party-cookie blocking/private modes. The selected proxy uses first-party cookies, avoiding a dependency on third-party-cookie permission. The local HTTPS smoke check enables Chrome's third-party-cookie phaseout switch; actual platform and other-browser checks remain pending.

Do not replace the proxy with a direct `vercel.app → onrender.com` browser API URL while leaving Lax cookies. Those are different sites. A direct cross-site alternative would require Secure/SameSite=None cookies, credentialed requests and explicit origin protections, **and can still fail when third-party cookies are blocked**. This branch intentionally uses the proxy and keeps Lax. Custom same-site domains are another future option; no DNS purchase is needed for the proxy setup.

Preview deployments have distinct origins. Do not broadly trust every `*.vercel.app` site or automatically connect arbitrary previews to production data. Enable only explicit approved origins, preferably against an isolated test backend/database. Keep deployment protection and account access appropriate to your project.

## Part E — Troubleshooting

| Symptom | Practical checks |
| --- | --- |
| MongoDB server selection fails | Check actual Render outbound CIDRs in Atlas Network Access, cluster status, URI database path and database-user permissions. Check each range; do not use frontend client IPs. |
| Authentication failed in MongoDB | Use an Atlas **database** user, not your Atlas website login. Check password encoding and authSource options from the Drivers URI. Rotate a suspected exposed password. |
| SRV/DNS error | Check the copied cluster hostname and DNS/SRV availability from the connecting environment. Do not disable TLS or hardcode a discovered cluster IP. |
| TLS/certificate error | Use the Drivers SRV URI and supported Node version; inspect local DNS/network interception and clock. Do not set invalid-certificate bypass flags. |
| Backend fails before listening | Check required variables and Node 24.21.0. Production rejects missing CORS origins, HTTP/localhost/wildcard origins and example/short signing secrets. |
| Render cannot find dist/main | Root must be `backend`; run the documented build with dev dependencies included, then `npm run start:prod`. Do not start a watcher. |
| Port/health failure | Let Render supply PORT; server binds 0.0.0.0. Health path includes `/api/v1`. A 503 means database readiness failed; `/health/live` only proves the process runs. |
| Empty service catalog | Run the catalog seed against the same Atlas database, after creating indexes; verify active catalog records. Do not seed demonstration providers. |
| Duplicate key/index error | Inspect existing data and declared schema indexes. Resolve duplicates through an explicit migration; the initialization command never drops indexes. |
| CORS error or refresh 403 | Allow the exact frontend origin without slash/path. Check Origin/Referer forwarding and `X-Requested-With`. Never combine wildcard CORS with credentials. |
| Cookie not stored or reload logs out | Confirm HTTPS and proxy requests to frontend `/api/v1`, cookie host/path/Secure/Lax, no Domain attribute, and no cached Set-Cookie response. Direct cross-site requests are unsupported by this configuration. |
| Refresh 401 after rotation | Check expiry/revocation and whether an old token was replayed. Replaying revokes its family by design. Sign in again; do not disable replay detection. Avoid parallel refreshes across independent tabs with stale cookie state. |
| Logout during network failure | Server revocation cannot complete while offline. Restore connectivity and retry; clear the site cookie if necessary. Access tokens expire naturally, and account suspension is checked by the server. |
| Vercel build says RENDER_API_ORIGIN invalid | Set it for the environment being built; use an HTTPS origin only. Angular does not read arbitrary API_BASE_URL variables. Redeploy after changes. |
| Vercel page refresh 404 | Root is frontend, framework Other, build:vercel command, output override off. Inspect `.vercel/output/config.json` and ensure deployment contains Build Output API output. |
| API response is HTML | Verify `/api/v1` routing precedes SPA handling; do not add a global catch-all above API routes. Check the Render origin and API prefix. |
| Missing asset/chunk | Confirm output includes Angular's browser directory and hashed assets. Redeploy the complete build; missing assets should remain 404. |
| Node/build dependency failure | Run npm ci with lockfiles, Node 24.x and npm 11; backend compilation needs dev dependencies. Inspect the first compiler error rather than hiding it. |
| Login 429 | Wait for the rate window and inspect the real ingress/client IP behavior. Nearest-proxy trust is conservative; do not trust arbitrary forwarded headers. |
| Slow first request | Render Free cold start can delay health/auth/catalog. Retry once the backend is awake; do not manufacture success or keep a paid worker running without a decision. |

## Security and live release gates

No real `.env` files are tracked; available Git history contains only environment examples. Current source/history scans found no apparent real credential exposure, but this is not proof against every possible secret. Rotate any credential you know was shared or committed; history was not rewritten. Production admin bootstrap remains opt-in and has no public route. The refresh-family insertion/revocation race found during this audit is fixed and covered by deterministic replay and logout tests.

The Multer transitive dependency is pinned to patched 2.5.0 to address [GHSA-q7qp-rjg7-q26m](https://github.com/advisories/GHSA-q7qp-rjg7-q26m). The remaining low-severity deepmerge advisory affects backend build/test tooling; [the upstream advisory lists no patch](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). Do not force an unrelated Jest/Nest major downgrade to silence audit output. Recheck advisories before release.

Before making the site public: ensure indexes/catalog/admin are initialized, verify real Atlas connectivity, verify actual Vercel forwarding/cookie/cache behavior in multiple browsers, exercise approved-provider booking/request flows, and review your account quotas and monitoring. Contact/support details, Terms and Privacy wording are product-owner publication decisions; do not assume the application supplies legal policies or an operated support channel.

Official references checked for this guide: [Atlas connection setup](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/), [Atlas troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/), [Render Web Services](https://render.com/docs/web-services), [Render outbound addresses](https://render.com/docs/outbound-ip-addresses), [Render Node selection](https://render.com/docs/node-version), [Render health checks](https://render.com/docs/health-checks), [Render Free limits](https://render.com/docs/free), [Blueprint specification](https://render.com/docs/blueprint-spec), [Vercel Build Output API](https://vercel.com/docs/build-output-api), [Vercel routing output](https://vercel.com/docs/build-output-api/configuration), [Vercel cache controls](https://vercel.com/docs/caching/cache-control-headers). Provider UIs and plans can change; use these primary references when a label differs.
