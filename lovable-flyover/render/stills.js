// stills.js: node render/stills.js [t ...]  → film/stills/still_XX.XXs.png
const path = require('path'), fs = require('fs');
const { openFilm, ROOT } = require('./browser');
(async () => {
  const times = process.argv.slice(2).map(Number);
  const T = times.length ? times : [0, 1.6, 2.5, 5, 6.5, 9.3, 11];
  const sub = Number(process.env.SUB || 16);
  const out = path.join(ROOT, 'film', 'stills'); fs.mkdirSync(out, { recursive: true });
  const f = await openFilm(); console.log('renderer:', f.renderer);
  for (const t of T) {
    const t0 = Date.now();
    const r = await f.page.evaluate(([t, sub]) => window.film.seek(t, { subframes: sub }), [t, sub]);
    const file = path.join(out, `still_${t.toFixed(2).padStart(5, '0')}s.png`);
    await f.page.locator('#c').screenshot({ path: file });
    console.log(file, `focus ${r.focus.toFixed(0)}`, `${Date.now() - t0}ms`);
  }
  await f.close();
})().catch(e => { console.error(e); process.exit(1); });
