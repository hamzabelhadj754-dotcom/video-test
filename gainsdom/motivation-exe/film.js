// GAINSDOM · Protocol 01 · MOTIVATION.EXE  (1080x1920, 60 fps, 15 s)
// One canvas, window.renderOut(t) is a pure function of t (VideoHub contract). Times live in timing.js (TL).
// HOOK motivation stuck at 99% → crash → TRUTH "you're not lazy / you're waiting" → TOOL DISCIPLINE.EXE installs with
// 0 motivation → silence → ACTION "START NOW." → sign-off typed by the cursor (last frame = first frame: it loops).
(function () {
  'use strict';
  const W = 1080, H = 1920, DUR = TL.DUR, X0 = 96, XR = 940;          // left margin, right edge of the safe text column
  const C = { bg: '#0A0A0A', ink: '#F2F2F0', card: '#1A1A1A', line: '#3A3A3A', dim: '#8C8C88', dead: '#5E5E5B', or: '#FF4A1C' };
  const AN = 'AN', JB = 'JB';
  const cv = document.getElementById('c'), main = cv.getContext('2d', { willReadFrequently: true });
  let g = main;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    o3: x => 1 - (1 - x) ** 3, o5: x => 1 - (1 - x) ** 5, i3: x => x * x * x,
    io: x => x < .5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2,
    expo: x => x >= 1 ? 1 : 1 - 2 ** (-10 * x),
  };
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // ---------- type
  function font(fam, size, wt) { return fam === AN ? `${size}px ${AN}` : `${wt || 500} ${size}px ${JB}`; }
  function setF(fam, size, wt, track) { g.font = font(fam, size, wt); g.letterSpacing = (track || 0) + 'px'; }
  const fitCache = {};
  function fit(str, width) { const k = str + width; if (fitCache[k]) return fitCache[k]; g.font = font(AN, 100); g.letterSpacing = '0px'; return (fitCache[k] = 100 * width / g.measureText(str).width); }
  function mono(str, x, y, size, col, wt, align) { setF(JB, size, wt, size * .04); g.fillStyle = col; g.textAlign = align || 'left'; g.fillText(str, x, y); g.textAlign = 'left'; return g.measureText(str).width; }
  const typed = (str, t0, t, cps = 38) => str.slice(0, clamp(Math.floor((t - t0) * cps), 0, str.length));
  function cursor(x, y, size, t, solid) { if (!solid && Math.floor(t * 2.4) % 2) return; g.fillStyle = C.ink; g.fillRect(x + 4, y - size * .78, size * .56, size * .92); }
  // slam: 1.14 → 1 in 6 frames, hard cut in (no fade), scaled about (cx, cy)
  function slamK(t, t0) { const d = t - t0; return d < 0 ? 0 : d < .1 ? 1 + .14 * (1 - E.o5(d / .1)) : 1; }
  function slamDo(t, t0, cx, cy, draw) { const k = slamK(t, t0); if (!k) return; g.save(); g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy); draw(); g.restore(); }
  function glow(col, blur, fn) { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); fn(); }

  // ---------- footage (graded B&W JPEG sequences from tools/shots.py; SHOTS in assets/shots/shots.js)
  const IMG = {};
  function shotImg(name, t, t0, rate = 1) { const m = SHOTS[name], a = IMG[name]; if (!m || !a) return null; return a[clamp(Math.floor((t - t0) * m.fps * rate), 0, m.n - 1)]; }
  function full(name, t, t0, dark, rate) {   // full-bleed, 4% overscan so the shake never shows an edge
    const im = shotImg(name, t, t0, rate); if (!im || !im.naturalWidth) return;
    g.save(); g.translate(540, 960); g.scale(1.04, 1.04); g.translate(-540, -960); g.drawImage(im, 0, 0, W, H); g.restore();
    if (dark) { g.fillStyle = `rgba(10,10,10,${dark})`; g.fillRect(-80, -80, W + 160, H + 160); }
  }
  function shade(y0, y1, a0, a1) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `rgba(10,10,10,${a0})`); gr.addColorStop(1, `rgba(10,10,10,${a1})`); g.fillStyle = gr; g.fillRect(-80, y0, W + 160, y1 - y0); }

  // ---------- camera: never still (slow push + wander) + decaying shake on every hit
  const SHAKES = [[TL.hook, 12], [TL.wait1, 5], [TL.wait2, 4], [TL.wait3, 4], [TL.win, 5], [TL.you, 8], [TL.notLazy, 9], [TL.waiting, 7], [TL.install, 4], [TL.start, 18], [TL.now, 13]];
  function shake(t) { let x = 0, y = 0; for (const [s, a] of SHAKES) { const d = t - s; if (d < 0 || d > .35) continue; const e = a * Math.exp(-d * 13); x += e * Math.sin(d * 97 + s); y += e * Math.cos(d * 73 + s * 2); } return [x, y]; }
  function camSet(t) {
    const k = 1 + .03 * t / DUR, [sx, sy] = shake(t);
    g.setTransform(k, 0, 0, k, W / 2 * (1 - k) + 2 * Math.sin(t * .7) + sx, H / 2 * (1 - k) + 2 * Math.cos(t * .53) + sy);
  }
  function push(t, t0, t1, amt, cx, cy) { const k = 1 + amt * E.io(p(t, t0, t1)); g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy); }

  // ---------- HUD (screen space, does not shake)
  function hud(t) {
    if ((t >= TL.black1 && t < TL.you) || (t >= TL.collapse && t < TL.start) || t < TL.hook || t >= TL.end) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    g.strokeStyle = C.line; g.lineWidth = 2;
    for (const [x, y, sx, sy] of [[56, 96, 1, 1], [W - 56, 96, -1, 1], [56, 1824, 1, -1], [W - 56, 1824, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * 44); g.lineTo(x, y); g.lineTo(x + sx * 44, y); g.stroke(); }
    mono('GAINSDOM/OS', X0, 168, 24, C.ink, 700);
    const st = t < TL.win ? 'WAITING' : t < TL.black1 ? 'NOT RESPONDING' : t < TL.glitch2 ? 'DIAGNOSIS' : t < TL.done ? 'INSTALLING' : t < TL.start ? 'READY' : t < TL.sign ? 'RUNNING' : 'ONLINE';
    const live = st === 'NOT RESPONDING' ? C.or : C.dim;
    mono('STATUS  ' + st, W - X0, 168, 22, live, 500, 'right');
    mono('// PROTOCOL 01 — THE 2-MINUTE INSTALL', X0, 1492, 22, C.dim, 500);
  }

  // ---------- 1 · HOOK (motivation stuck at 99%)
  const BAR = { x: X0, y: 744, w: XR - X0, h: 40 };
  function pct(t) {   // sprints, crawls, freezes at 99 forever
    if (t < TL.sprint0) return 0;
    const k = p(t, TL.sprint0, TL.sprint1);
    return Math.min(99, Math.floor(k < .55 ? 86 * E.o3(k / .55) : 86 + 13 * E.o3((k - .55) / .45)));
  }
  function hook(t) {
    const S = fit('MOTIVATION', BAR.w), pc = pct(t), frozen = t > TL.sprint1 + .25;
    // footage: phone glow at night → what you're waiting for (cut on each beat)
    if (t < TL.wait1) { full('phone', t, TL.hook, .5); shade(1100, 2000, 0, .65); }
    else if (t < TL.wait2) full('clock', t, TL.wait1, .1);
    else if (t < TL.wait3) full('rain', t, TL.wait2, .3);
    else full('glass', t, TL.wait3, .15, t > TL.win ? .35 : 1);
    if (t >= TL.wait1) { shade(0, 520, .75, 0); shade(1080, 2000, 0, .82); }
    const m = E.io(p(t, TL.wait1 - .14, TL.wait1 + .1)), k = lerp(1, .34, m);
    g.save(); g.translate(X0, lerp(470, 236, m)); g.scale(k, k); g.translate(-X0, -470);
    slamDo(t, TL.hook, 540, 900, () => {
      mono('// LOADING', X0, 520, 30, C.dim, 500);
      g.font = font(AN, S); g.letterSpacing = '0px'; g.fillStyle = C.ink; g.fillText('MOTIVATION', X0, 700);
      g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(BAR.x, BAR.y, BAR.w, BAR.h);
      const fw = (BAR.w - 12) * pc / 100;
      g.fillStyle = frozen ? C.dead : C.ink; g.fillRect(BAR.x + 6, BAR.y + 6, fw, BAR.h - 12);
      if (frozen) {   // the loader keeps "trying": a highlight sweeps the dead bar
        const sw = ((t - TL.sprint1) / .9) % 1, sx = BAR.x + 6 + sw * (fw + 220) - 110;
        g.save(); g.beginPath(); g.rect(BAR.x + 6, BAR.y + 6, fw, BAR.h - 12); g.clip();
        const gr = g.createLinearGradient(sx - 110, 0, sx + 110, 0); gr.addColorStop(0, 'rgba(242,242,240,0)'); gr.addColorStop(.5, 'rgba(242,242,240,.32)'); gr.addColorStop(1, 'rgba(242,242,240,0)');
        g.fillStyle = gr; g.fillRect(sx - 110, BAR.y, 220, BAR.h); g.restore();
      }
      const dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
      mono(frozen ? 'ETA  CALCULATING' + dots : 'ETA  ' + Math.max(1, 9 - Math.floor(pc / 11)) + ' MIN', X0, 840, 28, C.dim, 500);
      g.font = font(AN, fit('99%', BAR.w + 10)); g.fillStyle = C.ink; g.fillText(pc + '%', X0 - 10, 1352);
    });
    g.restore();
    if (t >= TL.wait1) {   // what you're waiting for: one big word per beat; the days run away
      const items = [[TL.wait1, 'MONDAY'], [TL.wait2, 'THE RIGHT MOOD'], [TL.wait3, 'FEELING READY']];
      let cur = items[0]; for (const it of items) if (t >= it[0]) cur = it;
      const WS = fit('THE RIGHT MOOD', XR - X0), wy = 1236;
      mono('WAITING FOR:', X0, wy, 32, C.dim, 500);
      const d = Math.min(365, 1 + Math.floor(364 * p(t, TL.wait1, TL.dayEnd) ** 2.3));
      mono('DAY ' + String(d).padStart(3, '0'), XR, wy, 32, C.ink, 700, 'right');
      slamDo(t, cur[0], 540, wy + WS * .5, () => { g.font = font(AN, WS); g.letterSpacing = '0px'; g.fillStyle = C.ink; g.fillText(cur[1], X0, wy + 26 + WS * .78); });
    }
  }

  // ---------- 2 · crash: error window + cursor → END TASK
  const WIN = { x: 104, y: 760, w: 872, h: 520 };
  function arrow(x, y, s, down) { g.save(); g.translate(x, y); g.scale(s * (down ? .9 : 1), s * (down ? .9 : 1)); g.beginPath();
    g.moveTo(0, 0); g.lineTo(0, 34); g.lineTo(8.5, 26); g.lineTo(14.5, 40); g.lineTo(21, 37.2); g.lineTo(15, 24.2); g.lineTo(26.5, 24.2); g.closePath();
    g.fillStyle = C.ink; g.fill(); g.lineWidth = 2 / s; g.strokeStyle = '#000'; g.stroke(); g.restore(); }
  function crash(t) {
    g.save(); g.fillStyle = 'rgba(10,10,10,.62)'; g.setTransform(1, 0, 0, 1, 0, 0); g.fillRect(0, 0, W, H); g.restore();
    camSet(t);
    slamDo(t, TL.win, WIN.x + WIN.w / 2, WIN.y + WIN.h / 2, () => {
      const { x, y, w, h } = WIN;
      g.save(); g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 80; g.fillStyle = C.card; g.fillRect(x, y, w, h); g.restore();
      g.fillStyle = '#222220'; g.fillRect(x, y, w, 64); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(x, y, w, h);
      mono('MOTIVATION.EXE', x + 32, y + 42, 24, C.dim, 500); mono('—   ×', x + w - 32, y + 42, 24, C.dim, 500, 'right');
      g.fillStyle = C.or; g.fillRect(x + 32, y + 112, 12, 12);
      mono('ERROR 0x99', x + 58, y + 124, 24, C.or, 700);
      g.font = font(AN, 118); g.letterSpacing = '0px'; g.fillStyle = C.ink; g.fillText('NOT RESPONDING.', x + 32, y + 262);
      mono('// still waiting for you to feel ready.', x + 32, y + 326, 26, C.dim, 500);
      const pressed = t >= TL.click && t < TL.click + .1, by = y + h - 120;
      g.fillStyle = C.ink; g.fillRect(x + 32, by, 400, 80); mono('KEEP WAITING', x + 232, by + 51, 28, C.bg, 700, 'center');
      g.strokeStyle = pressed ? C.ink : C.dim; g.lineWidth = 2; if (pressed) { g.fillStyle = C.ink; g.fillRect(x + 460, by, 380, 80); } else g.strokeRect(x + 460, by, 380, 80);
      mono('END TASK', x + 650, by + 51, 28, pressed ? C.bg : C.ink, 700, 'center');
    });
    if (t >= TL.cur0) {   // the pointer comes in from the lower right and clicks END TASK
      const k = E.io(p(t, TL.cur0, TL.click - .05)), x = lerp(1010, WIN.x + 700, k) + 26 * Math.sin(k * Math.PI), y = lerp(1560, WIN.y + WIN.h - 82, k);
      arrow(x, y, 1.6, t >= TL.click && t < TL.click + .1);
    }
  }

  // ---------- 3 · TRUTH
  const LY1 = 900; let TS = 0, LY2 = 0, SS = 0, SY1 = 0, SY2 = 0;   // set once the fonts are loaded
  function truth(t) {
    const glitched = t >= TL.glitch2 + .05;
    if (!glitched && t >= TL.waiting) { full('dial', t, TL.waiting, .7); shade(0, 600, .6, 0); }
    if (!glitched) {
      const lab = '// DIAGNOSIS', lab2 = t >= TL.waiting ? '  (CORRECTED)' : '';
      const w = mono(typed(lab, TL.diag, t, 60), X0, LY1 - TS * .86, 30, C.dim, 500);
      if (lab2) mono(typed(lab2, TL.waiting, t, 60), X0 + w, LY1 - TS * .86, 30, C.or, 500);
      g.font = font(AN, TS); g.letterSpacing = '0px';
      slamDo(t, TL.you, 540, LY1 - TS * .35, () => { g.fillStyle = C.ink; g.fillText("YOU'RE", X0, LY1); });
      // line 2 is a slot: NOT LAZY. rolls up and out, WAITING. rolls in (the diagnosis gets corrected)
      const r = E.io(p(t, TL.roll, TL.waiting)), top = LY2 - TS * .82, hgt = TS * .9;
      g.save(); g.beginPath(); g.rect(0, top, W, hgt + 6); g.clip();
      if (r < 1) slamDo(t, TL.notLazy, 540, LY2 - TS * .35, () => { g.fillStyle = C.ink; g.fillText('NOT LAZY.', X0, LY2 - r * TS); });
      if (r > 0) { const yy = LY2 + (1 - r) * TS; slamDo(t, TL.waiting, 540, LY2 - TS * .35, () => {
        const col = t >= TL.waiting ? C.or : C.ink;
        const draw = () => { g.fillStyle = col; g.fillText('WAITING', X0, yy); };
        if (col === C.or) glow('rgba(255,74,28,.55)', 40, draw); else draw();
        g.fillStyle = C.ink; g.fillText('.', X0 + g.measureText('WAITING').width, yy); }); }
      g.restore();
    }
    // the strike that uninstalls WAITING, then becomes the installer's progress track
    if (t >= TL.strike0) {
      const ww = (g.font = font(AN, TS), g.measureText('WAITING.').width), sy = LY2 - TS * .37;
      const a = { x: X0 - 12, y: sy - 8, w: (ww + 24) * E.io(p(t, TL.strike0, TL.strike1)), h: 16 };
      const m = E.io(p(t, TL.morph0, TL.morph1)), b2 = IB;
      const rx = lerp(a.x, b2.x, m), ry = lerp(a.y, b2.y, m), rw = lerp(a.w, b2.w, m), rh = lerp(a.h, b2.h, m);
      if (m < 1) { g.fillStyle = C.ink; g.fillRect(rx, ry, rw, rh); }
      if (m > .6) { g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(b2.x, b2.y, b2.w, b2.h); }
    }
  }

  // ---------- 4 · TOOL: the installer (with a camera viewport showing each step)
  const IW = { x: 76, y: 250, w: 928, h: 1190 }, VP = { x: 126, y: 340, w: 828, h: 466 }, IB = { x: 126, y: 1100, w: XR - 126, h: 40 };
  function viewport(t) {
    const segs = [['vlamp', TL.install, 'STANDBY // PHONE DOWN'], ['valarm', TL.check1, 'TRIGGER // ALARM'], ['vpush', TL.check2, 'ACTION // PUSH-UPS'],
      ['vwatch', TL.check3, 'TIMER // 02:00'], ['vgym', TL.done, 'DISCIPLINE.EXE // RUNNING']];
    let s = segs[0]; for (const x of segs) if (t >= x[1]) s = x;
    g.save(); g.beginPath(); g.rect(VP.x, VP.y, VP.w, VP.h); g.clip();
    g.fillStyle = '#000'; g.fillRect(VP.x, VP.y, VP.w, VP.h);
    const im = shotImg(s[0], t, s[1]);
    if (im && im.naturalWidth) { const z = 1 + .05 * p(t, s[1], s[1] + 1.4); g.translate(VP.x + VP.w / 2, VP.y + VP.h / 2); g.scale(z, z); g.drawImage(im, -VP.w / 2, -VP.h / 2, VP.w, VP.h); g.scale(1 / z, 1 / z); g.translate(-VP.x - VP.w / 2, -VP.y - VP.h / 2); }
    if (t - s[1] < 2 / 60) { g.fillStyle = 'rgba(242,242,240,.22)'; g.fillRect(VP.x, VP.y, VP.w, VP.h); }   // camera switch
    const prompt = t >= TL.prompt;
    if (prompt) { g.fillStyle = 'rgba(10,10,10,.62)'; g.fillRect(VP.x, VP.y, VP.w, VP.h); }
    // camera overlay: brackets, CAM / REC, timecode, the step it shows
    g.strokeStyle = 'rgba(242,242,240,.85)'; g.lineWidth = 2;
    for (const [x, y, sx, sy] of [[VP.x + 18, VP.y + 18, 1, 1], [VP.x + VP.w - 18, VP.y + 18, -1, 1], [VP.x + 18, VP.y + VP.h - 18, 1, -1], [VP.x + VP.w - 18, VP.y + VP.h - 18, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * 28); g.lineTo(x, y); g.lineTo(x + sx * 28, y); g.stroke(); }
    mono('CAM 01', VP.x + 40, VP.y + 52, 20, C.ink, 700);
    if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = C.ink; g.beginPath(); g.arc(VP.x + 148, VP.y + 45, 6, 0, 7); g.fill(); }
    mono('REC', VP.x + 160, VP.y + 52, 20, C.ink, 500);
    const el = Math.max(0, t - TL.install), tc = `00:00:${String(Math.floor(el)).padStart(2, '0')}:${String(Math.floor(el * 30) % 30).padStart(2, '0')}`;
    mono(tc, VP.x + VP.w - 40, VP.y + 52, 20, C.ink, 500, 'right');
    if (!prompt) mono(s[2], VP.x + 40, VP.y + VP.h - 36, 20, C.ink, 700);
    else { const q = '> RUN DISCIPLINE.EXE?  [Y/n]', s2 = typed(q, TL.prompt, t, 44);
      const w = mono(s2, VP.x + 48, VP.y + VP.h / 2 + 14, 34, C.ink, 700); cursor(VP.x + 48 + w, VP.y + VP.h / 2 + 14, 34, t, s2.length < q.length); }
    g.restore();
    g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(VP.x, VP.y, VP.w, VP.h);
  }
  function installer(t) {
    // the window unfolds out of the progress track
    const u = E.expo(p(t, TL.morph1, TL.install));
    const top = lerp(IB.y - 20, IW.y, u), bot = lerp(IB.y + IB.h + 20, IW.y + IW.h, u);
    push(t, TL.install, TL.collapse, .04, 540, 900);
    g.save(); g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 90; g.fillStyle = C.card; g.fillRect(IW.x, top, IW.w, bot - top); g.restore();
    g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(IW.x, top, IW.w, bot - top);
    if (u > .98) { g.fillStyle = '#222220'; g.fillRect(IW.x + 1, IW.y + 1, IW.w - 2, 63);
      for (let i = 0; i < 3; i++) { g.fillStyle = C.line; g.fillRect(IW.x + 30 + i * 24, IW.y + 26, 12, 12); }
      mono('DISCIPLINE.EXE — INSTALLER', IW.x + IW.w - 32, IW.y + 42, 22, C.dim, 500, 'right'); }
    const done = t >= TL.done, k = p(t, TL.install, TL.done);   // linear: discipline just runs
    g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(IB.x, IB.y, IB.w, IB.h);
    const fw = (IB.w - 12) * k;
    if (done) glow('rgba(255,74,28,.7)', 36, () => { g.fillStyle = C.or; g.fillRect(IB.x + 6, IB.y + 6, fw, IB.h - 12); });
    else { g.fillStyle = C.ink; g.fillRect(IB.x + 6, IB.y + 6, fw, IB.h - 12); }
    if (t < TL.install) return;
    viewport(t);
    mono(typed('INSTALLING', TL.install - .12, t, 60), IB.x, 862, 28, C.dim, 500);
    const DS = fit('DISCIPLINE.EXE', IB.w);
    slamDo(t, TL.install, 540, 940, () => { g.font = font(AN, DS); g.letterSpacing = '0px'; g.fillStyle = C.ink; g.fillText('DISCIPLINE.EXE', IB.x, 996); });
    // REQUIRES: 0 MOTIVATION (the 0 is the accent until the install completes)
    const rq = 'REQUIRES: 0 MOTIVATION', s = typed(rq, TL.requires, t, 40);
    setF(JB, 36, 700, 1.5); let x = IB.x;
    for (let i = 0; i < s.length; i++) { const ch = s[i], acc = i === 10 && !done; g.fillStyle = acc ? C.or : C.ink;
      if (acc) glow('rgba(255,74,28,.6)', 24, () => g.fillText(ch, x, 1066)); else g.fillText(ch, x, 1066); x += g.measureText(ch).width + 1.5; }
    if (s.length < rq.length) cursor(x, 1066, 36, t, true);
    // progress line: status left, percent right
    const status = done ? 'INSTALL COMPLETE' : t < TL.check1 ? 'REMOVING: WAITING' : t < TL.check2 ? 'WRITING: TRIGGER' : t < TL.check3 ? 'WRITING: ACTION' : 'SETTING: TIMER';
    mono(status, IB.x, 1190, 24, done ? C.or : C.dim, done ? 700 : 500);
    mono(String(Math.floor(k * 100)).padStart(3, '0') + '%', XR, 1190, 24, done ? C.or : C.ink, 700, 'right');
    // the three lines of the protocol, one per beat
    const rows = [[TL.check1, 'TRIGGER', 'ALARM RINGS'], [TL.check2, 'ACTION', '10 PUSH-UPS'], [TL.check3, 'TIME', '2 MINUTES']];
    rows.forEach(([t0, a, v], i) => {
      if (t < t0) return; const y = 1272 + i * 60, ck = E.o3(p(t, t0, t0 + .09));
      g.strokeStyle = C.ink; g.lineWidth = 2.5; g.strokeRect(IB.x, y - 30, 34, 34);
      g.save(); g.beginPath(); g.moveTo(IB.x + 7, y - 13); g.lineTo(IB.x + 15, y - 4); g.lineTo(IB.x + 28, y - 23);
      g.lineWidth = 4.5; g.lineCap = 'square'; g.lineJoin = 'miter'; g.setLineDash([60 * ck, 99]); g.strokeStyle = C.ink; g.stroke(); g.restore();
      mono(typed(a, t0 + .05, t, 70), IB.x + 62, y, 32, C.dim, 500);
      mono(typed(v, t0 + .1, t, 60), IB.x + 300, y, 32, C.ink, 700);
    });
  }

  // ---------- 5 · collapse to a cursor, silence, START NOW.
  function action(t) {
    const cuts = [['a1', TL.start], ['a2', TL.now], ['a3', TL.now + BEAT / 2], ['a4', TL.now + BEAT]];
    let s = cuts[0]; for (const c of cuts) if (t >= c[1]) s = c;
    full(s[0], t, s[1], .38); shade(0, 600, .7, 0); shade(1250, 1920, 0, .75);
    push(t, TL.now, TL.glitch3, .05, 540, 960);
    g.font = font(AN, SS); g.letterSpacing = '0px';
    slamDo(t, TL.start, 540, SY1 - SS * .36, () => { g.fillStyle = C.ink; g.fillText('START', X0, SY1); });
    if (t < TL.now) return;
    const beat = (t - TL.now) / BEAT, pulse = .5 + .5 * Math.exp(-((beat % 1) * 6));   // breathes on the kick
    // the word on a glossy floor: a faint mirror image under it (the "Focus on the mirror" reference, in brand type)
    slamDo(t, TL.now, 540, SY2 - SS * .36, () => {
      g.save(); g.translate(0, SY2 * 2 + 22); g.scale(1, -1); g.globalAlpha = .2; g.fillStyle = C.or; g.fillText('NOW', X0, SY2); g.restore();
      shade(SY2 + 10, SY2 + SS * .75, 0, .9);
      glow(`rgba(255,74,28,${(.35 + .4 * pulse).toFixed(3)})`, 30 + 40 * pulse, () => { g.fillStyle = C.or; g.fillText('NOW', X0, SY2); });
      g.fillStyle = C.ink; g.fillText('.', X0 + g.measureText('NOW').width, SY2);
    });
  }
  // ---------- 6 · sign-off
  function sign(t) {
    const y = 960, s1 = 'GAINSDOM', s2 = ' // THE DISCIPLINE ENGINE', all = s1 + s2, s = typed(all, TL.sign, t, 40);
    if (t >= TL.end) { cursor(X0 - 4, y, 36, t, false); return; }
    const w1 = mono(s.slice(0, 8), X0, y, 42, C.ink, 700), w2 = s.length > 8 ? mono(s.slice(8), X0 + w1, y, 42, C.dim, 500) : 0;
    cursor(X0 + w1 + w2, y, 42, t, s.length < all.length);
    if (t >= TL.tag) mono('stop waiting. start small. never miss twice.', X0, y + 76, 29, C.dim, 500);
  }

  // ---------- picture
  function picture(t) {
    g = main; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    camSet(t);
    if (t < TL.hook) cursor(X0 - 4, 960, 36, 0, true);                    // = the last frame: the film loops
    else if (t < TL.black1) { hook(t); if (t >= TL.win) crash(t); }
    else if (t < TL.you) { }                                               // black: the task is killed
    else if (t < TL.morph1) truth(t);
    else if (t < TL.collapse) installer(t);
    else if (t < TL.collapse + .16) {                                      // CRT-off: squash to a line, then to a point
      const k = p(t, TL.collapse, TL.collapse + .16), sy = Math.max(.004, 1 - E.expo(k / .6)), sx = k < .6 ? 1 : Math.max(.002, 1 - E.o3((k - .6) / .4));
      g.translate(540, 980); g.scale(sx, sy); g.translate(-540, -980); installer(TL.collapse); g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(242,242,240,${(.5 * k).toFixed(3)})`; g.fillRect(540 - 540 * sx, 976, 1080 * sx, 8); g.globalCompositeOperation = 'source-over';
    }
    else if (t < TL.start) cursor(X0 - 4, 960, 36, t - TL.collapse, false);
    else if (t < TL.glitch3 + .05) action(t);
    else sign(t);
    hud(t);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ---------- glitch: slices, orange ghost, noise blocks, a vertical jump (2–3 frames, 3 times in the film)
  const gb = mk(W, H), gx = gb.getContext('2d'), gt = mk(W, H), gtx = gt.getContext('2d');
  const GL = [[TL.glitch1, .05], [TL.glitch2, .05], [TL.glitch3, .05]];
  function glitch(t) {
    const gw = GL.find(([a, d]) => t >= a && t < a + d); if (!gw) return;
    const I = .6 + .4 * p(t, gw[0], gw[0] + gw[1]), f = Math.floor(t * 60), r = i => hash(f * 31 + i);
    gx.setTransform(1, 0, 0, 1, 0, 0); gx.clearRect(0, 0, W, H); gx.drawImage(cv, 0, 0);
    gtx.globalCompositeOperation = 'source-over'; gtx.clearRect(0, 0, W, H); gtx.drawImage(gb, 0, 0); gtx.globalCompositeOperation = 'multiply'; gtx.fillStyle = C.or; gtx.fillRect(0, 0, W, H); gtx.globalCompositeOperation = 'destination-in'; gtx.drawImage(gb, 0, 0);
    const m = main; m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = C.bg; m.fillRect(0, 0, W, H);
    const jump = (r(1) - .5) * 160 * I; m.drawImage(gb, 0, jump);
    m.globalCompositeOperation = 'lighter'; m.globalAlpha = .55; m.drawImage(gt, 22 * I, jump); m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 16; i++) { const y = r(i + 2) * H, h = 8 + r(i + 40) * 150, dx = (r(i + 80) - .5) * 260 * I; m.drawImage(gb, 0, y, W, h, dx, y + jump, W, h); }
    for (let i = 0; i < 7; i++) { m.fillStyle = r(i + 120) > .7 ? C.or : C.ink; m.globalAlpha = .7; m.fillRect(r(i + 130) * W, r(i + 140) * H, 30 + r(i + 150) * 300, 4 + r(i + 160) * 18); }
    m.globalAlpha = 1;
  }

  // ---------- finish: grain, scan lines + a slow roll band, vignette
  const grainTile = mk(256, 256); { const x = grainTile.getContext('2d'), d = x.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i * .37) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); }
  const scan = mk(W, H); { const x = scan.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < H; y += 4) x.fillRect(0, y, W, 1); }
  let grainPat = null;
  const blC = mk(270, 480), blX = blC.getContext('2d');
  function finish(t) {
    const m = main; m.setTransform(1, 0, 0, 1, 0, 0);
    if (t < TL.black1 || (t >= TL.waiting && t < TL.glitch2) || (t >= TL.install && t < TL.collapse) || (t >= TL.start && t < TL.glitch3)) {
      blX.globalCompositeOperation = 'source-over'; blX.filter = 'brightness(.75) contrast(3.2)'; blX.drawImage(cv, 0, 0, 270, 480); blX.filter = 'blur(7px)'; blX.drawImage(blC, 0, 0); blX.filter = 'none';
      m.save(); m.globalCompositeOperation = 'screen'; m.globalAlpha = .2; m.drawImage(blC, 0, 0, W, H); m.restore();
    }
    m.drawImage(scan, 0, 0);
    const by = ((t * 260) % (H + 600)) - 300, bg = m.createLinearGradient(0, by - 300, 0, by + 300); bg.addColorStop(0, 'rgba(242,242,240,0)'); bg.addColorStop(.5, 'rgba(242,242,240,.025)'); bg.addColorStop(1, 'rgba(242,242,240,0)');
    m.fillStyle = bg; m.fillRect(0, by - 300, W, 600);
    const vg = m.createRadialGradient(540, 960, 520, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); m.fillStyle = vg; m.fillRect(0, 0, W, H);
    if (!grainPat) grainPat = m.createPattern(grainTile, 'repeat');
    const fi = Math.floor(t * 30); m.save(); m.translate((fi * 97) % 256 - 128, (fi * 61) % 256 - 128); m.fillStyle = grainPat;
    m.globalCompositeOperation = 'overlay'; m.globalAlpha = .16; m.fillRect(-128, -128, W + 256, H + 256);
    m.globalCompositeOperation = 'screen'; m.globalAlpha = .045; m.fillRect(-128, -128, W + 256, H + 256); m.restore();
  }

  // ---------- motion blur on every fast move: 5 sub-frames over a 180° shutter, averaged in float
  const MBW = [[TL.hook, TL.hook + .12], [TL.wait1 - .14, TL.wait1 + .1], [TL.wait2, TL.wait2 + .1], [TL.wait3, TL.wait3 + .1], [TL.win, TL.win + .12], [TL.cur0, TL.click], [TL.you, TL.you + .12], [TL.notLazy, TL.notLazy + .12],
    [TL.roll, TL.waiting + .12], [TL.strike0, TL.strike1], [TL.morph0, TL.install + .12], [TL.collapse, TL.collapse + .17], [TL.start, TL.start + .12], [TL.now, TL.now + .12]];
  let ACC = null;
  function frame(t) {
    if (!MBW.some(([a, b]) => t >= a && t < b)) picture(t);
    else { const N = 5, sh = 1 / 120; if (!ACC) ACC = new Float32Array(W * H * 4); ACC.fill(0);
      for (let j = 0; j < N; j++) { picture(clamp(t + sh * (j / (N - 1) - .5), 0, DUR)); const d = main.getImageData(0, 0, W, H).data; for (let i = 0; i < d.length; i++) ACC[i] += d[i]; }
      const out = main.createImageData(W, H), od = out.data; for (let i = 0; i < od.length; i++) od[i] = ACC[i] / N; main.putImageData(out, 0, 0); }
    glitch(t); finish(t);
  }

  window.VH_SCENES = [['Hook · 99%', 0, TL.win], ['Crash', TL.win, TL.you], ['Truth', TL.you, TL.morph1], ['Tool · install', TL.morph1, TL.collapse],
    ['Silence', TL.collapse, TL.start], ['Action', TL.start, TL.glitch3], ['Sign-off', TL.glitch3, DUR]].map(([name, t0, t1]) => ({ name, t0, t1 }));
  window.VH_EVENTS = EV.map(([type, t, ex]) => Object.assign({ type, t }, ex || {}));
  window.renderOut = t => frame(clamp(+t || 0, 0, DUR));

  (async () => {
    const faces = [[AN, 'anton-latin-400-normal.woff2', '400'], [JB, 'jetbrains-mono-latin-400-normal.woff2', '400'], [JB, 'jetbrains-mono-latin-500-normal.woff2', '500'], [JB, 'jetbrains-mono-latin-700-normal.woff2', '700']];
    for (const [fam, file, weight] of faces) { const f = new FontFace(fam, `url(fonts/${file})`, { weight }); document.fonts.add(f); await f.load(); }
    await document.fonts.ready;
    const loads = [];
    for (const [name, m] of Object.entries(SHOTS)) { IMG[name] = []; for (let i = 0; i < m.n; i++) { const im = new Image(); loads.push(new Promise(r => { im.onload = im.onerror = r; })); im.src = `assets/shots/${name}/${String(i).padStart(3, '0')}.jpg`; IMG[name].push(im); } }
    await Promise.all(loads);
    TS = fit('NOT LAZY.', XR - X0); LY2 = LY1 + TS * .96; SS = fit('START', XR - X0); SY1 = 960 - SS * .1; SY2 = SY1 + SS * .93;
    window.renderOut(0);
    window.READY = true;
  })();
})();
