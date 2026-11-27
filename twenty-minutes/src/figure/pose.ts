// Point-light body: side view, facing +x. World units are body heights (H = 1),
// y up, ground at y = 0. Limbs are solved with 2-bone IK so lengths never stretch.
import { EASE } from "../theme";
import { clamp01, kf, lerp } from "../timeline";

export type P = { x: number; y: number };
export type Limbs = {
  shoulder: P;
  elbow: P;
  wrist: P;
  hip: P;
  knee: P;
  ankle: P;
  toe: P;
};
export type Skel = { head: P; neck: P; near: Limbs; far: Limbs };
export type JointName = keyof Limbs | "head";

export const L = {
  torso: 0.3,
  thigh: 0.245,
  shin: 0.245,
  ua: 0.17,
  fa: 0.16,
  ankleH: 0.035,
};

// Far-side limbs sit slightly behind the near side (camera is a touch in front).
const DEPTH: P = { x: -0.032, y: 0 };

const v = (x: number, y: number): P => ({ x, y });
const add = (a: P, b: P): P => v(a.x + b.x, a.y + b.y);
const mul = (a: P, s: number): P => v(a.x * s, a.y * s);
export const lerpP = (a: P, b: P, t: number): P => v(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
// 0° = up, 90° = forward (+x)
const dir = (deg: number): P => {
  const r = (deg * Math.PI) / 180;
  return v(Math.sin(r), Math.cos(r));
};
const unit = (a: P): P => {
  const d = Math.hypot(a.x, a.y) || 1;
  return v(a.x / d, a.y / d);
};
const rot = (a: P, deg: number): P => {
  const r = (deg * Math.PI) / 180;
  return v(a.x * Math.cos(r) - a.y * Math.sin(r), a.x * Math.sin(r) + a.y * Math.cos(r));
};

// Two-bone IK. bend = +1 rotates the middle joint counter-clockwise from a→b.
export const ik = (a: P, b: P, l1: number, l2: number, bend: 1 | -1): P => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-4), l1 + l2 - 1e-4);
  const base = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const ang = base + bend * A;
  return v(a.x + l1 * Math.cos(ang), a.y + l1 * Math.sin(ang));
};

const shift = (l: Limbs, d: P): Limbs => {
  const o = {} as Limbs;
  (Object.keys(l) as (keyof Limbs)[]).forEach((k) => (o[k] = add(l[k], d)));
  return o;
};

// ── SQUAT ────────────────────────────────────────────────────────────────────
export const squatDepth = (f: number) =>
  kf(f, [
    [-12, 0],
    [8, 0],
    [32, 1],
    [62, 1],
    [78, 0.04],
    [96, 0.92],
  ]);

export const squat = (f: number): Skel => {
  const p = squatDepth(f);
  const ankle = v(0, L.ankleH);
  const toe = v(0.1, 0);
  const hip = lerpP(v(-0.02, 0.52), v(-0.2, 0.275), p);
  const knee = ik(hip, ankle, L.thigh, L.shin, 1);
  const t = lerp(4, 40, p);
  const neck = add(hip, mul(dir(t), L.torso));
  const shoulder = add(hip, mul(dir(t), L.torso * 0.93));
  const head = add(neck, mul(dir(t * 0.55), 0.1));
  const elbow = add(shoulder, mul(dir(lerp(176, 90, p)), L.ua));
  const wrist = add(elbow, mul(dir(lerp(172, 84, p)), L.fa));
  const near: Limbs = { shoulder, elbow, wrist, hip, knee, ankle, toe };
  return { head, neck, near, far: shift(near, DEPTH) };
};

// ── PUSH-UP (full ⇄ knees-down) ─────────────────────────────────────────────
const HANDX = 0.743;
export const pushDepth = (f: number) =>
  kf(f, [
    [-12, 0],
    [4, 0],
    [22, 1],
    [27, 1],
    [44, 0],
    [60, 0],
    [78, 1],
    [83, 1],
    [100, 0],
    [134, 0],
  ]);
export const pushKneeMix = (f: number) => kf(f, [[76, 0], [94, 1]], EASE.inOut);

