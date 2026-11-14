import { BundleState, Shot } from "./three/MuscleScene";
import { INOUT, IN, OUT, clamp01, lerp, tw, Bz } from "./anim";

export const DUR = 600;
export const T = {
  hookOut: 66, light: 92, morphEnd: 150, fail: 252, rep25: 341, dive: 350, compare: 372, cmpEnd: 452, merge: 456, rule: 482, end: 540,
};

// ---------- camera ----------
type K = { f: number; s: Shot; e?: Bz };
const KEYS: K[] = [
  { f: 0, s: { cam: [0.15, 3.0, 0.75], look: [0, 0, 0], fov: 34, roll: 0.3 } },
  { f: 64, s: { cam: [0.5, 5.4, 6.6], look: [0, 1.5, 0], fov: 32, roll: -0.06 }, e: [0.45, 0, 0.15, 1] },
  { f: 100, s: { cam: [3.4, 4.4, 9.8], look: [0, 0.1, 0], fov: 30, roll: 0 }, e: INOUT },
  { f: 160, s: { cam: [2.6, 6.0, 10.2], look: [0, 0.2, 0], fov: 29, roll: 0 }, e: INOUT },
  { f: 262, s: { cam: [-1.0, 6.3, 10.3], look: [0, 0.2, 0], fov: 29, roll: 0 }, e: INOUT },
  { f: 336, s: { cam: [-0.9, 5.1, 7.8], look: [0, 0.35, 0], fov: 30, roll: 0.03 }, e: INOUT },
  { f: 371.99, s: { cam: [-0.05, 1.35, 1.1], look: [0, 0, 0], fov: 38, roll: 0.25 }, e: [0.7, 0, 0.95, 0.5] },
  { f: 372, s: { cam: [0, 4.3, 11.6], look: [0, -0.2, 0], fov: 30, roll: 0 } },
  { f: 456, s: { cam: [0, 4.6, 10.9], look: [0, -0.1, 0], fov: 30, roll: 0 }, e: [0, 0, 1, 1] },
  { f: 490, s: { cam: [1.6, 6.6, 10.8], look: [0, 0.3, 0], fov: 29, roll: 0 }, e: INOUT },
  { f: 540, s: { cam: [0.9, 7.4, 8.6], look: [0, 0.8, 0], fov: 30, roll: 0 }, e: INOUT },
  { f: 600, s: { cam: [0.3, 9.6, 5.2], look: [0, 0.4, 0], fov: 30, roll: 0 }, e: INOUT },
];
const lv = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t)) as [number, number, number];
export const shotAt = (f: number): Shot => {
  if (f <= KEYS[0].f) return KEYS[0].s;
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (f < b.f) {
      const t = tw(f, a.f, b.f, 0, 1, b.e ?? INOUT);
      return { cam: lv(a.s.cam, b.s.cam, t), look: lv(a.s.look, b.s.look, t), fov: lerp(a.s.fov, b.s.fov, t), roll: lerp(a.s.roll ?? 0, b.s.roll ?? 0, t) };
    }
  }
  return KEYS[KEYS.length - 1].s;
};

// ---------- reps ----------
const lightReps = Array.from({ length: 25 }, (_, k) => {
  const i = k + 1;
  return i <= 12 ? 150 + (i - 1) * 8.6 : T.fail + (i - 13) * 7.4;
});
export const LIGHT_REPS = lightReps;
const repsDone = (f: number, reps: number[]) => {
  let n = 0;
  for (const r of reps) if (f >= r) n++;
  return n;
};
const pulseOf = (f: number, reps: number[], decay = 4) => {
  let p = 0;
  for (const r of reps) if (f >= r) p = Math.max(p, Math.exp(-(f - r) / decay));
  return p;
};
// smooth rep progress (interpolated between rep frames) for continuous recruitment
const repProgress = (f: number, reps: number[]) => {
  if (f < reps[0]) return 0;
  for (let i = 0; i < reps.length - 1; i++) if (f < reps[i + 1]) return i + 1 + (f - reps[i]) / (reps[i + 1] - reps[i]);
  return reps.length;
};
const lightAct = (n: number) => (n <= 0 ? 0 : 0.05 + 0.95 * Math.pow(n / 25, 2.0));
const lightHeat = (n: number) => Math.pow(clamp01((n - 14) / 11), 1.4);

