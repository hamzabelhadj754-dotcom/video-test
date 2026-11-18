// True motion blur render: node tools/render_blur.js <page.html> <out.mp4> <fromFrame> <toFrame> [S=8] [shutter=0.5] [fps=60]
// For each output frame k (time k/fps) renders S subframes across a centred shutter and averages exactly that group.
const { chromium } = require('playwright'); const path = require('path'); const { spawn } = require('child_process');
(async () => {
  const [page_, out, f0, f1, S_ = 8, sh_ = .5, fps_ = 60] = process.argv.slice(2);
  const F = Number(fps_), S = Number(S_), SH = Number(sh_), A = Number(f0), B = Number(f1);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(page_));
  await p.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(F * S), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `tmix=frames=${S},select='not(mod(n+1\\,${S}))',setpts=N/(${F}*TB),format=yuv420p`, '-r', String(F),
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '16', '-preset', 'medium',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let k = A; k < B; k++) for (let j = 0; j < S; j++) {
    const t = k / F + ((j + .5) / S - .5) * SH / F;
    await p.evaluate(t => { window.seek(Math.max(0, t)); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  console.log('done', out, B - A, 'frames');
})();
