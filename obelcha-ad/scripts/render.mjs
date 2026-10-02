// Render frames deterministically with Playwright and encode with ffmpeg.
//   node scripts/render.mjs --format 9x16 --lang es --out out/obelcha_ad_9x16_ES.mp4 [--audio audio/mix.wav]
//   node scripts/render.mjs --format 9x16 --lang es --stills 0,0.5,1.2 --outdir qa/stills
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]] : a), []));
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json'), 'utf8'));
const format = args.format || '9x16';
const lang = args.lang || 'es';
const { w: W, h: H } = TL.formats[format];
const FPS = TL.meta.fps;
const N = Math.round(TL.meta.duration * FPS);
const WORKERS = Number(args.workers || Math.max(1, Math.min(4, os.cpus().length)));

// Real brand assets win over placeholders when present.
const assets = {};
for (const k of ['logo', 'product']) {
  for (const ext of ['svg', 'png']) {
    const p = path.join(ROOT, 'assets', `${k}.${ext}`);
    if (fs.existsSync(p)) { assets[k] = pathToFileURL(p).href; break; }
  }
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.addInitScript(([tl, as]) => { window.__TIMELINE__ = tl; window.__ASSETS__ = as; }, [TL, assets]);
  const url = pathToFileURL(path.join(ROOT, 'src', 'index.html')).href + `?format=${format}&lang=${lang}&render=1${args.safe ? '&safe=1' : ''}${args.grain ? '&grain=1' : ''}`;
  page.on('pageerror', (e) => { console.error('PAGE ERROR', e); process.exit(1); });
  await page.goto(url);
  await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 60000 });
  return page;
}
async function frame(page, t) {
  await page.evaluate((tt) => window.seek(tt), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
}
function run(cmd, argv, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, argv, { stdio: ['pipe', 'inherit', 'inherit'], ...opts });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`))));
    if (opts.feed) opts.feed(p.stdin);
  });
}

const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none', '--disable-lcd-text'] });

if (args.stills) {
  const outdir = path.resolve(ROOT, args.outdir || 'qa/stills');
  fs.mkdirSync(outdir, { recursive: true });
  const page = await openPage(browser);
  for (const ts of String(args.stills).split(',')) {
    const t = Number(ts);
    const buf = await frame(page, t);
    const fn = path.join(outdir, `${format}_${lang}_${t.toFixed(2).padStart(5, '0')}.png`);
    fs.writeFileSync(fn, buf);
  }
  console.log('stills ->', outdir);
  await browser.close();
  process.exit(0);
}

const out = path.resolve(ROOT, args.out || `out/obelcha_ad_${format}_${lang.toUpperCase()}.mp4`);
fs.mkdirSync(path.dirname(out), { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `obelcha-${format}-${lang}-`));
const per = Math.ceil(N / WORKERS);
const t0 = Date.now();
let done = 0;
await Promise.all(Array.from({ length: WORKERS }, async (_, wi) => {
  const a = wi * per, b = Math.min(N, a + per);
  if (a >= b) return;
  const page = await openPage(browser);
  const seg = path.join(tmp, `seg${wi}.mkv`);
  // visually-lossless intermediate; final encode happens once below
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '6', '-pix_fmt', 'yuv444p', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fin = new Promise((res, rej) => ff.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg seg ' + c)))));
  for (let i = a; i < b; i++) {
    const buf = await frame(page, i / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (done % 60 === 0) process.stdout.write(`  ${format}/${lang}: ${done}/${N} frames (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  ff.stdin.end();
  await fin;
  await page.close();
}));
await browser.close();

const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, Array.from({ length: WORKERS }, (_, i) => `file '${path.join(tmp, `seg${i}.mkv`)}'`).filter((l, i) => fs.existsSync(path.join(tmp, `seg${i}.mkv`))).join('\n'));
const audio = args.audio ? path.resolve(ROOT, args.audio) : null;
const ffArgs = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
if (audio) ffArgs.push('-i', audio);
ffArgs.push('-vf', `${TL.meta.grain.ffmpeg},format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-maxrate', '16M', '-bufsize', '32M', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-r', String(FPS), '-movflags', '+faststart', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709');
if (audio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-map', '0:v:0', '-map', '1:a:0', '-shortest');
ffArgs.push(out);
await run('ffmpeg', ffArgs);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${path.relative(ROOT, out)}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
