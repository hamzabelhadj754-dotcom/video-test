import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../brand";
import { ease, enter, holdDrift, lerp } from "../anim";
import { useLayout } from "../layout";
import { countValue } from "./Headline";

/**
 * Big proof-point template (scenes 12–14): number counts up during the entrance only,
 * then everything holds still. Label + source line underneath.
 */
export const StatCard: React.FC<{
  value: { to: number; decimals: number; suffix: string };
  label: string;
  sub: readonly string[];
}> = ({ value, label, sub }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const pNum = enter(frame, 0);
  const pLabel = ease(frame, 2, 7);
  const pSub = ease(frame, 3, 6);
  const drift = holdDrift(frame, 0.01);

  return (
    <div
      style={{
        position: "absolute",
        left: L.safe.x0,
        width: L.safe.x1 - L.safe.x0,
        top: L.centerY,
        transform: `translateY(-50%) scale(${drift})`,
        textAlign: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          fontSize: L.stat.number,
          fontWeight: 800,
          lineHeight: 0.92,
          letterSpacing: "-0.045em",
          color: colors.mint,
          fontVariantNumeric: "tabular-nums",
          opacity: pNum,
          transform: `scale(${lerp(pNum, 0.86, 1)})`,
        }}
      >
        {countValue(frame, value.to, value.decimals)}
        <span style={{ color: colors.lime }}>{value.suffix}</span>
      </div>
      <div
        style={{
          marginTop: L.stat.label * 0.12,
          fontSize: L.stat.label,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: colors.white,
          opacity: pLabel,
          transform: `translateY(${(1 - pLabel) * 40}px)`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: L.stat.sub * 0.9,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
          fontSize: L.stat.sub,
          fontWeight: 500,
          color: colors.white,
          opacity: 0.85 * pSub,
          transform: `translateY(${(1 - pSub) * 30}px)`,
        }}
      >
        {sub.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 ? <span style={{ opacity: 0.6 }}>·</span> : null}
            <span style={i > 0 ? { fontWeight: 700, color: colors.mint } : undefined}>{s}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