const plankLine = (pivot: P, reach: number, shoulderY: number) => {
  const th = Math.asin(Math.max(-1, Math.min(1, (shoulderY - pivot.y) / reach)));
  return v(Math.cos(th), Math.sin(th));
};

export const push = (f: number): Skel => {
  const p = pushDepth(f);
  const k = pushKneeMix(f);
  const sy = lerp(0.325, 0.1, p);
  // Full push-up: rigid line pivoting at the toes
  const A = v(0.02, 0.06);
  const u = plankLine(A, 0.77, sy);
  const full = {
    toe: v(0, 0),
    ankle: A,
    knee: add(A, mul(u, 0.245)),
    hip: add(A, mul(u, 0.49)),
    shoulder: add(A, mul(u, 0.77)),
    neck: add(A, mul(u, 0.79)),
    head: add(add(A, mul(u, 0.79)), mul(rot(u, 8), 0.1)),
  };
  // Knees-down: line pivots at the knee, shins resting back
  const K = v(0.305, 0.035);
  const uk = plankLine(K, 0.525, sy);
  const ka = add(K, v(-0.222, 0.1));
  const kneeV = {
    toe: add(ka, v(-0.075, -0.02)),
    ankle: ka,
    knee: K,
    hip: add(K, mul(uk, 0.245)),
    shoulder: add(K, mul(uk, 0.525)),
    neck: add(K, mul(uk, 0.545)),
    head: add(add(K, mul(uk, 0.545)), mul(rot(uk, 8), 0.1)),
  };
  const m = <T extends keyof typeof full>(key: T) => lerpP(full[key], kneeV[key], k);
  const shoulder = m("shoulder");
  const wrist = v(HANDX, 0.012);
  const elbow = ik(shoulder, wrist, L.ua, L.fa, -1);
  const near: Limbs = {
    shoulder,
    elbow,
    wrist,
    hip: m("hip"),
    knee: m("knee"),
    ankle: m("ankle"),
    toe: m("toe"),
  };
  return { head: m("head"), neck: m("neck"), near, far: shift(near, DEPTH) };
};

// ── REVERSE LUNGE ────────────────────────────────────────────────────────────
export const lungeDepth = (f: number) =>
  kf(f, [
    [-12, 0],
    [2, 0],
    [30, 1],
    [76, 1],
    [100, 0.25],
  ]);

export const lunge = (f: number): Skel => {
  const p = lungeDepth(f);
  const s = EASE.inOut(clamp01(p / 0.6));
  const d = EASE.inOut(clamp01((p - 0.28) / 0.72));
  // Front leg (near) stays planted
  const fAnkle = v(0.12, L.ankleH);
  const fToe = v(0.22, 0);
  const hip = add(lerpP(v(0.1, 0.52), v(-0.125, 0.3), d), v(-0.025 * Math.sin(Math.PI * s) * (1 - d), 0));
  const fKnee = ik(hip, fAnkle, L.thigh, L.shin, 1);
  // Back leg (far) steps back and lands on the ball of the foot
  const bAnkle = v(lerp(0.09, -0.37, s), lerp(L.ankleH, 0.07, d) + 0.05 * Math.sin(Math.PI * s));
  const bToe = add(bAnkle, lerpP(v(0.1, -L.ankleH), v(0.08, -0.07), d));
  const bKnee = ik(hip, bAnkle, L.thigh, L.shin, 1);
  const t = lerp(2, 6, d);
  const neck = add(hip, mul(dir(t), L.torso));
  const shoulder = add(hip, mul(dir(t), L.torso * 0.93));
  const head = add(neck, mul(dir(t), 0.1));
  const elbow = add(shoulder, mul(dir(lerp(178, 168, d)), L.ua));
  const wrist = add(elbow, mul(dir(lerp(176, 160, d)), L.fa));
  const near: Limbs = { shoulder, elbow, wrist, hip, knee: fKnee, ankle: fAnkle, toe: fToe };
  const farRaw: Limbs = {
    shoulder,
    elbow: add(shoulder, mul(dir(lerp(182, 192, d)), L.ua)),
    wrist: add(add(shoulder, mul(dir(lerp(182, 192, d)), L.ua)), mul(dir(lerp(184, 200, d)), L.fa)),
    hip,
    knee: bKnee,
    ankle: bAnkle,
    toe: bToe,
  };
  return { head, neck, near, far: shift(farRaw, DEPTH) };
};

