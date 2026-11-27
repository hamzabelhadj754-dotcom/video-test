// browser.js: a tiny static server for the project and a Playwright page with the film loaded.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp' };

function serve() {
  return new Promise(ok => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    }).listen(0, '127.0.0.1', () => ok(srv));
  });
}

// GPU=1 uses the real GPU (Windows: d3d11). Without it, Chromium's software GL is used.
async function openFilm() {
  const srv = await serve();
  const args = process.env.GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
  const browser = await chromium.launch({ args });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1152 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/film/index.html`);
  const ok = await page.evaluate(() => window.filmReady);
  if (!ok) throw new Error(await page.evaluate(() => window.filmError));
  const renderer = await page.evaluate(() => { const gl = window.film.gl, d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  return { page, browser, srv, renderer, close: async () => { await browser.close(); srv.close(); } };
}
module.exports = { openFilm, ROOT };
