import React from "react";
import { AbsoluteFill } from "remotion";
import { Cue, Floor, GhostNum, Header, Rise, Typed } from "../components";
import { Figure, Stage, toScreen } from "../figure/Figure";
import { bridge, bridgeHipAt, bridgeLift, climb, lunge, lungeDepth, P, push, pushDepth, pushKneeMix, squat, squatDepth } from "../figure/pose";
import { C, display, EASE, MARGIN, mono } from "../theme";
import { B, clamp01, lerp, prog, Wd } from "../timeline";

export const FLOOR_Y = 1380;

const Frame: React.FC<{
  f: number;
  idx: number;
  dur: number;
  title: string[];
  titleSize: number;
  titleAt: number; // local frame the title starts rising
  sub: string;
  children: React.ReactNode;
}> = ({ f, idx, dur, title, titleSize, titleAt, sub, children }) => {
  const lineH = titleSize * 0.9;
  return (
    <AbsoluteFill>
      <GhostNum n={String(idx + 1)} f={f} />
      <Floor y={FLOOR_Y} f={f} />
      {children}
      <div style={{ position: "absolute", top: 300, left: MARGIN - 6 }}>
        {title.map((t, i) => (
          <div key={i} style={{ height: lineH }}>
            <Rise text={t} f={f - titleAt - i * 4} style={display(titleSize)} stagger={1.3} dur={15} />
          </div>
        ))}
        <div style={{ marginTop: 26, marginLeft: 6 }}>
          <Typed text={sub} f={f - titleAt - 10} cps={2.2} style={mono(28, { color: C.rest, fontWeight: 600, letterSpacing: "0.24em" })} />
        </div>
      </div>
      <Header idx={idx} f={f} dur={dur} />
    </AbsoluteFill>
  );
};

// ── 01 SQUAT ─────────────────────────────────────────────────────────────────
export const SQUAT_STAGE: Stage = { ox: 600, oy: FLOOR_Y, h: 760 };
export const Squat: React.FC<{ f: number }> = ({ f }) => {
  const st = SQUAT_STAGE;
  const s = (p: P) => toScreen(st, p);
  const hip = s(squat(40).near.hip);
  const sh = s(squat(40).near.shoulder);
  return (
    <Frame f={f} idx={0} dur={B.push - B.squat} title={["SQUAT"]} titleSize={196} titleAt={Wd.squats - B.squat - 9} sub="QUADS · GLUTES">
      <Figure pose={squat} f={f} stage={st} active={["hip", "knee"]} activeAmt={squatDepth(f)} />
      <Cue from={hip} to={{ x: 300, y: 1090 }} label="HIPS BACK" f={f - (Wd.hips - B.squat) + 4} align="left" />
      <Cue from={sh} to={{ x: 730, y: 880 }} label="CHEST UP" f={f - (Wd.chest - B.squat) + 4} align="right" />
    </Frame>
  );
};

// ── 02 PUSH-UP ───────────────────────────────────────────────────────────────
export const PUSH_STAGE: Stage = { ox: 120, oy: FLOOR_Y, h: 860 };
// The body line, used by the guide and by the split transition.
export const pushLine = (f: number) => {
  const sk = push(f);
  const k = pushKneeMix(f);
  const a = toScreen(PUSH_STAGE, k > 0.5 ? sk.near.knee : sk.near.ankle);
  const b = toScreen(PUSH_STAGE, sk.head);
  return { a, b };
};
export const Push: React.FC<{ f: number }> = ({ f }) => {
  const st = PUSH_STAGE;
  const { a, b } = pushLine(f);
  const draw = prog(f, Wd.straight - B.push, Wd.straight - B.push + 16, EASE.out);
  const extend = prog(f, 106, 120, EASE.whip); // line runs out of frame → becomes the cut
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const ext = 40 + extend * 1400;
  const p0 = { x: a.x - ux * ext, y: a.y - uy * ext };
  const p1 = { x: lerp(a.x, b.x, draw) + ux * ext * draw, y: lerp(a.y, b.y, draw) + uy * ext * draw };
  const mid = toScreen(st, push(f).near.hip);
  const knee = toScreen(st, push(90).near.knee);
  return (
    <Frame f={f} idx={1} dur={B.lunge - B.push} title={["PUSH-UP"]} titleSize={164} titleAt={Wd.pushups - B.push - 9} sub="CHEST · ARMS · CORE">
      <Figure pose={push} f={f} stage={st} active={["elbow", "shoulder"]} activeAmt={pushDepth(f)} />
      {draw > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={C.work} strokeWidth={3} strokeLinecap="round" />
        </svg>
      )}
      <Cue from={mid} to={{ x: 560, y: 960 }} label="ONE STRAIGHT LINE" f={f - (Wd.straight - B.push) - 2} align="right" out={70} />
      <Cue from={knee} to={{ x: 520, y: 1120 }} label="KNEES DOWN = OK" f={f - (Wd.knees - B.push) - 6} align="left" color={C.rest} />
    </Frame>
  );
};