const cmpLight = Array.from({ length: 25 }, (_, k) => 384 + (k * (T.cmpEnd - 384)) / 24);
const cmpHeavy = Array.from({ length: 8 }, (_, k) => 384 + (k * (T.cmpEnd - 384)) / 7);
export const CMP = { light: cmpLight, heavy: cmpHeavy };
const heavyAct = (m: number) => (m <= 0 ? 0 : 0.5 + 0.5 * Math.pow(m / 8, 1.3));
const heavyHeat = (m: number) => Math.pow(clamp01((m - 3) / 5), 1.4);

export const repCount = (f: number) => repsDone(f, lightReps);
export const cmpCounts = (f: number) => ({ light: repsDone(f, cmpLight), heavy: repsDone(f, cmpHeavy) });

// ---------- muscle state ----------
export const bundlesAt = (f: number): BundleState[] => {
  if (f < T.hookOut + 6) {
    // hook: one fiber ignites, a wave races out, the face goes white-hot
    return [{ activation: 0, heat: tw(f, 12, 44, 0, 1, INOUT), wave: tw(f, 3, 40, 0, 1.75, [0.5, 0, 0.3, 1]), pulse: 0 }];
  }
  if (f < T.light) {
    // power down from the edge inward while the camera keeps moving
    return [{ activation: 1, waveIn: true, wave: tw(f, T.hookOut + 6, T.light - 2, 1.75, -0.1, IN), heat: tw(f, T.hookOut + 4, T.light - 6, 1, 0, INOUT) }];
  }
  if (f < T.compare) {
    const n = repProgress(f, lightReps);
    const burst = f >= T.rep25 ? Math.exp(-(f - T.rep25) / 10) : 0;
    return [{ activation: lightAct(n), heat: Math.min(1, lightHeat(n)), pulse: Math.max(pulseOf(f, lightReps) * (0.4 + lightHeat(n) * 0.6), burst), seed: 3 }];
  }
  if (f < T.rule) {
    const nl = repProgress(f, cmpLight);
    const nh = repProgress(f, cmpHeavy);
    const m = tw(f, T.merge, T.rule, 0, 1, INOUT);
    const x = lerp(1.02, 0, m);
    const sc = lerp(0.55, 1, m);
    const cool = tw(f, T.merge + 6, T.rule + 20, 0, 1, INOUT);
    const L: BundleState = { x: -x, scale: sc, activation: lerp(lightAct(nl), 0.75, cool), heat: lerp(lightHeat(nl), 0.45, cool), pulse: pulseOf(f, cmpLight) * 0.6, seed: 5 };
    const Hv: BundleState = { x, scale: sc, activation: lerp(heavyAct(nh), 0.75, cool), heat: lerp(heavyHeat(nh), 0.45, cool), pulse: pulseOf(f, cmpHeavy, 6) * 0.8, seed: 9 };
    return f > T.rule - 3 ? [L] : [L, Hv];
  }
  const cool = tw(f, T.rule, T.rule + 20, 0, 1, INOUT);
  const breathe = 0.5 + 0.5 * Math.sin((f - T.rule) / 9);
  const endCool = tw(f, T.end, T.end + 40, 0, 1, INOUT);
  return [{ activation: lerp(lerp(0.75, 0.72, cool), 0.3, endCool), heat: lerp(lerp(0.45, 0.42, cool), 0.0, endCool), pulse: breathe * 0.15 * (1 - endCool), seed: 5 }];
};

export const lightRecruitPct = (f: number) => lightAct(repProgress(f, lightReps));
export { OUT };
