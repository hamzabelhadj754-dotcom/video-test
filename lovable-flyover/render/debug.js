// debug.js t → film/stills/debug_<mode>.png for modes 1..4 (coc, search radius, near alpha, depth)
const path = require('path');
const { openFilm, ROOT } = require('./browser');
(async () => {
  const f = await openFilm(); const t = Number(process.argv[2] || 11);
  for (const m of (process.env.MODES || '1,2,3,4').split(',').map(Number)) {
    await f.page.evaluate(([t, m]) => window.film.seek(t, { subframes: 1, debug: m }), [t, m]);
    await f.page.locator('#c').screenshot({ path: path.join(ROOT, 'film', 'stills', `debug_${m}.png`) });
  }
  await f.close();
})();
