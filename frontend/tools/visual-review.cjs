// Run from the repository root with the Angular and Nest development servers running.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const output = path.resolve('artifacts/visual');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1792, height: 864 } });
  page.setDefaultTimeout(10000);
  const report = { errors: [], widths: [], interactions: [], destinations: [] };
  page.on('pageerror', (e) => report.errors.push(e.message));
  const ready = async () => {
    await page.waitForTimeout(350);
    await page.evaluate(() => document.fonts.ready);
  };
  const openHome = async () => {
    await page.goto('http://localhost:4200');
    await page.locator('.portrait-service-card').first().waitFor();
    await ready();
  };
  const language = async (lang) => {
    if ((await page.locator('html').getAttribute('lang')) === lang) return;
    const mobile = page.viewportSize().width <= 960;
    if (mobile) await page.locator('.menu-toggle').click();
    await page
      .locator('.language-button')
      .filter({ hasText: lang === 'en' ? 'English' : 'العربية' })
      .click();
    if (mobile) await page.locator('.menu-toggle').click();
    await ready();
  };
  const loadImages = async () => {
    for (const selector of [
      '.area-discovery-section',
      '.explore-projects-section',
      '.resources-editorial-section',
      '.site-footer',
    ]) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await ready();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await ready();
  };
  await openHome();
  await language('en');
  // Inspect actual catalog-backed filters, project themes, and guide dialog.
  await page.locator('.cat-icon-tab').filter({ hasText: 'Plumbers' }).click();
  await ready();
  assert.equal(await page.locator('.portrait-service-card').count(), 2);
  assert(
    (await page.locator('.portrait-service-card').first().getAttribute('href')).includes(
      'water-leak-detection-repair',
    ),
  );
  await page.locator('.cat-icon-tab').filter({ hasText: 'Featured' }).click();
  await ready();
  report.interactions.push('Service categories change actual catalog-backed cards');
  for (const tab of await page.locator('.explore-tab-btn').all()) {
    await tab.click();
    await ready();
    assert.equal(await tab.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.supporting-project-card').count(), 3);
  }
  await page.locator('.explore-tab-btn').first().click();
  report.interactions.push('All four project themes change banners, cards, and destinations');
  for (const card of await page.locator('.resource-editorial-card').all()) {
    await card.click();
    assert.equal(await page.locator('dialog').evaluate((e) => e.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').evaluate((e) => e.open), false);
  }
  report.interactions.push('All resource dialogs open and close with Escape');
  await page.evaluate(() => window.scrollTo(0, 0));
  await ready();
  await page.locator('.explore-trigger').click();
  let bounds = await page.locator('.explore-mega-menu').boundingBox();
  assert(bounds.x >= 0 && bounds.x + bounds.width <= 1792);
  await page.locator('.explore-cat-item').filter({ hasText: 'Painting' }).hover();
  await ready();
  assert((await page.locator('.explore-service-list').innerText()).includes('Painting'));
  await page.keyboard.press('Escape');
  await ready();
  assert.equal(
    await page.locator('.explore-trigger').evaluate((e) => e === document.activeElement),
    true,
  );
  await page.locator('.explore-trigger').click();
  await page.locator('.explore-backdrop').click({ position: { x: 10, y: 500 } });
  await ready();
  assert.equal(await page.locator('.explore-mega-menu').count(), 0);
  report.interactions.push(
    'Explore hover, keyboard Escape/focus return, and outside-click closing',
  );
  // Verify every editorial service link against the real API, without fixture data.
  const links = await page
    .locator('a[href^="/services/"]')
    .evaluateAll((es) => [...new Set(es.map((e) => e.getAttribute('href')))]);
  for (const href of links) {
    const response = await page.request.get('http://localhost:3000/api/v1' + href);
    report.destinations.push({ href, status: response.status() });
    assert.equal(response.status(), 200);
  }
  // Full-page evidence requires scrolling to load the actual lazy images.
  for (const lang of ['en', 'ar']) {
    console.log('MATRIX', lang);
    await language(lang);
    for (const width of [1920, 1792, 1440, 1280, 1024, 768, 390, 360]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 864 });
      await loadImages();
      const metrics = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
        broken: [...document.images]
          .filter((i) => !i.complete || !i.naturalWidth)
          .map((i) => i.src),
      }));
      report.widths.push({ lang, width, ...metrics });
      assert(metrics.scroll <= width, `${lang} ${width} has horizontal overflow`);
      assert.deepEqual(metrics.broken, []);
      await page.screenshot({
        path: path.join(output, `after-${lang}-${width}.png`),
        fullPage: true,
      });
      if (width === 1792 && lang === 'en') {
        await page.screenshot({ path: path.join(output, 'after-hero.png') });
        for (const [selector, name] of [
          ['.area-discovery-section', 'services'],
          ['.explore-projects-section', 'projects'],
          ['.resources-editorial-section', 'resources'],
        ]) {
          await page.locator(selector).screenshot({ path: path.join(output, `after-${name}.png`) });
        }
      }
    }
  }
  console.log('MOBILE INTERACTIONS');
  await page.setViewportSize({ width: 390, height: 844 });
  await language('en');
  await page.evaluate(() => window.scrollTo(0, 0));
  await ready();
  await page.locator('.menu-toggle').click();
  await page.locator('.explore-trigger').click();
  await page.locator('.explore-cat-item').filter({ hasText: 'Home & Tank Cleaning' }).click();
  await ready();
  assert((await page.locator('.explore-service-list').innerText()).includes('Cleaning'));
  await page.locator('.menu-toggle').click();
  report.interactions.push('Mobile menu and category submenu');
  console.log('SEARCH');
  await page.locator('#discover-service').fill('leak');
  await page.locator('.suggestion-item').first().waitFor();
  await page.locator('#discover-location').selectOption('Irbid');
  await page.locator('.find-pro-btn').first().click();
  await ready();
  assert(page.url().includes('q=leak') && page.url().includes('governorate=Irbid'));
  assert((await page.locator('a[href*="water-leak-detection-repair"]').count()) > 0);
  await page.screenshot({ path: path.join(output, 'after-search-mobile.png'), fullPage: true });
  report.interactions.push(
    'Live search suggestions and search results retain query and governorate',
  );
  for (const url of [
    '/services',
    '/services/water-leak-detection-repair',
    '/providers',
    '/auth/login',
    '/auth/register',
    '/auth/register?role=PROVIDER',
    '/dashboard/requests',
  ]) {
    await page.goto('http://localhost:4200' + url);
    await ready();
    await page.locator('h1').first().waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({
      path: path.join(output, 'page-' + url.replace(/[^a-z0-9]+/gi, '-') + '.png'),
      fullPage: true,
    });
  }
  report.interactions.push(
    'Catalog, service detail, provider empty state, login, signup, provider signup, protected request route',
  );
  assert.deepEqual(report.errors, []);
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