// ── GLUTE BRIDGE ─────────────────────────────────────────────────────────────
export const bridgeLift = (f: number) =>
  kf(f, [
    [-12, 0],
    [4, 0],
    [26, 1],
    [44, 1],
    [50, 1.12],
    [66, 1.12],
    [72, 1],
    [96, 0.3],
  ]);

export const bridgeHipAt = (lift: number): P => {
  const base = lerp(3, 27, Math.min(lift, 1));
  const extra = lift > 1 ? ((lift - 1) / 0.12) * 3.5 : 0;
  const phi = ((base + extra) * Math.PI) / 180;
  return v(0.01 + L.torso * Math.cos(phi), 0.045 + L.torso * Math.sin(phi));
};

export const bridge = (f: number): Skel => {
  const lift = bridgeLift(f);
  const S = v(0.01, 0.045);
  const hip = bridgeHipAt(lift);
  const ankle = v(0.63, L.ankleH);
  const toe = v(0.73, 0);
  const knee = ik(hip, ankle, L.thigh, L.shin, 1);
  const near: Limbs = {
    shoulder: S,
    elbow: v(0.18, 0.018),
    wrist: v(0.34, 0.014),
    hip,
    knee,
    ankle,
    toe,
  };
  return { head: v(-0.095, 0.058), neck: v(0.0, 0.05), near, far: shift(near, DEPTH) };
};

// ── MOUNTAIN CLIMBERS ────────────────────────────────────────────────────────
// Cycles per frame: steady drive, then "Fast." doubles the tempo.
const omega = (f: number) => {
  if (f < 4) return 0;
  if (f < 66) return 1 / 22;
  if (f < 74) return lerp(1 / 22, 1 / 10, (f - 66) / 8);
  return 1 / 10;
};
export const climbPhase = (f: number) => {
  let c = 0;
  const step = 0.25;
  for (let x = 0; x < f; x += step) c += omega(x) * Math.min(step, f - x);
  return c * Math.PI * 2;
};

export const climb = (f: number): Skel => {
  const ph = climbPhase(f);
  const amp = clamp01((f - 2) / 8);
  const W0 = v(0.72, 0.012);
  const shoulder = v(0.74, 0.335);
  const u = unit(v(0.282, 0.103));
  const hip0 = add(shoulder, mul(u, -0.3));
  const bob = 0.012 * amp * Math.abs(Math.sin(ph));
  const hip = add(hip0, v(0, bob));
  const E = add(hip0, mul(unit(v(0.93, 0.366)), -0.49));
  const T = v(hip0.x + 0.06, 0.05);
  const smooth = (x: number) => x * x * (3 - 2 * x);
  const leg = (c: number) => {
    const ankle = add(lerpP(E, T, c), v(0, 0.05 * Math.sin(Math.PI * c)));
    const knee = ik(hip, ankle, L.thigh, L.shin, 1);
    const toe = add(ankle, lerpP(v(0.045, -0.045), v(0.06, -0.03), c));
    return { ankle, knee, toe };
  };
  const cNear = amp * smooth((1 - Math.cos(ph)) / 2);
  const cFar = amp * smooth((1 + Math.cos(ph)) / 2) * 0.85;
  const elbow = ik(shoulder, W0, L.ua, L.fa, -1);
  const neck = add(shoulder, mul(u, 0.03));
  const head = add(neck, mul(rot(u, -12), 0.1));
  const near: Limbs = { shoulder, elbow, wrist: W0, hip, ...leg(cNear) };
  const farRaw: Limbs = { shoulder, elbow, wrist: W0, hip, ...leg(cFar) };
  return { head, neck, near, far: shift(farRaw, DEPTH) };
};
