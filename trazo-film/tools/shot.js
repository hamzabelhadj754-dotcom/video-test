// node tools/shot.js <page.html> <out.png> [scale] [query]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [page_, out, scale = 1, q = ''] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: Number(scale) });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(page_) + (q ? '?' + q : ''));
  await p.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
  await p.screenshot({ path: out }); await b.close();
})();
