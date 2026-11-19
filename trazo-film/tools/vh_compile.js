// Layout compiler: opens the DOM version of the film (src/film7.html), removes every animation state, and extracts the exact
// layout (words, boxes, SVG primitives) in world / screen coordinates plus the animation graph, for the canvas-only
// VideoHub film. Output: videohub/trazo-la-ruta/layout.js  (window.LAYOUT = {...})
// Usage: node tools/vh_compile.js [src/film7.html] [videohub/trazo-la-ruta/layout.js]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const SRC = process.argv[2] || 'src/film7.html', OUT = process.argv[3] || 'videohub/trazo-la-ruta/layout.js';

// every selector the film's timeline animates (film.js uses exactly these strings)
const SELS = [
  '#pres .wd > i', '#yname .m > *', '#w0meta .m > *', '#w1k .m > *', '#w1t .wd > i', '#herobike path, #herobike circle, #herobike line',
  '#w1s .wd > i', '#w1specs .chip', '#w1p .wd > i', '#w2title .wd > i', '#w2a .plate', '#age .m > *', '.unitA', '#w2ac .chip',
  '#w2b .plate', '#fleetn .m > *', '.unitB', '#fleet svg', '#w3pre .wd > i', '#w3big .wd > i', '#w3t',
  '#w4title .wd > i', '#acr > span', '#w4t', '#ob1', '#ob2', '#ob3',
  '#w5title .wd > i', '#w5mt .wd > i', '#w6lt .wd > i', '#w6rt .wd > i', '#fx1', '#fx2', '#fx3', '#fx4',
  '#w7title .wd > i', '#w7k', '#hubl', '.stL1', '.stL2', '.stL3', '#lb1', '#lb2', '#lb3', '.pin',
  '#w0', '#w1', '#herobike', '#w1specs', '#w1p', '#w2a', '#w2b', '#w2t', '#w5t', '#w5m', '#w6l', '#w6r',
  '#elogo .m > *', '#etag .wd > i', '#ethx .wd > i', '#ecred > span', '#hud',
];
for (let i = 0; i < 4; i++) SELS.push(`#fk${i} .wd > i`, `#fpl${i}`, `#fp${i}`, ...[1, 2, 3].flatMap(k => [`#fr${i} .row:nth-child(${k})`, `#fr${i} .row:nth-child(${k}) .ico > *`]));
for (const ob of ['#ob1', '#ob2', '#ob3']) SELS.push(`${ob} .lbl:first-child`, `${ob} .big .m > *`, `${ob} > div:nth-child(n+3)`);
for (const s of ['#sv1', '#sv2', '#sv3']) SELS.push(s, `${s} .plate`, `${s} > div:last-child`);
for (const m of ['#md1', '#md2', '#md3']) SELS.push(m, `${m} .stem`, `${m} .ring`, `${m} .t, ${m} .s`);

