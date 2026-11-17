// node tools/probe.js <page> <outdir> t1 t2 ...  — screenshots at given times in one session
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [page_, dir, ...ts] = process.argv.slice(2); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
  await p.goto('file://' + path.resolve(page_)); await p.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
  for (const t of ts) { const s = Date.now(); await p.evaluate(t => { window.seek(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, Number(t)); await p.screenshot({ path: `${dir}/t${String(t).padStart(5, '0')}.png` }); console.log(t, Date.now() - s, 'ms'); }
  await b.close();
})();