// ── 03 REVERSE LUNGE ─────────────────────────────────────────────────────────
export const LUNGE_STAGE: Stage = { ox: 620, oy: FLOOR_Y, h: 720 };
const Angle: React.FC<{ at: P; a: P; b: P; f: number; label: string; side: 1 | -1 }> = ({ at, a, b, f, label, side }) => {
  const t = prog(f, 0, 14, EASE.out);
  const lock = prog(f, 20, 26, EASE.out);
  if (f < 0) return null;
  const r = 62;
  const a0 = Math.atan2(a.y - at.y, a.x - at.x);
  let a1 = Math.atan2(b.y - at.y, b.x - at.x);
  let d = a1 - a0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  a1 = a0 + d * t;
  const P0 = { x: at.x + r * Math.cos(a0), y: at.y + r * Math.sin(a0) };
  const P1 = { x: at.x + r * Math.cos(a1), y: at.y + r * Math.sin(a1) };
  const sweep = d > 0 ? 1 : 0;
  const mid = a0 + d / 2;
  const lx = at.x + (r + 64) * Math.cos(mid);
  const ly = at.y + (r + 64) * Math.sin(mid);
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={`M${P0.x},${P0.y} A${r},${r} 0 0 ${sweep} ${P1.x},${P1.y}`} fill="none" stroke={C.work} strokeWidth={3} />
        <circle cx={at.x} cy={at.y} r={r} fill={C.work} fillOpacity={0.06 * lock} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: lx - 60 + side * 6,
          top: ly - 24,
          width: 120,
          textAlign: "center",
          ...mono(34, { color: C.work, fontWeight: 700, letterSpacing: "0.04em" }),
          opacity: lock,
          transform: `scale(${lerp(1.25, 1, lock)})`,
        }}
      >
        {label}
      </div>
    </>
  );
};
export const Lunge: React.FC<{ f: number }> = ({ f }) => {
  const st = LUNGE_STAGE;
  const sk = lunge(f);
  const s = (p: P) => toScreen(st, p);
  const af = f - (Wd.both - B.lunge);
  return (
    <Frame f={f} idx={2} dur={B.bridge - B.lunge} title={["REVERSE", "LUNGE"]} titleSize={150} titleAt={Wd.lunges - B.lunge - 10} sub="QUADS · GLUTES · BALANCE">
      <Figure pose={lunge} f={f} stage={st} active={["knee"]} activeAmt={clamp01((lungeDepth(f) - 0.5) * 2)} />
      <Angle at={s(sk.near.knee)} a={s(sk.near.hip)} b={s(sk.near.ankle)} f={af} label="90°" side={1} />
      <Angle at={s(sk.far.knee)} a={s(sk.far.hip)} b={s(sk.far.ankle)} f={af - 4} label="90°" side={-1} />
      <Cue from={s(sk.near.ankle)} to={{ x: 800, y: 1240 }} label="DRIVE" f={f - 66} align="right" color={C.rest} />
    </Frame>
  );
};

// ── 04 GLUTE BRIDGE ──────────────────────────────────────────────────────────
export const BRIDGE_STAGE: Stage = { ox: 200, oy: FLOOR_Y, h: 860 };
export const Bridge: React.FC<{ f: number }> = ({ f }) => {
  const st = BRIDGE_STAGE;
  const lift = bridgeLift(f);
  const pts: string[] = [];
  const top = Math.min(lift, 1);
  for (let i = 0; i <= 24; i++) {
    const q = toScreen(st, bridgeHipAt((top * i) / 24));
    pts.push(`${q.x},${q.y}`);
  }
  const sq = f - (Wd.squeeze - B.bridge);
  const squeeze = prog(sq, 0, 16, EASE.out);
  const release = prog(sq, 22, 30, EASE.in);
  return (
    <Frame f={f} idx={3} dur={B.climb - B.bridge} title={["GLUTE", "BRIDGE"]} titleSize={150} titleAt={Wd.glute - B.bridge - 10} sub="GLUTES · HAMSTRINGS">
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <polyline points={pts.join(" ")} fill="none" stroke={C.work} strokeWidth={2.5} strokeDasharray="2 12" strokeLinecap="round" strokeOpacity={0.9} />
      </svg>
      <Figure pose={bridge} f={f} stage={st} active={["hip"]} activeAmt={clamp01(lift)} />
      {/* the word itself squeezes */}
      <div style={{ position: "absolute", top: 820, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - release }}>
        <Rise
          text="SQUEEZE"
          f={sq + 2}
          stagger={1}
          dur={10}
          style={display(124, { letterSpacing: `${lerp(0.07, -0.012, squeeze)}em`, color: C.work })}
        />
      </div>
    </Frame>
  );
};

// ── 05 MOUNTAIN CLIMBERS ─────────────────────────────────────────────────────
export const CLIMB_STAGE: Stage = { ox: 120, oy: FLOOR_Y, h: 860 };
export const Climb: React.FC<{ f: number }> = ({ f }) => {
  const st = CLIMB_STAGE;
  const target = toScreen(st, { x: 0.71, y: 0.2 });
  const fast = f - (Wd.fast - B.climb);
  return (
    <Frame f={f} idx={4} dur={B.rounds - B.climb} title={["MOUNTAIN", "CLIMBERS"]} titleSize={128} titleAt={Wd.mountain - B.climb - 10} sub="CORE · CARDIO">
      <Figure pose={climb} f={f} stage={st} active={["knee"]} activeAmt={1} shutter={f > 70 ? 1.1 : 0.7} samples={7} />
      <Cue from={target} to={{ x: 780, y: 1000 }} label="KNEES IN" f={f - (Wd.kneesIn - B.climb) + 4} align="right" out={20} />
      <div style={{ position: "absolute", top: 800, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Rise text="FAST" f={fast + 1} stagger={0.8} dur={7} style={display(150, { color: C.work })} />
      </div>
    </Frame>
  );
};
