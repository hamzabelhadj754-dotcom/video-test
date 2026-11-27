// profile.js: time the stages of one frame
const { openFilm } = require('./browser');
(async () => {
  const f = await openFilm(); console.log('renderer:', f.renderer);
  const t = Number(process.argv[2] || 2.5);
  for (const sub of [1, 1, 4]) {
    const r = await f.page.evaluate(([t, sub]) => { const t0 = performance.now(); window.film.seek(t, { subframes: sub }); window.film.gl.finish(); window.film.readFrame(); return performance.now() - t0; }, [t, sub]);
    console.log(`subframes ${sub}: ${r.toFixed(0)} ms`);
  }
  await f.close();
})();