(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  // a temporary copy that exposes the page's pin list (world x/y of every pinned element)
  const TMP = path.join(path.dirname(SRC), '_compile_tmp.html');
  fs.writeFileSync(TMP, fs.readFileSync(SRC, 'utf8').replace('const PINS = [];', 'const PINS = window.__PINS = [];'));
  await p.goto('file://' + path.resolve(TMP) + '?cs=1');
  await p.waitForSelector('body[data-ready="1"]');
  const L = await p.evaluate((SELS) => {
    // ---- neutralise animation state: back to pure layout
    const all = [...document.querySelectorAll('*')];
    for (const e of all) { if (!e.style) continue; e.style.transform = ''; e.style.translate = ''; e.style.scale = ''; e.style.rotate = ''; e.style.opacity = ''; e.style.clipPath = ''; e.style.filter = ''; }
    document.querySelectorAll('.pin').forEach(e => { e.style.transform = 'none'; e.style.display = 'block'; });
    document.querySelectorAll('.stem').forEach(e => { e.style.height = '336px'; });
    for (const id of ['#endc', '#hud']) { const e = document.querySelector(id); e.style.visibility = 'visible'; e.style.opacity = '1'; }
    document.querySelectorAll('svg *').forEach(e => { e.removeAttribute('stroke-dashoffset'); if (e.closest('.ico,#herobike')) e.removeAttribute('stroke-dasharray'); });
    // ---- anim ids
    const AID = new Map(), sel = {}; let nid = 0;
    for (const s of SELS) sel[s] = [...document.querySelectorAll(s)].map(e => { if (!AID.has(e)) AID.set(e, nid++); return AID.get(e); });
    const anims = {};
    const cv = document.createElement('canvas').getContext('2d');
    const r4 = r => [+r.left.toFixed(2), +r.top.toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2)];
    const col = c => c;
    const transparent = c => !c || c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c);
    function walk(el, base, chain, out) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return;
      const rect = el.getBoundingClientRect(), R = [rect.left - base[0], rect.top - base[1], rect.width, rect.height];
      const myChain = chain.slice();
      if (AID.has(el)) { const id = AID.get(el); anims[id] = R.map(v => +v.toFixed(2)); myChain.push({ a: id }); }
      const tag = el.tagName.toLowerCase();
      if (tag === 'svg') {
        const vb = el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal.width ? [el.viewBox.baseVal.x, el.viewBox.baseVal.y, el.viewBox.baseVal.width, el.viewBox.baseVal.height] : [0, 0, R[2], R[3]];
        const prims = [];
        const eff = (n, a, d) => { for (let e = n; e && e !== el.parentNode; e = e.parentNode) { if (e.getAttribute && e.getAttribute(a) != null) return e.getAttribute(a); } return d; };
        el.querySelectorAll('path,circle,line,rect').forEach(n => {
          const k = n.tagName.toLowerCase(), P = { k, fill: eff(n, 'fill', k === 'line' ? 'none' : '#000'), stroke: eff(n, 'stroke', 'none'), sw: +eff(n, 'stroke-width', 1), cap: eff(n, 'stroke-linecap', 'butt'), join: eff(n, 'stroke-linejoin', 'miter'), op: +eff(n, 'opacity', 1) };
          if (k === 'path') P.d = n.getAttribute('d'); if (k === 'circle') { P.cx = +n.getAttribute('cx'); P.cy = +n.getAttribute('cy'); P.r = +n.getAttribute('r'); }
          if (k === 'line') { P.x1 = +n.getAttribute('x1'); P.y1 = +n.getAttribute('y1'); P.x2 = +n.getAttribute('x2'); P.y2 = +n.getAttribute('y2'); }
          if (k === 'rect') { P.x = +n.getAttribute('x') || 0; P.y = +n.getAttribute('y') || 0; P.w = +n.getAttribute('width'); P.h = +n.getAttribute('height'); P.rx = +n.getAttribute('rx') || 0; }
          if (AID.has(n)) P.a = AID.get(n);
          prims.push(P);
        });
        out.push({ t: 'svg', r: R, vb, prims, c: myChain });
        return;
      }
      // box
      const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(parseFloat);
      if (!transparent(cs.backgroundColor) || bw.some(v => v > 0)) {
        let rad = parseFloat(cs.borderTopLeftRadius) || 0; if (/%/.test(cs.borderTopLeftRadius)) rad = Math.min(R[2], R[3]) * parseFloat(cs.borderTopLeftRadius) / 100;
        out.push({ t: 'box', r: R, bg: transparent(cs.backgroundColor) ? null : cs.backgroundColor, bw, bc: cs.borderTopColor, rad: Math.min(rad, R[2] / 2, R[3] / 2), cls: el.className && el.className.baseVal == null ? String(el.className) : '', c: myChain });
      }
      if (cs.overflow === 'hidden' || cs.overflowX === 'hidden') myChain.push({ m: R.map(v => +v.toFixed(2)) });
      for (const n of el.childNodes) {
        if (n.nodeType === 3) {
          const txt = n.textContent; if (!txt.trim()) continue;
          const pcs = getComputedStyle(n.parentElement);
          const font = `${pcs.fontStyle === 'italic' ? 'italic ' : ''}${pcs.fontWeight} ${pcs.fontSize} InterTight`;
          cv.font = font; const asc = cv.measureText('Hg').fontBoundingBoxAscent;
          const up = pcs.textTransform === 'uppercase';
          const re = /\S+/g; let m;
          while ((m = re.exec(txt))) {
            const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
            const rr = rg.getClientRects()[0]; if (!rr) continue;
            out.push({ t: 'txt', s: up ? m[0].toUpperCase() : m[0], x: +(rr.left - base[0]).toFixed(2), y: +(rr.top - base[1] + asc).toFixed(2), f: font, ls: pcs.letterSpacing === 'normal' ? '0px' : pcs.letterSpacing, col: col(pcs.color), c: myChain });
          }
        } else if (n.nodeType === 1) walk(n, base, myChain, out);
      }
    }
    // world: each pin's child, pin at world (x,y) — read the original pin positions from the page's PINS order
    const world = [], PXY = new Map(window.__PINS.map(P => [P.pin, [P.x, P.y]]));
    document.querySelectorAll('.pin').forEach(pin => {
      const el = pin.firstElementChild; const base = pin.getBoundingClientRect();
      const out = []; walk(el, [base.left, base.top], [{ a: AID.get(pin) }], out);
      world.push({ id: el.id || el.className, xy: PXY.get(pin), recs: out });
    });
    const screen = [];
    for (const s of ['#hud .brand', '#endc']) { const out = []; const e = document.querySelector(s); walk(e, [0, 0], s === '#endc' ? [] : [{ a: AID.get(document.querySelector('#hud')) }], out); screen.push({ id: s, recs: out }); }
    // anim rects for screen-space anim of #hud (whole screen)
    anims[AID.get(document.querySelector('#hud'))] = [0, 0, 1920, 1080];
    return { sel, anims, world, screen };
  }, SELS);
  // pin world positions: from the source markup (left/top of each pinned element before the page moved them)
  fs.unlinkSync(TMP);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, '// generated by tools/vh_compile.js from ' + SRC + ' — layout + animation graph of the film (do not edit by hand)\nwindow.LAYOUT = ' + JSON.stringify(L) + ';\n');
  const nrec = L.world.reduce((a, w) => a + w.recs.length, 0) + L.screen.reduce((a, w) => a + w.recs.length, 0);
  const missing = L.world.filter(w => !w.xy).map(w => w.id);
  console.log('pins', L.world.length, 'records', nrec, 'anims', Object.keys(L.anims).length, 'missing pin xy:', missing.join(' ') || 'none');
  const empty = Object.entries(L.sel).filter(([k, v]) => !v.length).map(([k]) => k); console.log('selectors with no element:', empty.join(' | ') || 'none');
  await b.close();
})();
