// render.js: render the film to H.264 through ffmpeg. Every frame is seek(t) → readPixels → raw RGBA pipe.
// node render/render.js --out out.mp4 [--fps 60] [--sub 16] [--start 0] [--end N] [--fast]
const { spawn } = require('child_process');
const { openFilm } = require('./browser');
const S = { fps: 60, sub: 16, start: 0, end: -1, out: 'film.mp4', fast: false, page: false };
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i].replace(/^--/, '');
  if (k === 'fast' || k === 'page') S[k] = true; else S[k] = isNaN(process.argv[i + 1]) ? process.argv[++i] : Number(process.argv[++i]);
}
const DURATION = 14.5, W = 1440, H = 1152;
(async () => {
  const total = Math.round(DURATION * S.fps), end = S.end < 0 ? total : Math.min(S.end, total);
  const f = await openFilm(); console.log('renderer:', f.renderer, `| frames ${S.start}-${end - 1} @${S.fps}fps, ${S.sub} subframes${S.fast ? ', fast (no DOF)' : ''}`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(S.fps), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', S.fast ? 'veryfast' : 'slow', '-crf', S.fast ? '20' : '12',
    '-tune', 'film', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', S.out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let n = S.start; n < end; n++) {
    const t = n / S.fps;
    const b64 = await f.page.evaluate(([t, sub, fast, page]) => { window.film.seek(t, { subframes: sub, debug: fast ? 7 : 0, page }); return window.film.readFrameB64(); }, [t, S.sub, S.fast, S.page]);
    const buf = Buffer.from(b64, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (n % 20 === 0 || n === end - 1) {
      const done = n - S.start + 1, el = (Date.now() - t0) / 1000;
      console.log(`frame ${n}/${end - 1}  t=${t.toFixed(3)}  ${(el / done).toFixed(2)}s/frame  eta ${((end - n - 1) * el / done / 60).toFixed(1)} min`);
    }
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await f.close(); console.log('wrote', S.out, `in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
})().catch(e => { console.error(e); process.exit(1); });
