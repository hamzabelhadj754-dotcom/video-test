import React from "react";
import { AbsoluteFill } from "remotion";
import { colors } from "../brand";
import { COPY } from "../copy";
import { DarkBackdrop, SceneShell } from "../components/Stage";
import { StatCard } from "../components/StatCard";
import { WorldDots } from "../components/WorldDots";
import { useLayout } from "../layout";

/** 500K+ listings — count-up during the entrance only, world-dots map behind. */
export const Scene12: React.FC = () => {
  const L = useLayout();
  const mapW = L.format === "9x16" ? 1500 : 1080;
  const mapH = (mapW * 134) / 360;
  return (
    <SceneShell bg={colors.forest} transition="wipeUp" edge={colors.mint}>
      <DarkBackdrop />
      <AbsoluteFill>
        <WorldDots width={mapW} left={(L.width - mapW) / 2} top={L.centerY - mapH / 2} opacity={0.9} />
      </AbsoluteFill>
      {/* vignette keeps the number crisp over the map */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${L.width * 0.62}px ${L.stat.number * 1.5}px at 50% ${L.centerY}px, rgba(7,44,35,0.97) 0%, rgba(7,44,35,0.85) 50%, rgba(7,44,35,0) 100%)`,
        }}
      />
      <StatCard value={COPY.s12.value} label={COPY.s12.label} sub={COPY.s12.sub} />
    </SceneShell>
  );
};
