// ATTENTION STACKS: one continuous camera through 47 frosted-glass browser tabs.
// Every frame is a pure function of t (render(t) is driven by a paused GSAP timeline).
Promise.all([document.fonts.load('640 150px "Geist"'), document.fonts.load('500 28px "Geist Mono"')]).then(function () {
  const FPS = 30;
  const DUR = 20;
  const $ = (id) => document.getElementById(id);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eo = (x) => 1 - Math.pow(1 - x, 4); // fast type ease
  const ei = (x) => x * x * x; // exits accelerate away
  const sst = (x) => x * x * x * (x * (x * 6 - 15) + 10);
  function mulberry(a) {
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry(47);

  // ================= camera =================
  const CX = 470; // optical centre = centre of the mobile safe zone
  const CY = 900;
  const FL = 1000; // an element 1000 px in front of the lens draws at scale 1
  const PS = 1.3; // pane size multiplier
  const PW = 560 * PS;
  const PH = 352 * PS;

  // beat 1: rush through the tunnel of tabs, then land softly on the first line
  const rush = (t) => ({ x: -70 + 36 * t, y: -20 + 14 * t, z: 1150 * (1 - Math.exp(-t / 0.55)) + 60 * t });
  const C3 = rush(3);
  const V3 = { x: 36, y: 14, z: (1150 / 0.55) * Math.exp(-3 / 0.55) + 60 };
  const S1 = { x: 900, y: -160, z: 2600 }; // "still running"
  const S1b = { x: 920, y: -160, z: 2720 };
  const S2 = { x: 180, y: 300, z: 3500 }; // "tired after doing nothing": dead stop
  const LOCK = { x: -260, y: 120, z: 4700 }; // the one viewpoint where "Attention stacks." assembles

  // the stack: 46 tabs on one axis in front of the lens, receding up-right like a deck of glass
  const SLOT0 = 1000;
  const STEP = 40;
  const slotC = (k) => ({ x: LOCK.x + 10 * k, y: LOCK.y + 160 - 12 * k, z: LOCK.z + SLOT0 + STEP * k });
  const TASKC = { x: LOCK.x + 10 * 46, y: LOCK.y + 160 - 12 * 46, z: LOCK.z + SLOT0 + STEP * 46 + 150 };
  const FINAL = { x: TASKC.x, y: TASKC.y - (1080 - CY) * 1.08, z: TASKC.z - 1080 };

  const P = (o) => [o.x, o.y, o.z];
  const K = [
    { t: 3.0, p: P(C3), m: P(V3) },
    { t: 4.15, p: P(S1), m: [12, 0, 63] },
    { t: 6.05, p: P(S1b), m: [0, 0, 0] },
    { t: 6.75, p: P(S2), stop: 1 },
    { t: 9.6, p: P(S2), stop: 1 },
    { t: 11.9, p: P(LOCK), m: [0, 0, 50] },
    { t: 13.0, p: [LOCK.x, LOCK.y, LOCK.z + 60] },
    { t: 15.4, p: [LOCK.x, LOCK.y, LOCK.z + 250] },
    { t: 17.6, p: P(FINAL), m: [0, 0, 40] },
    { t: 20.0, p: [FINAL.x, FINAL.y, FINAL.z + 90], stop: 1 },
  ];
  K.forEach((k, i) => {
    if (k.m) return;
    if (k.stop || i === 0 || i === K.length - 1) k.m = [0, 0, 0];
    else k.m = k.p.map((_, j) => (K[i + 1].p[j] - K[i - 1].p[j]) / (K[i + 1].t - K[i - 1].t));
  });
  function herm(p0, m0, p1, m1, s, h) {
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * h * m1;
  }
  function roll(t) {
    if (t < 3) return -1.6 + 0.45 * t;
    if (t < 9.6) return lerp(-0.25, 0.7, sst(seg(t, 3, 6.75)));
    return lerp(0.7, 0, sst(seg(t, 9.6, 11.9)));
  }
  function cam(t) {
    let c;
    if (t <= 3) c = rush(t);
    else {
      let i = 0;
      while (i < K.length - 2 && t > K[i + 1].t) i++;
      const a = K[i];
      const b = K[i + 1];
      const h = b.t - a.t;
      const s = clamp((t - a.t) / h, 0, 1);
      const v = a.p.map((x, j) => herm(x, a.m[j], b.p[j], b.m[j], s, h));
      c = { x: v[0], y: v[1], z: v[2] };
    }
    c.roll = roll(t);
    return c;
  }
  function proj(c, x, y, z) {
    const dz = z - c.z;
    const s = FL / dz;
    return { dz, s, X: CX + (x - c.x) * s, Y: CY + (y - c.y) * s };
  }

  // ================= depth of field =================
  function coc(dz, fd, ap) {
    if (dz < fd) return clamp(30 * (fd / dz - 1) * ap, 0, 46);
    return clamp(30 * (1 - fd / dz) * ap, 0, 24);
  }
  const apAt = (t) => 1 - 0.88 * sst(seg(t, 11.55, 11.9)) + 0.88 * sst(seg(t, 12.9, 13.3));

  // ================= tabs =================
  const TITLES = ["reply to coach", "meal prep list", "that email", "finish the set", "call mom back", "taxes 2026", "form check video", "the essay", "book the dentist", "return the package", "budget sheet", "protein order", "job application", "fix the bike", "read ch. 4", "gym playlist", "renew passport", "pay rent", "group chat", "edit the video", "cancel that sub", "laundry", "learn spanish", "update CV"];
  const world = $("world");
  const panes = [];
  function makePane(i, x, y, z, opensAt) {
    const e = document.createElement("div");
    e.className = "pane";
    const p = Math.round(18 + rnd() * 66);
    const lines = [0, 1, 2, 3].map((k) => `<div class="ln" style="top:${136 + k * 32}px;width:${Math.round(180 + rnd() * 300)}px"></div>`).join("");
    e.innerHTML = `<div class="bar"><div class="fav"></div><div class="ttl">${TITLES[i % TITLES.length]}</div><div class="spin"></div><div class="ok"></div><div class="x">×</div></div><div class="ghost"></div><div class="plus">+</div><div class="load"></div><div class="addr"></div>${lines}<div class="pct">${p}%</div><div class="prog"><i style="width:${p}%"></i></div>`;
    world.appendChild(e);
    const o = { e, i, x, y, z, opensAt, p, ph: rnd() * 360, lp: rnd() };
    ["spin", "ok", "load", "pct", "ghost", "plus"].forEach((k) => (o[k] = e.querySelector("." + k)));
    o.fill = e.querySelector(".prog i");
    panes.push(o);
    return o;
  }

  // headline stations, so tunnel tabs in front of a line never cover it
  const ZH1 = C3.z + 1150;
  const STATIONS = [
    { c: C3, z: ZH1, box: { l: 110, r: 860, t: 760, b: 1010 } },
    { c: S1, z: S1.z + 1150, box: { l: 110, r: 860, t: 770, b: 1010 } },
    { c: S1b, z: S1b.z + 1150, box: { l: 110, r: 860, t: 770, b: 1010 } },
    { c: S2, z: S2.z + 1150, box: { l: 110, r: 860, t: 690, b: 1150 } },
  ];
  function covers(x, y, z) {
    for (const st of STATIONS) {
      if (z <= st.c.z + 80 || z >= st.z + 60) continue;
      const q = proj(st.c, x, y, z);
      const w = PW * q.s;
      const h = PH * q.s;
      if (q.X < st.box.r && q.X + w > st.box.l && q.Y < st.box.b && q.Y + h > st.box.t) return true;
    }
    return false;
  }
  for (let i = 0; i < 41; i++) {
    const z = i < 5 ? 280 + i * 150 + rnd() * 50 : 1050 + (i - 5) * 190 + rnd() * 90;
    const th = i * 2.39996 + rnd() * 0.5;
    let r = i < 5 ? 150 + rnd() * 120 : 560 + rnd() * 420;
    const at = () => ({ x: Math.cos(th) * r - PW / 2, y: Math.sin(th) * r * 1.55 - PH / 2 });
    let q = at();
    for (let k = 0; k < 16 && i >= 5 && covers(q.x, q.y, z); k++) {
      r *= 1.16;
      q = at();
    }
    makePane(i, q.x, q.y, z, -1);
  }
  const OPEN = [0.32, 0.58, 0.84, 1.1, 1.36, 1.62];
  OPEN.forEach((at, k) => {
    const th = 0.6 + k * 2.39996;
    let rr = 380 + (k % 3) * 120;
    const zz = 3000 + k * 230;
    const at2 = () => ({ x: Math.cos(th) * rr - PW / 2, y: Math.sin(th) * rr * 1.55 - PH / 2 });
    let q = at2();
    for (let j = 0; j < 16 && covers(q.x, q.y, zz); j++) {
      rr *= 1.16;
      q = at2();
    }
    const o = makePane(41 + k, q.x, q.y, zz, at);
    o.e.classList.add("new");
  });

  // the stack: the task ("finish the set") goes to the very back; the rest fill slots front->back
  // by tunnel depth, so the tabs already behind the camera sweep in last, to the front
  const task = panes.find((p) => TITLES[p.i % TITLES.length] === "finish the set");
  const rest = panes.filter((p) => p !== task).sort((a, b) => a.z - b.z);
  rest.forEach((p, k) => {
    p.k = k;
    p.ss = 9.7 + (45 - k) * 0.035;
    p.sd = 0.62;
    const c = slotC(k);
    p.slot = { x: c.x - PW / 2, y: c.y - PH / 2, z: c.z };
    p.closeAt = k < 5 ? [13.6, 14.2, 14.7, 15.05, 15.3][k] : 15.45 + (k - 5) * 0.026;
    p.closeDur = k < 5 ? 0.5 : 0.3;
    p.tickAt = k < 5 ? p.closeAt - 0.32 : p.closeAt - 0.07;
  });
  task.k = 46;
  task.ss = 9.62;
  task.sd = 0.7;
  task.slot = { x: TASKC.x - PW / 2, y: TASKC.y - PH / 2, z: TASKC.z };
  task.closeAt = 99;
  task.isTask = true;

  // where a tab is at time t
  const cache = new Map();
  function tunnelPos(p, t) {
    if (p.opensAt >= 0) {
      const u = seg(t, p.opensAt, p.opensAt + 0.55);
      return { x: p.x, y: p.y, z: p.z + (1 - eo(u)) * 2600 };
    }
    return { x: p.x, y: p.y, z: p.z };
  }
  function fromPos(p) {
    if (cache.has(p)) return cache.get(p);
    const c = cam(p.ss);
    let f = tunnelPos(p, p.ss);
    if (f.z < c.z + 300) {
      // already behind the lens: it re-enters from the edge of frame
      let ux = f.x + PW / 2 - c.x;
      let uy = f.y + PH / 2 - c.y;
      const l = Math.hypot(ux, uy) || 1;
      ux /= l;
      uy /= l;
      f = { x: c.x + ux * 1300 - PW / 2, y: c.y + uy * 2300 - PH / 2, z: c.z + 650 };
    }
    cache.set(p, f);
    return f;
  }
  function paneAt(p, t) {
    let pos;
    if (t < p.ss) pos = tunnelPos(p, t);
    else {
      const f = fromPos(p);
      const u = sst(seg(t, p.ss, p.ss + p.sd));
      pos = { x: lerp(f.x, p.slot.x, u), y: lerp(f.y, p.slot.y, u), z: lerp(f.z, p.slot.z, u) };
    }
    let fade = 1;
    if (t >= p.closeAt) {
      const u = seg(t, p.closeAt, p.closeAt + p.closeDur);
      pos = { x: pos.x - 1900 * ei(u), y: pos.y - 140 * ei(u), z: pos.z };
      fade = 1 - u * u;
    }
    return { pos, fade };
  }

  // ================= headlines in the world =================
  function makeHead(lines, ref, dzRef, top, extra) {
    const e = document.createElement("div");
    e.className = "hd";
    const k = dzRef / FL;
    e.innerHTML =
      lines.map((l) => `<span class="hl ${l.cls || ""}" style="font-size:${(l.px * k).toFixed(2)}px">${l.html}</span>`).join("") + (extra ? extra(k) : "");
    world.appendChild(e);
    return { e, x: ref.x + (140 - CX) * k, y: ref.y + (top - CY) * k, z: ref.z + dzRef, lines: [...e.querySelectorAll(".hl")] };
  }
  const H1 = makeHead(
    [
      { html: "Your brain has", px: 88 },
      { html: '<span class="n" id="cnt">41</span> tabs open.', px: 88 },
    ],
    C3,
    1150,
    790,
  );
  H1.ins = [1.05, 1.3];
  H1.out = 3.25;
  const H2 = makeHead(
    [
      { html: "Every unfinished task", px: 58, cls: "dim" },
      { html: 'is still <span class="r">running.</span>', px: 80 },
    ],
    S1,
    1150,
    800,
  );
  H2.ins = [3.85, 4.05];
  H2.out = 6.15;
  const H3 = makeHead(
    [
      { html: "That’s why you’re tired", px: 60 },
      { html: 'after doing <span class="g">nothing.</span>', px: 60 },
    ],
    S2,
    1150,
    720,
    (k) => `<div class="en3" id="en3" style="font-size:${(28 * k).toFixed(2)}px"><div class="lab">ENERGY</div><div class="val"><span id="e3v">100</span>%</div><div class="trk"><div class="fill" id="e3f"></div></div></div>`,
  );
  H3.ins = [6.8, 7.0, 7.2];
  H3.out = 9.65;
  H3.lines.push($("en3"));
  const c134 = cam(13.4);
  const H5 = makeHead([{ html: "Finish one.", px: 96 }], c134, LOCK.z + 950 - c134.z, 600);
  H5.ins = [13.25];
  H5.out = 15.1;
  H5.passLens = true;
  const H6 = makeHead(
    [
      { html: "Close one tab", px: 100 },
      { html: "before you open another.", px: 50, cls: "dim" },
    ],
    FINAL,
    960,
    540,
  );
  H6.ins = [17.35, 17.6];
  H6.out = 99;
  const HEADS = [H1, H2, H3, H5, H6];

  // ================= "Attention stacks.": fragments at different depths that only align at LOCK =================
  const FR = [];
  const measure = document.createElement("div");
  measure.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;font:640 150px/1 Geist;letter-spacing:-0.04em;white-space:nowrap";
  document.body.appendChild(measure);
  const LINES = [
    { y: 430, parts: [["Att", 640], ["en", 930], ["tion", 760]] },
    { y: 590, parts: [["sta", 880], ["cks.", 680]] },
  ];
  LINES.forEach((ln) => {
    measure.innerHTML = ln.parts.map(([w]) => `<span>${w}</span>`).join("");
    const spans = [...measure.children];
    ln.parts.forEach(([w, d], j) => {
      const xs = 140 + spans[j].offsetLeft;
      const k = d / FL;
      const e = document.createElement("div");
      e.className = "frag";
      e.textContent = w;
      e.style.fontSize = (150 * k).toFixed(3) + "px";
      world.appendChild(e);
      FR.push({ e, x: LOCK.x + (xs - CX) * k, y: LOCK.y + (ln.y - CY) * k, z: LOCK.z + d, j });
    });
  });
  measure.remove();

  // ================= focus =================
  function headDz(h, c) {
    return h.z - c.z;
  }
  function focusAt(t, c) {
    let f = 2600;
    f = lerp(f, headDz(H1, c), sst(seg(t, 0.85, 1.45)));
    f = lerp(f, headDz(H2, c), sst(seg(t, 3.2, 3.95)));
    f = lerp(f, headDz(H3, c), sst(seg(t, 6.2, 6.75)));
    f = lerp(f, LOCK.z + 800 - c.z, sst(seg(t, 9.6, 10.6)));
    f = lerp(f, headDz(H5, c), sst(seg(t, 12.9, 13.3)));
    f = lerp(f, TASKC.z - c.z - 60, sst(seg(t, 15.7, 16.8)));
    return Math.max(120, f);
  }

  // ================= render =================
  function place(e, q, b, op) {
    e.style.transform = `translate(${q.X.toFixed(2)}px, ${q.Y.toFixed(2)}px) scale(${q.s.toFixed(5)})`;
    e.style.zIndex = String(Math.round(20000 - q.dz));
    e.style.filter = b > 0.35 ? `blur(${(b / q.s).toFixed(2)}px)` : "none";
    e.style.opacity = op.toFixed(3);
  }
  function render(t) {
    const f = Math.round(t * FPS);
    const c = cam(t);
    world.style.transform = `rotate(${c.roll.toFixed(3)}deg)`;
    const fd = focusAt(t, c);
    const ap = apAt(t);
    let opened = 0;
    let closed = 0;
    for (const p of panes) {
      if (p.opensAt >= 0 && t >= p.opensAt) opened++;
      if (t >= p.closeAt + p.closeDur * 0.5) closed++;
      if (p.opensAt >= 0 && t < p.opensAt) {
        p.e.style.visibility = "hidden";
        continue;
      }
      const { pos, fade } = paneAt(p, t);
      const q = proj(c, pos.x, pos.y, pos.z);
      if (fade <= 0.01 || q.dz < 70 || q.X > 2600 || q.X + PW * q.s < -1500 || q.Y > 3400 || q.Y + PH * q.s < -1500) {
        p.e.style.visibility = "hidden";
        continue;
      }
      const fog = clamp((7000 - q.dz) / 3000, 0, 1) * (q.dz > fd ? lerp(1, 0.55, clamp((q.dz - fd) / 3000, 0, 1)) : 1);
      const near = clamp((q.dz - 70) / 120, 0, 1);
      const pop = p.opensAt >= 0 ? eo(seg(t, p.opensAt, p.opensAt + 0.3)) : 1;
      const b = coc(q.dz, fd, ap);
      const opB = lerp(1, 0.5, clamp(b / 46, 0, 1));
      const op = fog * near * pop * opB * fade;
      if (op < 0.01) {
        p.e.style.visibility = "hidden";
        continue;
      }
      p.e.style.visibility = "visible";
      p.e.style.transform = `translate(${q.X.toFixed(2)}px, ${q.Y.toFixed(2)}px) scale(${(q.s * PS).toFixed(5)})`;
      p.e.style.opacity = op.toFixed(3);
      p.e.style.filter = b > 0.35 ? `blur(${(b / (q.s * PS)).toFixed(2)}px)` : "none";
      p.e.style.zIndex = String(Math.round(20000 - q.dz));
      // running: spinner + an indeterminate loading sweep that never finishes
      const lu = (p.lp + t * 0.55) % 1;
      p.load.style.width = `${(120 + 140 * Math.sin(lu * Math.PI)).toFixed(1)}px`;
      p.load.style.transform = `translateX(${(-260 + lu * 820).toFixed(1)}px)`;
      p.spin.style.transform = `rotate(${(p.ph + t * (p.isTask && t > 16.6 ? 150 : 400)).toFixed(1)}deg)`;
      if (p.opensAt >= 0) p.e.classList.toggle("new", t - p.opensAt < 1.2);
      // finished: a green tick replaces the spinner, the bar fills green
      const done = p.tickAt !== undefined && t >= p.tickAt;
      p.ok.style.opacity = done ? 1 : 0;
      p.spin.style.visibility = done ? "hidden" : "inherit";
      p.load.style.visibility = done ? "hidden" : "inherit";
      if (done) {
        p.fill.style.width = "100%";
        p.fill.style.background = "#32d74b";
        p.fill.style.boxShadow = "0 0 14px rgba(50, 215, 75, 0.8)";
        p.pct.textContent = "100%";
        p.pct.style.color = "#32d74b";
      }
      if (p.isTask) {
        // the one task: actually progressing now, calmly
        const live = sst(seg(t, 16.8, 17.6));
        const pr = Math.round(lerp(p.p, Math.min(96, p.p + 34), sst(seg(t, 17.6, 20))));
        p.fill.style.width = pr + "%";
        p.pct.textContent = pr + "%";
        p.fill.style.background = live > 0.5 ? "#32d74b" : "";
        p.fill.style.boxShadow = live > 0.5 ? "0 0 14px rgba(50, 215, 75, 0.8)" : "";
        p.pct.style.color = live > 0.5 ? "#32d74b" : "";
        p.spin.style.borderTopColor = live > 0.5 ? "#32d74b" : "";
        p.spin.style.boxShadow = live > 0.5 ? "0 0 12px rgba(50, 215, 75, 0.6)" : "";
        p.load.style.background = live > 0.5 ? "linear-gradient(90deg, rgba(50,215,75,0), #5ee07a 40%, #d8ffe0 70%, rgba(50,215,75,0))" : "";
        p.load.style.boxShadow = live > 0.5 ? "0 0 18px 2px rgba(50, 215, 75, 0.7)" : "";
        // a new tab tries to open, and is held back
        const g1 = seg(t, 18.7, 19.0);
        const g2 = seg(t, 19.15, 19.45);
        const gx = 60 * eo(g1) * (1 - sst(g2));
        p.ghost.style.opacity = (0.85 * eo(g1) * (1 - g2)).toFixed(3);
        p.ghost.style.transform = `translateX(${gx.toFixed(1)}px)`;
        p.plus.style.color = t > 18.6 && t < 19.5 ? "rgba(255,69,58,0.9)" : "";
      }
    }

    // headlines
    for (const h of HEADS) {
      const q = proj(c, h.x, h.y, h.z);
      let vis = t >= h.ins[0] - 0.05 && t < h.out + 0.5 && q.dz > 90;
      if (!vis) {
        h.e.style.visibility = "hidden";
        continue;
      }
      h.e.style.visibility = "visible";
      const b = coc(q.dz, fd, ap);
      let op = 1 - eo(seg(t, h.out, h.out + 0.45));
      if (h.passLens) op *= clamp((q.dz - 150) / 260, 0, 1);
      place(h.e, q, b, op);
      h.lines.forEach((el, j) => {
        const u = eo(seg(t, h.ins[j], h.ins[j] + 0.7));
        const ob = seg(t, h.out, h.out + 0.45);
        el.style.opacity = u.toFixed(3);
        const bl = (1 - u) * 22 + ob * 18;
        el.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : "none";
        el.style.transform = `translate(${((1 - u) * -26 - ob * 30).toFixed(2)}px, ${((1 - u) * 34).toFixed(2)}px)`;
      });
    }
    // fragments of "Attention stacks."
    for (const fr of FR) {
      const q = proj(c, fr.x, fr.y, fr.z);
      const u = eo(seg(t, 9.85 + fr.j * 0.08, 10.55 + fr.j * 0.08));
      const ob = seg(t, 12.85, 13.2);
      const op = u * (1 - ob);
      if (op < 0.005 || q.dz < 90) {
        fr.e.style.visibility = "hidden";
        continue;
      }
      fr.e.style.visibility = "visible";
      const b = coc(q.dz, fd, ap) + (1 - u) * 18 + ob * 20;
      place(fr.e, q, b, op);
    }

    // counters, energy
    const n = 41 + opened - closed;
    $("cnt").textContent = String(41 + opened);
    $("sysN").textContent = String(n);
    $("sys").style.opacity = eo(seg(t, 0.15, 0.6)).toFixed(3);
    $("sysDot").style.opacity = f % 20 < 12 ? 1 : 0.35;
    $("sysDot").style.color = n === 1 ? "#32d74b" : "";
    const e3 = 100 - 91 * sst(seg(t, 7.3, 9.4));
    $("e3v").textContent = String(Math.round(e3));
    $("e3f").style.transform = `scaleX(${(e3 / 100).toFixed(4)})`;
    const ev = t < 13.6 ? 9 : 9 + 91 * sst(seg(t, 13.6, 16.6));
    $("en").style.opacity = eo(seg(t, 9.7, 10.2)).toFixed(3);
    $("enV").textContent = Math.round(ev) + "%";
    const g = clamp((ev - 9) / 91, 0, 1);
    const col = `rgb(${Math.round(lerp(255, 50, g))}, ${Math.round(lerp(69, 215, g))}, ${Math.round(lerp(58, 75, g))})`;
    $("enBar").style.background = col;
    $("enBar").style.boxShadow = `0 0 12px ${col}`;
    $("enBar").style.transform = `scaleX(${(ev / 100).toFixed(4)})`;
    $("enV").style.color = col;
    $("grT").setAttribute("seed", String((f % 24) + 1));
  }

  const tl = gsap.timeline({ paused: true });
  const DR = { _t: 0 };
  Object.defineProperty(DR, "t", {
    get() {
      return this._t;
    },
    set(v) {
      this._t = v;
      render(v);
    },
  });
  tl.fromTo(DR, { t: 0 }, { t: DUR, duration: DUR, ease: "none", immediateRender: false }, 0);
  render(0);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
});
