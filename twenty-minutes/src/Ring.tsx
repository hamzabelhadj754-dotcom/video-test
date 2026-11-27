import React from "react";
import { C } from "./theme";

// 20 one-minute slices in 4 rounds of 5. Each slice = 40s work + 20s rest.
export const GROUP_GAP = 5.2;
export const SLICE_GAP = 1.5;
export const SLICE = (360 - 4 * GROUP_GAP - 16 * SLICE_GAP) / 20;

export const sliceStart = (i: number) => {
  const g = Math.floor(i / 5);
  const j = i % 5;
  return -90 + GROUP_GAP / 2 + g * (5 * SLICE + 4 * SLICE_GAP + GROUP_GAP) + j * (SLICE + SLICE_GAP);
};

const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

export const sector = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) => {
  if (a1 - a0 < 0.01) return "";
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = pt(cx, cy, r1, a0);
  const [x1, y1] = pt(cx, cy, r1, a1);
  const [x2, y2] = pt(cx, cy, r0, a1);
  const [x3, y3] = pt(cx, cy, r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${large} 0 ${x3},${y3} Z`;
};

export type SliceState = {
  track: number; // 0..1 how much of the dim track is drawn (sweep-on)
  base: number; // 0..1 off-white "this minute exists" fill
  work: number; // 0..1 fill of the 40s work portion
  rest: number; // 0..1 fill of the 20s rest portion
  workAlpha?: number;
  glow?: number;
};

export const Ring: React.FC<{
  cx: number;
  cy: number;
  r: number;
  w: number;
  slices: SliceState[];
  ticks?: number; // 0..1 outer minute ticks
}> = ({ cx, cy, r, w, slices, ticks = 0 }) => {
  const r0 = r - w / 2;
  const r1 = r + w / 2;
  const workSpan = SLICE * (40 / 60);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      {slices.map((s, i) => {
        const a0 = sliceStart(i);
        const a1 = a0 + SLICE;
        const aw = a0 + workSpan;
        const wa = s.workAlpha ?? 1;
        return (
          <g key={i}>
            <path d={sector(cx, cy, r0, r1, a0, a0 + SLICE * s.track)} fill={C.lineSoft} />
            <path d={sector(cx, cy, r0, r1, a0, a0 + SLICE * s.base)} fill={C.ink} fillOpacity={0.14} />
            {s.glow ? (
              <path d={sector(cx, cy, r0, r1, a0, a0 + workSpan * s.work)} fill={C.work} opacity={s.glow * 0.7} filter="url(#ringGlow)" />
            ) : null}
            <path d={sector(cx, cy, r0, r1, a0, a0 + workSpan * s.work)} fill={C.work} fillOpacity={wa} />
            <path d={sector(cx, cy, r0, r1, aw, aw + (a1 - aw) * s.rest)} fill={C.rest} fillOpacity={0.85} />
          </g>
        );
      })}
      {ticks > 0 &&
        Array.from({ length: 20 }).map((_, i) => {
          const a = sliceStart(i);
          const [x0, y0] = pt(cx, cy, r1 + 14, a);
          const [x1, y1] = pt(cx, cy, r1 + 14 + 16 * ticks, a);
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={C.ink} strokeOpacity={0.3 * ticks} strokeWidth={2} />;
        })}
    </svg>
  );
};

export const emptySlices = (): SliceState[] => Array.from({ length: 20 }).map(() => ({ track: 0, base: 0, work: 0, rest: 0 }));
