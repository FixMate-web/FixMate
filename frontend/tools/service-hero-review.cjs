// Run from the repository root with the existing local frontend/backend running.
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve('artifacts/service-heroes');
const ids = ['cleaning', 'plumbing', 'electrical', 'air-conditioning', 'furniture-moving', 'interior-painting', 'garden-maintenance'];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const report = { errors: [], brokenAssets: [], slides: [], viewports: [], motion: [], initialRequests: [], performance: [] };
  const language = async (page, target) => {
    if (await page.locator('html').getAttribute('lang') === target) return;
    const toggle = page.locator('.menu-toggle');
    if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
    await page.locator('.language-button').filter({ hasText: target === 'en' ? 'English' : 'العربية' }).click();
    if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
  };
  const makePage = async (lang, width, height, motion = 'no-preference', dpr = 1) => {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: motion, deviceScaleFactor: dpr });
    page.setDefaultTimeout(14000);
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('response', r => { if (r.url().includes('/images/hero/') && r.status() >= 400) report.brokenAssets.push(r.url()); });
    await page.addInitScript(() => {
      window.heroMetrics = { lcp: 0, shifts: 0 };
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.heroMetrics.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.heroMetrics.shifts += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    const requested = [];
    page.on('request', r => { if (r.url().includes('/images/hero/')) requested.push(r.url()); });
    await page.goto('http://localhost:4200');
    await page.locator('.hero-slide.active').waitFor();
    await language(page, lang);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.hero-slide.active').getAttribute('data-slide'), 'cleaning');
    assert(requested.every(url => url.includes('hero-cleaning')));
    report.initialRequests.push({ lang, width, requested: [...requested] });
    await page.evaluate(() => {
      window.heroSamples = [];
      window.heroSampleTimer = setInterval(() => {
        const foreground = document.querySelector('.hero-left-col').getBoundingClientRect();
        window.heroSamples.push({
          foreground: { x: foreground.x, y: foreground.y, width: foreground.width, height: foreground.height },
          frames: [...document.querySelectorAll('.hero-slide')].map(img => ({
            id: img.dataset.slide, slot: img.dataset.slot, opacity: +getComputedStyle(img).opacity,
            scale: new DOMMatrix(getComputedStyle(img).transform).a,
            mirrored: getComputedStyle(img).scale,
            loaded: img.complete && img.naturalWidth > 0,
          })),
        });
      }, 80);
    });
    return page;
  };

  // Observe natural seven-second scheduling in LTR, RTL and high-DPR mobile concurrently.
  const configs = [{ lang: 'en', width: 1792, height: 864 }, { lang: 'ar', width: 1792, height: 864 }, { lang: 'en', width: 390, height: 844, dpr: 2 }];
  const pages = await Promise.all(configs.map(c => makePage(c.lang, c.width, c.height, 'no-preference', c.dpr || 1)));
  await Promise.all(pages.map(async (page, index) => {
    const config = configs[index];
    const foreground = await page.locator('.hero-left-col').boundingBox();
    for (const id of [...ids, ids[0]]) {
      await page.waitForFunction(id => document.querySelector('.hero-slide.active')?.dataset.slide === id, id);
      await page.waitForTimeout(1350);
      const image = await page.locator('.hero-slide.active').evaluate(img => ({ id: img.dataset.slide, source: img.currentSrc, loaded: img.complete && img.naturalWidth > 0, opacity: +getComputedStyle(img).opacity, mirrored: getComputedStyle(img).scale }));
      assert(image.loaded && image.opacity === 1);
      assert(image.source.includes('hero-' + id));
      assert.equal(await page.locator('.hero-caption-pill').count(), 0);
      assert.equal(await page.locator('.discovery-transition').count(), 1);
      assert.equal(image.mirrored, config.lang === 'ar' ? '-1 1' : 'none');
      assert.deepEqual(await page.locator('.hero-left-col').boundingBox(), foreground);
      const file = `${config.lang}-${config.width}-${id}.png`;
      await page.screenshot({ path: path.join(output, file) });
      report.slides.push({ ...config, id, image, screenshot: file });
    }
    const samples = await page.evaluate(() => { clearInterval(window.heroSampleTimer); return window.heroSamples; });
    let resets = 0, enlarged = false; const previous = new Map();
    for (const sample of samples) {
      assert.deepEqual(sample.foreground, foreground);
      assert(sample.frames.some(f => f.opacity > 0 && f.loaded));
      for (const frame of sample.frames) {
        const key = frame.id + frame.slot, old = previous.get(key);
        if (old && old.opacity > .01 && frame.opacity > .01 && frame.scale + .00001 < old.scale) resets++;
        if (frame.opacity > .5 && frame.scale > 1.06) enlarged = true;
        previous.set(key, frame);
      }
    }
    assert.equal(resets, 0); assert(enlarged);
    report.motion.push({ ...config, samples: samples.length, visibleScaleResets: resets, enlarged, foregroundStable: true, wraparound: true });
    report.performance.push({ ...config, ...await page.evaluate(() => window.heroMetrics) });
  }));
  for (const page of pages) await page.close();

  // Verify reduced-motion and the requested crop/layout widths in both directions.
  const still = await makePage('en', 1792, 864, 'reduce');
  for (const lang of ['en', 'ar']) {
    await language(still, lang);
    for (const width of [360, 390, 768, 1024, 1440, 1792]) {
      await still.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await still.waitForTimeout(120);
      const geometry = await still.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert(geometry.scrollWidth <= width);
      assert.equal(await still.locator('.hero-slide.active').getAttribute('data-slide'), 'cleaning');
      await still.screenshot({ path: path.join(output, `responsive-${lang}-${width}.png`) });
      report.viewports.push({ lang, width, ...geometry });
    }
  }
  await still.waitForTimeout(7200);
  assert.equal(await still.locator('.hero-slide').count(), 1);
  assert.equal(await still.locator('.hero-slide.active').getAttribute('data-slide'), 'cleaning');
  assert.deepEqual(report.errors, []); assert.deepEqual(report.brokenAssets, []);
  fs.writeFileSync(path.join(output, 'browser-verification.json'), JSON.stringify(report, null, 2));
  console.log('PASS: seven scenes + natural wraparound in desktop LTR, RTL and mobile; 12 responsive checks; reduced motion; no visible zoom resets or broken hero assets.');
  console.log(JSON.stringify(report.motion));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
