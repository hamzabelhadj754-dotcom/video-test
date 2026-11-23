import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../brand";
import { enter, holdDrift, lerp } from "../anim";
import { Logo } from "../components/Logo";
import { Glow, LightBackdrop, SceneShell } from "../components/Stage";
import { useLayout } from "../layout";

/** A clean light wipe clears the chaos; the logo springs in with a soft glow. */
export const Scene04: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const p = enter(frame, 2);
  const w = L.format === "9x16" ? 700 : 600;
  return (
    <SceneShell bg={colors.cream} transition="sweep">
      <LightBackdrop />
      <Glow color={colors.mint} x="50%" y={`${(L.centerY / L.height) * 100}%`} size={w * 1.7} opacity={p} />
      <div
        style={{
          position: "absolute",
          left: (L.width - w) / 2,
          top: L.centerY,
          width: w,
          opacity: p,
          transform: `translateY(-50%) scale(${lerp(p, 0.8, 1) * holdDrift(frame, 0.015)})`,
          filter: `drop-shadow(0 0 ${lerp(p, 0, 40)}px rgba(13,158,136,0.35))`,
        }}
      >
        <Logo width={w} color={colors.forest} />
      </div>
    </SceneShell>
  );
};
