// node render.js <outDir> [fps] [t1,t2,...]   (serve this folder's parent kit/ on :8765 first)
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], fps = +(process.argv[3] || 30), only = process.argv[4];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto('http://127.0.0.1:8765/motion-test/' + (process.env.PAGE || 'index.html'));
  await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const dur = await p.evaluate(() => window.DURATION);
  const times = only ? only.split(',').map(Number) : Array.from({ length: Math.round(dur * fps) }, (_, i) => i / fps);
  const el = await p.$('#stage');
  for (let i = 0; i < times.length; i++) {
    const f = Math.round(times[i] * fps);
    await p.evaluate(([t, f]) => window.renderAt(t, f), [times[i], f]);
    await el.screenshot({ path: `${out}/f_${String(only ? i : f).padStart(4, '0')}.png` });
    if (i % 30 === 0) console.log('frame', i, '/', times.length);
  }
  await b.close();
})();
