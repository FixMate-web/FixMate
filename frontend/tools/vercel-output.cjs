const fs = require('node:fs');
const path = require('node:path');

function routingConfig(rawOrigin) {
  let origin;
  try { origin = new URL(rawOrigin); } catch {
    throw new Error('RENDER_API_ORIGIN must be the HTTPS origin of your Render backend.');
  }
  if (origin.protocol !== 'https:' || origin.origin !== rawOrigin || origin.username || origin.password ||
      ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) || origin.hostname.endsWith('.invalid')) {
    throw new Error('RENDER_API_ORIGIN must be an exact public HTTPS origin without a path, trailing slash, credentials or query.');
  }
  return {
    version: 3,
    routes: [
      { src: '/api/v1(?:/(.*))?$', dest: `${origin.origin}/api/v1/$1`, headers: { 'Cache-Control': 'no-store' } },
      // Reserve every other API path so API mistakes cannot return the Angular shell.
      { src: '/api(?:/.*)?$', status: 404 },
      { handle: 'filesystem' },
      // Only application routes fall back to the shell; missing images/chunks remain 404.
      { src: '/(?:services|providers|about|faq|contact|auth|dashboard)(?:/[^.]*)?/?$', dest: '/index.html' },
    ],
  };
}

function writeOutput(rawOrigin) {
  const config = routingConfig(rawOrigin);
  const root = path.resolve(__dirname, '..');
  const browser = path.join(root, 'dist/fixmate-frontend/browser');
  if (!fs.existsSync(path.join(browser, 'index.html'))) throw new Error('Run the Angular production build first.');
  const output = path.join(root, '.vercel/output');
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  fs.cpSync(browser, path.join(output, 'static'), { recursive: true });
  fs.writeFileSync(path.join(output, 'config.json'), JSON.stringify(config, null, 2) + '\n');
  console.log('Prepared Angular CSR assets and same-origin API routing in .vercel/output.');
}

module.exports = { routingConfig, writeOutput };
if (require.main === module) {
  try { writeOutput(process.env.RENDER_API_ORIGIN); } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
