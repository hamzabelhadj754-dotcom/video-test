// Frame-accurate renderer: node tools/render.js <page.html> <out.mp4> [fps=30] [sub=2] [from=0] [to=DURATION]
// Renders fps*sub frames per second, blends each group of `sub` frames (motion blur), encodes H.264 BT.709.
const { chromium } = require('playwright'); const path = require('path'); const { spawn } = require('child_process');
(async () => {
  const [page_, out, fps = 30, sub = 2, from = 0, to] = process.argv.slice(2);
  const F = Number(fps), S = Number(sub);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(page_));
  await p.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
  const dur = to ? Number(to) : await p.evaluate(() => window.DURATION);
  const n = Math.round((dur - Number(from)) * F * S);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(F * S), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `tmix=frames=${S}:weights='${Array(S).fill(1).join(' ')}',fps=${F},format=yuv420p`,
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '16', '-preset', 'medium',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = Number(from) + i / (F * S);
    await p.evaluate(t => { window.seek(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`\r${i}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  console.log(`\ndone ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
