// Generate a HyperFrames project (hyperframes/) that renders the ad with `npx hyperframes render`.
// Each composition pins format+lang, inlines timeline.json, and registers a paused GSAP timeline
// whose proxy setter calls the deterministic canvas renderer: window.seek(t).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HF_ROOT = path.join(ROOT, 'hyperframes');
fs.rmSync(HF_ROOT, { recursive: true, force: true });
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json'), 'utf8'));
const D = TL.meta.duration;
const variants = [['9x16', 'es'], ['1x1', 'es'], ['16x9', 'es'], ['9x16', 'en'], ['9x16', 'fr']];
for (const [format, lang] of variants) {
  // one HyperFrames project per variant (a project has exactly one root composition)
  const HF = path.join(HF_ROOT, `${format}_${lang}`);
  fs.mkdirSync(path.join(HF, 'fonts'), { recursive: true });
  const cp = (a, b) => fs.copyFileSync(path.join(ROOT, a), path.join(HF, b));
  cp('src/ad.js', 'ad.js');
  cp('node_modules/gsap/dist/gsap.min.js', 'gsap.min.js');
  for (const f of fs.readdirSync(path.join(ROOT, 'fonts'))) if (f.endsWith('.woff')) cp(`fonts/${f}`, `fonts/${f}`);
  fs.writeFileSync(path.join(HF, 'fonts.css'), fs.readFileSync(path.join(ROOT, 'fonts/fonts.css'), 'utf8').replaceAll('../fonts/', 'fonts/'));
  if (fs.existsSync(path.join(ROOT, 'audio/mix.wav'))) cp('audio/mix.wav', 'mix.wav');
  fs.writeFileSync(path.join(HF, 'timeline.js'), `window.__TIMELINE__ = ${JSON.stringify(TL)};\n`);
  const { w, h } = TL.formats[format];
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${w}, height=${h}">
<title>OBELCHA ${format} ${lang.toUpperCase()}</title>
<link rel="stylesheet" href="fonts.css">
<style>html,body{margin:0;background:#0B0B0B;overflow:hidden}#root{position:relative;width:${w}px;height:${h}px}#stage{position:absolute;inset:0;display:block}.fl{position:absolute;left:-9999px}</style>
</head>
<body>
<div id="root" data-composition-id="root" data-width="${w}" data-height="${h}" data-start="0" data-duration="${D}">
  <span class="fl" style="font-family:'Cormorant Garamond';font-weight:600">¿Á</span>
  <span class="fl" style="font-family:'Cormorant Garamond';font-weight:500;font-style:italic">Á</span>
  <span class="fl" style="font-family:'Jost';font-weight:400">Á</span><span class="fl" style="font-family:'Jost';font-weight:500">Á</span>
  <canvas id="stage" class="clip" data-start="0" data-duration="${D}"></canvas>
  <audio id="mix" src="mix.wav" data-start="0" data-duration="${D}" data-volume="1"></audio>
</div>
<script>window.__AD_CONFIG__ = { format: '${format}', lang: '${lang}', render: true, grain: true };</script>
<script src="timeline.js"></script>
<script src="gsap.min.js"></script>
<script>
  // Bridge: the HyperFrames runtime seeks this paused GSAP timeline; the proxy setter
  // forwards the exact time to the canvas renderer (pure function of t).
  const clock = { _t: 0, get t() { return this._t; }, set t(v) { this._t = v; window.__PENDING_T__ = v; if (window.seek) window.seek(v); } };
  const tl = gsap.timeline({ paused: true });
  tl.to(clock, { t: ${D}, duration: ${D}, ease: 'none' }, 0);
  window.__timelines = window.__timelines || {};
  window.__timelines['root'] = tl;
</script>
<script src="ad.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(HF, 'index.html'), html);
}
console.log('✓ hyperframes/ project generated');
