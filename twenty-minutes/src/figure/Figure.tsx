import React from "react";
import { C } from "../theme";
import { JointName, Limbs, P, Skel } from "./pose";

export type Stage = { ox: number; oy: number; h: number };
export const toScreen = (s: Stage, p: P) => ({ x: s.ox + p.x * s.h, y: s.oy - p.y * s.h });

type Props = {
  pose: (f: number) => Skel;
  f: number;
  stage: Stage;
  active?: JointName[];
  activeAmt?: number; // 0..1 how lit the active joints are
  shutter?: number; // motion blur: frames of shutter (0.5 = 180°)
  samples?: number;
  opacity?: number;
};

const BONES: [keyof Limbs, keyof Limbs][] = [
  ["shoulder", "elbow"],
  ["elbow", "wrist"],
  ["hip", "knee"],
  ["knee", "ankle"],
  ["ankle", "toe"],
];
const JOINTS: (keyof Limbs)[] = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle", "toe"];

const Body: React.FC<{
  sk: Skel;
  stage: Stage;
  active: JointName[];
  activeAmt: number;
  ghost: number; // 1 = solid, <1 = blur sample
}> = ({ sk, stage, active, activeAmt, ghost }) => {
  const s = (p: P) => toScreen(stage, p);
  const r = stage.h * 0.0175;
  const side = (l: Limbs, far: boolean) => {
    const a = far ? 0.42 : 1;
    return (
      <g>
        {BONES.map(([b0, b1]) => {
          const p0 = s(l[b0]);
          const p1 = s(l[b1]);
          return (
            <line
              key={b0 + b1}
              x1={p0.x}
              y1={p0.y}
              x2={p1.x}
              y2={p1.y}
              stroke={C.ink}
              strokeOpacity={0.26 * a * ghost}
              strokeWidth={r * 0.32}
              strokeLinecap="round"
            />
          );
        })}
        {JOINTS.map((j) => {
          const p = s(l[j]);
          const isA = active.includes(j);
          return (
            <circle
              key={j}
              cx={p.x}
              cy={p.y}
              r={isA ? r * (1 + 0.28 * activeAmt) : r * (j === "toe" ? 0.7 : 1)}
              fill={isA && activeAmt > 0.01 ? C.work : C.ink}
              fillOpacity={(isA ? 1 : 0.92) * (far ? (isA ? 0.62 : a) : 1) * ghost}
            />
          );
        })}
      </g>
    );
  };
  const n = s(sk.neck);
  const hipN = s(sk.near.hip);
  const head = s(sk.head);
  return (
    <g>
      {side(sk.far, true)}
      {/* spine */}
      <line
        x1={n.x}
        y1={n.y}
        x2={hipN.x}
        y2={hipN.y}
        stroke={C.ink}
        strokeOpacity={0.3 * ghost}
        strokeWidth={r * 0.36}
        strokeLinecap="round"
      />
      <line
        x1={n.x}
        y1={n.y}
        x2={head.x}
        y2={head.y}
        stroke={C.ink}
        strokeOpacity={0.3 * ghost}
        strokeWidth={r * 0.36}
        strokeLinecap="round"
      />
      {side(sk.near, false)}
      <circle cx={head.x} cy={head.y} r={r * 2.05} fill={C.ink} fillOpacity={0.95 * ghost} />
    </g>
  );
};

export const Figure: React.FC<Props> = ({
  pose,
  f,
  stage,
  active = [],
  activeAmt = 1,
  shutter = 0.5,
  samples = 5,
  opacity = 1,
}) => {
  const sk = pose(f);
  const glowId = "glow";
  const ghosts = [];
  for (let i = samples; i >= 1; i--) {
    const t = f - (shutter * i) / samples;
    ghosts.push(
      <Body key={i} sk={pose(t)} stage={stage} active={active} activeAmt={activeAmt} ghost={0.28 * (1 - i / (samples + 1))} />,
    );
  }
  const s = (p: P) => toScreen(stage, p);
  const r = stage.h * 0.0175;
  const lit: P[] = [];
  active.forEach((j) => {
    if (j === "head") lit.push(sk.head);
    else {
      lit.push(sk.near[j]);
      lit.push(sk.far[j]);
    }
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r * 1.3} />
        </filter>
      </defs>
      {/* active-joint bloom */}
      <g filter={`url(#${glowId})`} opacity={0.85 * activeAmt}>
        {lit.map((p, i) => {
          const q = s(p);
          return <circle key={i} cx={q.x} cy={q.y} r={r * 2.4} fill={C.work} fillOpacity={i % 2 ? 0.45 : 0.8} />;
        })}
      </g>
      {ghosts}
      <Body sk={sk} stage={stage} active={active} activeAmt={activeAmt} ghost={1} />
    </svg>
  );
};
