const { test } = require('node:test');
const assert = require('node:assert/strict');
const { routingConfig } = require('./vercel-output.cjs');

test('rejects missing, insecure, local and malformed proxy destinations', () => {
  for (const origin of [undefined, '', 'http://api.example.com', 'https://localhost', 'https://api.example.com/', 'https://api.example.com/api/v1', 'https://user:password@api.example.com', 'https://api.example.com?q=x']) {
    assert.throws(() => routingConfig(origin), /RENDER_API_ORIGIN/);
  }
});

test('routes API before assets and SPA routes without serving missing files as HTML', () => {
  const config = routingConfig('https://api.example.com');
  const [api, reserved, filesystem, spa] = config.routes;
  const rewrite = pathname => pathname.replace(new RegExp(`^${api.src}`), api.dest);
  assert.equal(config.version, 3);
  assert.equal(rewrite('/api/v1/auth/refresh'), 'https://api.example.com/api/v1/auth/refresh');
  assert.equal(rewrite('/api/v1/services'), 'https://api.example.com/api/v1/services');
  assert.equal(api.headers['Cache-Control'], 'no-store');
  assert.equal(reserved.status, 404);
  assert.equal(filesystem.handle, 'filesystem');
  for (const route of ['/services', '/services/emergency-plumbing', '/dashboard/customer', '/auth/login', '/providers/abc']) {
    assert.match(route, new RegExp(`^${spa.src}`));
  }
  for (const asset of ['/images/missing.webp', '/chunk-missing.js', '/fonts/missing.woff2', '/api/v2/services']) {
    assert.doesNotMatch(asset, new RegExp(`^${spa.src}`));
  }
});
