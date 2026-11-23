import React from "react";
import { random, useCurrentFrame } from "remotion";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import land110 from "world-atlas/land-110m.json";
import { colors } from "../brand";
import { ease } from "../anim";

const LAT_TOP = 78;
const LAT_BOTTOM = -56;
const STEP = 3.1;

type Dot = { lon: number; lat: number; seed: number };

let DOTS: Dot[] | null = null;
const getDots = (): Dot[] => {
  if (DOTS) return DOTS;
  const topo = land110 as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land);
  const out: Dot[] = [];
  for (let lat = LAT_TOP; lat >= LAT_BOTTOM; lat -= STEP) {
    for (let lon = -180; lon <= 180; lon += STEP) {
      if (geoContains(land, [lon, lat])) out.push({ lon, lat, seed: out.length });
    }
  }
  DOTS = out;
  return out;
};

/** Subtle dotted world map (equirectangular) with a few pulsing "listing" pins. */
export const WorldDots: React.FC<{ width: number; top: number; left: number; opacity?: number }> = ({
  width,
  top,
  left,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const dots = getDots();
  const height = (width * (LAT_TOP - LAT_BOTTOM)) / 360;
  const x = (lon: number) => ((lon + 180) / 360) * width;
  const y = (lat: number) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * height;
  const r = (width / 360) * STEP * 0.34;

  return (
    <svg width={width} height={height} style={{ position: "absolute", left, top, opacity }}>
      {dots.map((d) => {
        // dots sweep in from left to right during the entrance
        const p = ease(frame, (x(d.lon) / width) * 8, 6);
        const pin = random(`pin-${d.seed}`) > 0.965;
        if (!pin) {
          return <circle key={d.seed} cx={x(d.lon)} cy={y(d.lat)} r={r} fill={colors.mint} opacity={0.22 * p} />;
        }
        const phase = ((frame + random(`ph-${d.seed}`) * 40) % 40) / 40;
        return (
          <g key={d.seed} opacity={p}>
            <circle cx={x(d.lon)} cy={y(d.lat)} r={r * (1.4 + phase * 3)} fill="none" stroke={colors.lime} strokeWidth={2} opacity={(1 - phase) * 0.6} />
            <circle cx={x(d.lon)} cy={y(d.lat)} r={r * 1.4} fill={colors.lime} />
          </g>
        );
      })}
    </svg>
  );
};
