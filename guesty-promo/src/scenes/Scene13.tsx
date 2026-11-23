import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../brand";
import { ease } from "../anim";
import { COPY } from "../copy";
import { DarkBackdrop, SceneShell } from "../components/Stage";
import { StatCard } from "../components/StatCard";
import { useLayout } from "../layout";

/** Faint rising bars behind the stat (decorative). */
export const GrowthBars: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const n = 7;
  const w = L.safe.x1 - L.safe.x0;
  const maxH = L.format === "9x16" ? 330 : 180;
  return (
    <div style={{ position: "absolute", left: L.safe.x0, width: w, bottom: L.height - L.safe.y1 + 20, height: maxH, display: "flex", alignItems: "flex-end", gap: 22 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(0.25 + (i / (n - 1)) * 0.75) * 100 * ease(frame, i, 9)}%`,
            borderRadius: "18px 18px 0 0",
            background: `linear-gradient(180deg, rgba(213,242,242,0.16), rgba(213,242,242,0))`,
          }}
        />
      ))}
    </div>
  );
};

export const Scene13: React.FC = () => (
  <SceneShell bg={colors.forest}>
    <DarkBackdrop />
    <GrowthBars />
    <StatCard value={COPY.s13.value} label={COPY.s13.label} sub={COPY.s13.sub} />
  </SceneShell>
);
