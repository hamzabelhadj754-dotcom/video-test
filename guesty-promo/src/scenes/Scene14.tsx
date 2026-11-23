import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../brand";
import { ease } from "../anim";
import { COPY } from "../copy";
import { DarkBackdrop, SceneShell } from "../components/Stage";
import { StatCard } from "../components/StatCard";
import { useLayout } from "../layout";

/** Faint clock ring behind the stat (decorative). */
const ClockRing: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const size = L.format === "9x16" ? 1010 : 900;
  const r = size / 2 - 20;
  const p = ease(frame, 0, 20);
  return (
    <svg width={size} height={size} style={{ position: "absolute", left: (L.width - size) / 2, top: L.centerY - size / 2 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(213,242,242,0.08)" strokeWidth={28} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(213,242,242,0.22)"
        strokeWidth={28}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p * 0.83}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

export const Scene14: React.FC = () => (
  <SceneShell bg={colors.forest}>
    <DarkBackdrop />
    <ClockRing />
    <StatCard value={COPY.s14.value} label={COPY.s14.label} sub={COPY.s14.sub} />
  </SceneShell>
);
