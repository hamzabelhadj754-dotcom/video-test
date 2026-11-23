import React, { useMemo } from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { ease } from "../anim";

type Puff = { x: number; y: number; r: number };

const makeBank = (seed: string, count: number, width: number, top: number, bottom: number, rMin: number, rMax: number): Puff[] =>
  Array.from({ length: count }, (_, i) => ({
    x: -0.1 * width + random(`${seed}x${i}`) * width * 1.2,
    y: top + Math.pow(random(`${seed}y${i}`), 0.7) * (bottom - top),
    r: rMin + random(`${seed}r${i}`) * (rMax - rMin),
  }));

/** Procedural cloud bank (soft-shaded puffs) rising from the bottom, plus faint wisps up top. */
export const Clouds: React.FC<{ horizon: number }> = ({ horizon }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = width / 1080;
  const front = useMemo(() => makeBank("front", 46, width, horizon, height + 140 * k, 90 * k, 220 * k), [width, height, horizon, k]);
  const back = useMemo(() => makeBank("back", 30, width, horizon - 170 * k, horizon + 160 * k, 80 * k, 190 * k), [width, horizon, k]);
  const wisps = useMemo(() => makeBank("wisp", 9, width, -60 * k, horizon * 0.3, 90 * k, 170 * k), [width, horizon, k]);
  const rise = ease(frame, 0, 14);
  const drift = frame * 0.35 * k;
  const lift = (1 - rise) * 380 * k;

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      <defs>
        {/* one shading gradient for the whole bank, so overlapping puffs read as one mass */}
        <linearGradient id="cloudFront" gradientUnits="userSpaceOnUse" x1="0" y1={horizon - 120 * k} x2="0" y2={height}>
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#F7FCFA" />
          <stop offset="100%" stopColor="#D9EFE7" />
        </linearGradient>
        <linearGradient id="cloudBack" gradientUnits="userSpaceOnUse" x1="0" y1={horizon - 300 * k} x2="0" y2={horizon + 200 * k}>
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#CFEAE1" stopOpacity={0.9} />
        </linearGradient>
        <filter id="softFront" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={9 * k} />
        </filter>
        <filter id="softBack" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={16 * k} />
        </filter>
        <filter id="wisp" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={34 * k} />
        </filter>
      </defs>
      <g filter="url(#wisp)" opacity={0.28 * rise} transform={`translate(${drift * 0.6} 0)`}>
        {wisps.map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={p.r * 1.8} ry={p.r * 0.7} fill="#FFFFFF" />
        ))}
      </g>
      <g filter="url(#softBack)" opacity={0.75 * Math.min(1, rise * 1.5)} transform={`translate(${-drift * 0.5} ${lift * 1.2})`}>
        {back.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="url(#cloudBack)" />
        ))}
      </g>
      <g filter="url(#softFront)" opacity={Math.min(1, rise * 1.5)} transform={`translate(${drift} ${lift})`}>
        {front.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="url(#cloudFront)" />
        ))}
      </g>
    </svg>
  );
};
