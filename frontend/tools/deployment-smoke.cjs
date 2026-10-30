// Local production-mode integration check. Uses only a new loopback MongoDB test database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const https = require('node:https');
const { spawn, spawnSync, execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { chromium } = require('@playwright/test');
const { routingConfig, writeOutput } = require('./vercel-output.cjs');
const root = path.resolve(__dirname, '../..');
const backend = path.join(root, 'backend');
const mongo = require(path.join(backend, 'node_modules/mongoose'));
const database = `fixmate_deployment_smoke_${process.pid}`;
const mongoUri = `mongodb://127.0.0.1:27017/${database}`;
const origin = 'https://fixmate.test:4343';
const password = `Fixture9${randomBytes(18).toString('hex')}`;
const env = { ...process.env, NODE_ENV: 'production', PORT: '3131', MONGODB_URI: mongoUri,
  CORS_ORIGINS: origin, JWT_ACCESS_SECRET: randomBytes(48).toString('hex'), JWT_ACCESS_TTL_SECONDS: '60',
  ALLOW_PRODUCTION_ADMIN_BOOTSTRAP: 'true', ADMIN_BOOTSTRAP_EMAIL: 'admin@smoke.example.com', ADMIN_BOOTSTRAP_PASSWORD: password };
const report = { routes: [], roles: [], errors: [], failedAssets: [], consoleErrors: [], checks: [] };
let api, server, browser, temporary;
const log = [];
function cli(file) {
  const result = spawnSync(process.execPath, [file], { cwd: backend, env, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Test preparation failed: ${path.basename(file)}`);
}
async function apiFetch(page, route, body, token, requestOrigin) {
  return page.evaluate(async ({ route, body, token, requestOrigin }) => {
    const response = await fetch('/api/v1' + route, { method: body === undefined ? 'GET' : 'POST',
      credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'FixMateClient',
        ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(requestOrigin ? { Origin: requestOrigin } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
  }, { route, body, token, requestOrigin });
}
(async () => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmate-smoke-'));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(temporary, 'key.pem'),
    '-out', path.join(temporary, 'cert.pem'), '-days', '1', '-subj', '/CN=fixmate.test'], { stdio: 'ignore' });
  cli('dist/scripts/ensure-indexes.js');
  cli('dist/scripts/seed-catalog.js');
  cli('dist/scripts/bootstrap-admin.js');
  const conn = await mongo.createConnection(mongoUri).asPromise();
  const collections = await conn.db.listCollections().toArray();
  for (const name of ['users', 'refresh_sessions', 'provider_slots', 'bookings', 'project_requests']) {
    assert(collections.some(c => c.name === name), `missing initialized collection ${name}`);
  }
  const slots = await conn.db.collection('provider_slots').indexes();
  assert(slots.some(i => i.unique && i.key.providerProfileId && i.key.slotStartUtc));
  await conn.close();
  report.checks.push('production index initialization, slot uniqueness and catalog seed');
  api = spawn(process.execPath, ['dist/main.js'], { cwd: backend, env, stdio: ['ignore', 'pipe', 'pipe'] });
  api.stdout.on('data', data => log.push(String(data))); api.stderr.on('data', data => log.push(String(data)));
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch('http://127.0.0.1:3131/api/v1/health')).ok) break; } catch {}
    if (api.exitCode !== null) throw new Error('Production backend failed startup');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  const health = await fetch('http://127.0.0.1:3131/api/v1/health');
  assert.equal(health.status, 200); assert.equal((await health.json()).database.status, 'connected');
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch('http://127.0.0.1:3131/api/v1/health/live')).status, 200);
  writeOutput('https://api.example.com'); // Reserved test fixture, never a deployment destination.
  const config = routingConfig('https://api.example.com');
  const staticRoot = path.join(root, 'frontend/.vercel/output/static');
  // Emulate the generated Vercel route order locally; actual Vercel forwarding is a live gate.
  server = https.createServer({ key: fs.readFileSync(path.join(temporary, 'key.pem')), cert: fs.readFileSync(path.join(temporary, 'cert.pem')) }, (req, res) => {
    const pathname = new URL(req.url, origin).pathname;
    if (new RegExp(`^${config.routes[0].src}`).test(pathname)) {
      const upstream = http.request({ hostname: '127.0.0.1', port: 3131, path: req.url, method: req.method,
        headers: { ...req.headers, host: '127.0.0.1:3131' } }, response => {
        res.writeHead(response.statusCode, response.headers); response.pipe(res);
      });
      upstream.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(upstream); return;
    }
    if (new RegExp(`^${config.routes[1].src}`).test(pathname)) { res.writeHead(404); res.end(); return; }
    let file = path.resolve(staticRoot, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(staticRoot + path.sep)) { res.writeHead(404); res.end(); return; }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      if (new RegExp(`^${config.routes[3].src}`).test(pathname)) file = path.join(staticRoot, 'index.html');
      else { res.writeHead(404); res.end(); return; }
    }
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(4343, '127.0.0.1', resolve));
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--no-proxy-server', '--host-resolver-rules=MAP fixmate.test 127.0.0.1', '--test-third-party-cookie-phaseout'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) report.consoleErrors.push(message.text());
  });
  page.on('response', response => {
    if (!response.url().endsWith('/images/missing.webp') && /\.(webp|woff2|js|css)(\?|$)/.test(response.url()) && response.status() >= 400) report.failedAssets.push(response.url());
  });
  const screenshots = path.join(root, 'artifacts/deployment'); fs.mkdirSync(screenshots, { recursive: true });
  for (const route of ['/', '/services', '/services/emergency-plumbing', '/providers', '/about', '/faq', '/contact', '/auth/login']) {
    assert.equal((await page.goto(origin + route)).status(), 200);
    await page.locator('h1').first().waitFor();
    await page.reload(); await page.locator('h1').first().waitFor(); report.routes.push(route);
  }
  await page.goto(origin);
  assert.equal(await page.locator('.hero-caption-pill').count(), 0);
  assert.equal(await page.locator('.discovery-transition').count(), 1);
  await page.screenshot({ path: path.join(screenshots, 'production-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(screenshots, 'production-mobile.png') });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const services = await apiFetch(page, '/services?q=plumbing&limit=4');
  assert.equal(services.status, 200); assert(services.body.items.length > 0);
  assert.equal((await apiFetch(page, '/providers?governorate=IRBID')).status, 200);
  for (const role of ['CUSTOMER', 'PROVIDER', 'ADMIN']) {
    await context.clearCookies();
    const email = `${role.toLowerCase()}@smoke.example.com`;
    if (role !== 'ADMIN') {
      await page.goto(origin + '/auth/register');
      await page.locator('#register-name').fill('Browser Fixture');
      await page.locator('#register-email').fill(email);
      await page.locator('#register-password').fill(password);
      await page.locator('#register-role').selectOption(role);
      await page.locator('button[type=submit]').click();
      await page.waitForURL(`**/dashboard/${role.toLowerCase()}`);
      await apiFetch(page, '/auth/logout', {});
    }
    await page.goto(origin + '/auth/login');
    await page.locator('#login-email').fill(email); await page.locator('#login-password').fill(password);
    await page.locator('button[type=submit]').click();
    await page.waitForURL(`**/dashboard/${role.toLowerCase()}`);
    const cookie = (await context.cookies()).find(c => c.name === 'fixmate_rt');
    assert(cookie && cookie.httpOnly && cookie.secure && cookie.sameSite === 'Lax' && cookie.path === '/api/v1/auth');
    await page.reload(); await page.waitForURL(`**/dashboard/${role.toLowerCase()}`);
    await page.locator('.dashboard-layout, .dashboard-shell, main').first().waitFor();
    const refresh = await apiFetch(page, '/auth/refresh', {}); assert.equal(refresh.status, 200);
    assert.equal((await apiFetch(page, '/users/me', undefined, refresh.body.accessToken)).status, 200);
    assert.equal((await apiFetch(page, '/admin/overview', undefined, refresh.body.accessToken)).status, role === 'ADMIN' ? 200 : 403);
    assert.notEqual((await context.cookies()).find(c => c.name === 'fixmate_rt').value, cookie.value);
    assert.equal((await apiFetch(page, '/auth/logout', {})).status, 200);
    assert.equal((await apiFetch(page, '/auth/refresh', {})).status, 401);
    report.roles.push(role);
  }
  assert.equal(await page.evaluate(async () => (await fetch('/images/missing.webp')).status), 404);
  assert.equal(await page.evaluate(async () => (await fetch('/api/v2/missing')).status), 404);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedAssets, []); assert.deepEqual(report.consoleErrors, []);
  assert(!log.join('').includes(env.JWT_ACCESS_SECRET)); assert(!log.join('').includes(mongoUri));
  report.checks.push('production startup, health and no-store', 'route refresh and static assets', 'catalog search and governorate filter', 'registration and login UI and three role dashboards', 'Secure HttpOnly cookie, reload, rotation, RBAC and logout', 'same-origin cookies with third-party-cookie phaseout enabled');
  fs.writeFileSync(path.join(screenshots, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (api && api.exitCode === null) { api.kill('SIGTERM'); await new Promise(resolve => api.once('exit', resolve)); }
  const connection = await mongo.createConnection(mongoUri, { serverSelectionTimeoutMS: 2000 }).asPromise();
  try { await connection.dropDatabase(); } finally { await connection.close(); }
  if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
});
