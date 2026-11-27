// scene.js: the whole film as pure functions of time. No DOM, no state: also runs in Node for checks.
// World units are page pixels. x right, y down the page, z up off the page (right-handed).

export const W = 1440, H = 1152, F = 1880;          // frame and focal length (px)
export const PAGE_W = 1440, PAGE_H = 5808;
export const DURATION = 14.5;
export const HERO_BOTTOM = 900;                       // the hero section ends here; it becomes the end card

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
const lin = (a, b, x) => clamp((x - a) / (b - a));
export const s5 = (a, b, x) => { const t = lin(a, b, x); return t * t * t * (t * (6 * t - 15) + 10); };   // C2 smootherstep
export const outCubic = (a, b, x) => 1 - (1 - lin(a, b, x)) ** 3;
export const outExpo = (a, b, x) => { const t = lin(a, b, x); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- glide: one speed curve, integrated
const TILT0 = 56 * DEG;
const Y0 = 520;                 // look-at at t=0: the hero, the prompt mockup just above centre, its top half above
const FOOTER_TITLE_Y = 4810;    // "Ready to bring your idea to life?" centre: sharp at 8.0s

export function speedShare(t) {
  if (t <= 0.6) return 0.5 * s5(0, 0.6, t);
  if (t <= 1.25) return 0.5;
  if (t <= 1.6) return 0.5 + 0.5 * s5(1.25, 1.6, t);
  if (t <= 7.3) return 1.0;
  return 1.0 - 0.88 * s5(7.3, 8.3, t);              // eases to 0.12 by 8.3
}
const DT = 1 / 4000, NT = Math.ceil(10 / DT) + 2;
const INTEG = new Float64Array(NT);
for (let i = 1; i < NT; i++) INTEG[i] = INTEG[i - 1] + 0.5 * (speedShare((i - 1) * DT) + speedShare(i * DT)) * DT;
const integ = t => { const x = clamp(t, 0, 9.99) / DT, i = Math.floor(x); return INTEG[i] + (INTEG[i + 1] - INTEG[i]) * (x - i); };
export const CRUISE = (FOOTER_TITLE_Y - Y0) / integ(8.0);   // page px per second at share 1.0
export const glideY = t => Y0 + CRUISE * integ(t);

// ---------------------------------------------------------------- distance and the rise
const dFlight = t => 1360 + 340 * (1 - (1 - clamp(t / 8.2)) ** 2);   // eases out, never back in
const BOTTOM_LINE = H - 42;                                           // the page's bottom edge settles here
export const D_STRIP = F * PAGE_H / (H - 2 * 42);                     // whole page as one strip, 42px top and bottom
const RA = 7.75, RB = 8.35, RC = 8.95, RD = 9.25;                     // trapezoid speed in log scale
function trapInt(t) {                                                 // ∫ speed profile (peak 1)
  const a = RB - RA, b = RD - RC;
  if (t <= RA) return 0;
  if (t <= RB) { const x = t - RA; return x / 2 - a / (2 * Math.PI) * Math.sin(Math.PI * x / a); }
  if (t <= RC) return a / 2 + (t - RB);
  const x = Math.min(t, RD) - RC;
  return a / 2 + (RC - RB) + x / 2 + b / (2 * Math.PI) * Math.sin(Math.PI * x / b);
}
const TRAP_TOTAL = trapInt(RD);
const ZV = Math.log(D_STRIP / dFlight(RD)) / TRAP_TOTAL;
const distRise = t => dFlight(t) * Math.exp(ZV * trapInt(t));
export const tiltAt = t => TILT0 * (1 - s5(8.15, 8.95, t));

// look-at that holds the page's bottom edge on BOTTOM_LINE for a given distance and tilt
function bottomPinnedY(d, th) {
  const k = (BOTTOM_LINE - H / 2) / F;
  return PAGE_H - k * d / (Math.cos(th) + k * Math.sin(th));
}

// ---------------------------------------------------------------- overhead, dive, end card (scale = F / d)
export const S_STRIP = F / D_STRIP;
export const S_CARD = 1018 / PAGE_W;
export const CARD_TOP = 283;
const OV0 = 9.25, OV1 = 9.47, DV1 = 9.97;
const CREEP = Math.log(1 / 0.965);
const CREEP_V = 2 * CREEP / (OV1 - OV0);       // log-scale speed at the end of the creep (ease-in)
function lnScale(t) {
  if (t <= OV1) { const u = lin(OV0, OV1, t); return Math.log(S_STRIP) + CREEP * u * u; }
  const base = Math.log(S_STRIP) + CREEP;
  if (t <= DV1) {
    const u = lin(OV1, DV1, t), L = Math.log(S_CARD) - base, m0 = CREEP_V * (DV1 - OV1);
    return base + L * (3 * u * u - 2 * u * u * u) + m0 * (u - 2 * u * u + u * u * u);   // Hermite: no hitch from the creep
  }
  const u = lin(DV1, DURATION, t);
  return Math.log(S_CARD) + Math.log(1.02) * (1 - Math.cos(u * Math.PI / 2));          // creeping 2% closer, never still
}
const TOP_PIN = H / 2 - Math.exp(lnScale(OV1)) * PAGE_H / 2;          // page top edge at the start of the dive
const CARD_CY = CARD_TOP + S_CARD * HERO_BOTTOM / 2;                  // card centre on screen when it lands

// ---------------------------------------------------------------- camera
export function camera(t) {
  let d, th, ly;
  if (t < OV0) {
    d = distRise(t); th = tiltAt(t);
    const w = s5(8.3, 8.65, t);
    ly = lerp(glideY(t), bottomPinnedY(d, th), w);
  } else {
    th = 0;
    const s = Math.exp(lnScale(t)); d = F / s;
    if (t <= OV1) ly = PAGE_H / 2;
    else if (t <= DV1) {
      const u = lin(OV1, DV1, t);
      const top = lerp(TOP_PIN, CARD_TOP, s5(0.42, 1, u));           // top edge pinned, then drops to y 283
      ly = (H / 2 - top) / s;
    } else ly = HERO_BOTTOM / 2 - (CARD_CY - H / 2) / s;              // creep about the card centre
  }
  const lx = PAGE_W / 2;
  const st = Math.sin(th), ct = Math.cos(th);
  const pos = [lx, ly + d * st, d * ct];
  return { t, d, th, lx, ly, pos, r: [1, 0, 0], u: [0, -ct, st], f: [0, -st, -ct], focus: d };
}

export function project(cam, P) {
  const v = [P[0] - cam.pos[0], P[1] - cam.pos[1], P[2] - cam.pos[2]];
  const zc = v[0] * cam.f[0] + v[1] * cam.f[1] + v[2] * cam.f[2];
  const xc = v[0], yu = v[1] * cam.u[1] + v[2] * cam.u[2];
  return [W / 2 + F * xc / zc, H / 2 - F * yu / zc, zc];
}
export function worldFromScreen(cam, sx, sy, zc) {
  const a = (sx - W / 2) * zc / F, b = (H / 2 - sy) * zc / F;
  return [0, 1, 2].map(i => cam.pos[i] + cam.f[i] * zc + cam.r[i] * a + cam.u[i] * b);
}

// focus follows whatever crosses the middle of the frame (page plane at the centre is at distance d),
// pulled toward lifted pieces at the centre, averaged over the last 0.2s so the pull is smooth and stateless
export function focusAt(t, layers) {
  let acc = 0, n = 0;
  for (let k = 0; k < 8; k++) {
    const tk = Math.max(0, t - 0.2 * k / 7), cam = camera(tk);
    let fz = cam.d;
    if (layers) for (const L of layers) {
      const st = pieceState(L, tk); if (!st.visible) continue;
      const cx = L.x + L.w / 2 + st.dx, cy = L.y + L.h / 2 + st.dy;
      if (Math.abs(cam.lx - cx) < L.w / 2 && Math.abs(cam.ly - cy) < L.h / 2 * Math.cos(st.phi) + 40) {
        const zc = project(cam, [cam.lx, cy, st.z])[2]; if (zc < fz) fz = zc;
      }
    }
    acc += fz; n++;
  }
  return acc / n;
}

// ---------------------------------------------------------------- the page mask (dive)
export function pageMask(t) {
  const fade = s5(9.47, 9.80, t);                                     // below the hero fades into the floor
  const bottom = lerp(PAGE_H, HERO_BOTTOM, s5(9.60, 9.93, t));        // then the mask closes on the hero
  const radius = lerp(24, 38 / S_CARD, s5(9.47, 9.97, t));           // 24px page corners → 38px card corners
  return { x: 0, y: 0, w: PAGE_W, h: bottom, radius, fade, shadowBottom: lerp(bottom, HERO_BOTTOM, fade) };
}

// ---------------------------------------------------------------- lifted pieces
const BASE = { mockup: 28, chip: 30, button: 20, card: 26, photo: 34, testimonial: 22 };
const SETTLE = t => s5(5.0, 7.4, t);    // section-two lifts settle back once they are out of frame
export function pieceState(L, t) {
  const st = { z: BASE[L.role] ?? 24, phi: 0, dx: 0, dy: 0, fade: 0, cut: false, visible: true, edge: 0 };
  const m = pageMask(t);
  if (L.group !== 'hero') { st.fade = m.fade; st.cut = m.fade >= 0.999; }
  const id = L.id;
  if (L.group === 'hero') {
    const CHIP = { nav_login: [6, 64, 0], nav_start: [6, 78, 0.05], hero_plus: [31, 72, 0.1] }[id];
    if (CHIP) {   // the hero's chips rise to 60-80px and stand up 30°, then settle once out of frame
      const [z0, peak, delay] = CHIP, e = s5(0.1 + delay, 1.35, t), back = s5(4.0, 7.5, t);
      st.z = lerp(z0, lerp(peak, z0 + 6, back), e); st.phi = 30 * DEG * e * (1 - back);
    }
    return st;
  }
  if (L.group === 'p2') {
    const e = s5(1.35, 2.7, t), back = SETTLE(t);
    const P = {
      p2_phone_l: [118, 46], p2_launch: [104, 46], p2_phone_r: [128, 46],
      p2_revenue: [40, 16], p2_dark: [36, 14], p2_filter: [36, 14], p2_habit: [42, 16],
      b_revenue: [52, 22], b_dark: [46, 20], b_launch: [56, 24], b_filter: [46, 20], b_habit: [50, 22],
      p2_templates: [24, 0], p2_start: [26, 0],
    }[id];
    if (id === 'b_mobile' || id === 'b_story') {
      const fly = s5(1.35, 2.55, t), side = id === 'b_mobile' ? -1 : 1;
      st.z = lerp(st.z, 200, fly * (1 - back)); st.phi = 54 * DEG * fly * (1 - back);
      st.dx = side * 150 * fly * (1 - back); st.dy = -40 * fly * (1 - back);
    } else if (P) { st.z = lerp(st.z, P[0], e * (1 - back) + 0.35 * e * back); st.phi = P[1] * DEG * e * (1 - back); }
    return st;
  }
  if (id === 'testimonial') {
    const e = s5(5.45, 6.3, t);
    st.z = lerp(22, 112, e); st.phi = 30 * DEG * e; st.edge = 71 * e;   // 71 world px reads as a 34px edge on screen at 6.3s
    return st;
  }
  // everything else lifts a little as the camera reaches it: from the bottom of the frame to its middle
  const cy = L.y + L.h / 2, near = s5(cy - 900, cy - 60, glideY(Math.min(t, 8.3)));
  const extra = L.role === 'photo' ? [30, 18] : L.role === 'card' ? [16, 10] : L.role === 'mockup' ? [14, 0] : [8, 0];
  st.z += extra[0] * near; st.phi = extra[1] * DEG * near;
  return st;
}

// ---------------------------------------------------------------- the four logo tiles
// Returns world centre, world size and orientation weight (0 = flat on the page, 1 = facing the lens).
const TILE_START = i => [1072 + i * 40 + 16, 457 + 16, 1];      // four 32px tiles beside the prompt's Build button
const TILE_HANG = [ // where they hang at 1.35s, in screen space: just outside the page's top corners
  { sx: 86, sy: 118, size: 196, k: 0.80 }, { sx: 262, sy: 40, size: 142, k: 0.86 },
  { sx: 1186, sy: 44, size: 150, k: 0.86 }, { sx: 1358, sy: 128, size: 178, k: 0.80 },
];
let _hang = null;
function hangTargets() {
  if (_hang) return _hang;
  const cam = camera(1.35);
  _hang = TILE_HANG.map(h => {
    // depth: a fraction of the page's depth under that screen point, so they float between lens and page
    const pageZ = rayPageDepth(cam, h.sx, h.sy), zc = pageZ * h.k;
    return { P: worldFromScreen(cam, h.sx, h.sy, zc), size: h.size * zc / F };
  });
  return _hang;
}
function rayPageDepth(cam, sx, sy) {
  const a = (sx - W / 2) / F, b = (H / 2 - sy) / F;
  const dz = cam.f[2] + cam.u[2] * b;
  return dz < -1e-4 ? -cam.pos[2] / dz : 1e5;
}
// end card, in camera space: x, y on screen, depth as a share of the card's depth, size on screen
const TILE_END = [
  { sx: 226, sy: 292, k: 0.955, size: 92, from: [-40, -520], drift: [-4, -3] },
  { sx: 1212, sy: 292, k: 0.996, size: 104, from: [40, -520], drift: [5, -2] },
  { sx: 118, sy: 1110, k: 0.30, size: 520, from: [-420, 380], drift: [-9, 5] },
  { sx: 1322, sy: 1060, k: 0.34, size: 450, from: [420, 380], drift: [8, 4] },
];
export function tileState(i, t) {
  // flight: lift, grow, hang outside the top corners, trail 300px down the page, drift out of the top
  if (t < 2.7) {
    const e = s5(0.1 + i * 0.06, 1.35, t), hang = hangTargets()[i], S = TILE_START(i);
    const P = [0, 1, 2].map(k => lerp(S[k], hang.P[k], e));
    P[1] += 300 * s5(1.2, 2.4, t);
    return { visible: true, P, size: lerp(32, hang.size, e), face: e };
  }
  // one tile comes back past the left edge, close to the lens and soft, at 5.4s
  if (i === 2 && t > 4.6 && t < 6.2) {
    const cam = camera(t), u = lin(4.6, 6.2, t);
    const sx = lerp(230, -260, u), sy = lerp(1300, 440, u), zc = 470;
    return { visible: true, P: worldFromScreen(cam, sx, sy, zc), size: 230 * zc / F, face: 1 };
  }
  // end card: drift in during the dive and sit on the card's corners; bottom pair as huge soft blurs
  if (t >= 9.5) {
    const cam = camera(t), E = TILE_END[i], cardZ = cam.d;
    const e = outCubic(9.55 + i * 0.04, 10.3, t), h = lin(10.3, DURATION, t);
    const sx = E.sx + E.from[0] * (1 - e) + E.drift[0] * h, sy = E.sy + E.from[1] * (1 - e) + E.drift[1] * h;
    const zc = cardZ * E.k;
    return { visible: true, P: worldFromScreen(cam, sx, sy, zc), size: E.size * zc / F, face: 1 };
  }
  return { visible: false };
}

// ---------------------------------------------------------------- title card
export const TITLE = {
  badgeY: 44, badgeIn: 10.02,
  line1: { text: 'Every page started', size: 74, at: 10.12, step: 0.06, baseline: 176 },
  line2: { text: 'as a sentence.', size: 82, at: 10.36, step: 0.05, baseline: 254, color: '#8b8b92' },
  rise: 16, blur: 12, dur: 0.34,
};

// ---------------------------------------------------------------- sound cues (seconds)
export const CUES = { whooshRise: 8.66, whooshDive: 9.80, hit: 9.97 };
