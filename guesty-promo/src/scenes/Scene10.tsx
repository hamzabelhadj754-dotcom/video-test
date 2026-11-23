import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, fontFamily, radius } from "../brand";
import { ease, enter, lerp } from "../anim";
import { COPY } from "../copy";
import { Headline } from "../components/Headline";
import { Icon } from "../components/Icon";
import { LightBackdrop, SceneShell, VisualStage } from "../components/Stage";
import { UICard } from "../components/UI";

const W = 820;
const H = 330;
const POINTS = [0.32, 0.36, 0.3, 0.42, 0.4, 0.5, 0.47, 0.58, 0.55, 0.66, 0.7, 0.68, 0.8, 0.88];
const pts = POINTS.map((v, i) => [(i / (POINTS.length - 1)) * W, H - v * H] as const);
const linePath = pts.reduce((acc, [x, y], i) => {
  if (i === 0) return `M ${x} ${y}`;
  const [px, py] = pts[i - 1];
  const cx = (px + x) / 2;
  return `${acc} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
}, "");

/** Pricing: the line chart draws itself, the nightly rate ticks up, "Auto" switches on. */
export const Scene10: React.FC = () => {
  const frame = useCurrentFrame();
  const pCard = enter(frame, 0);
  const draw = ease(frame, 2, 26);
  const toggle = ease(frame, 6, 6);
  const rate = Math.round(lerp(ease(frame, 8, 24), 189, 212));
  const idx = Math.min(pts.length - 1, Math.floor(draw * (pts.length - 1) + 0.0001));
  const [dx, dy] = pts[idx];

  return (
    <SceneShell bg={colors.mintSoft} transition="wipeLeft">
      <LightBackdrop tint={colors.mint} />
      <VisualStage lines={COPY.s10.headline.length}>
        <UICard style={{ left: 0, top: 0, width: 900, height: 740, opacity: pCard, transform: `translateY(${(1 - pCard) * 50}px)` }}>
          <div style={{ padding: "34px 40px", fontFamily }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.gray }}>Nightly rate · Seaside Villa</div>
              {/* Auto toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 28, color: toggle > 0.5 ? colors.primary : colors.gray }}>Auto</span>
                <div
                  style={{
                    width: 96,
                    height: 54,
                    borderRadius: radius.pill,
                    background: toggle > 0.5 ? colors.primary : colors.grayLight,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: lerp(toggle, 6, 48),
                      width: 42,
                      height: 42,
                      borderRadius: 99,
                      background: colors.white,
                      boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 14 }}>
              <span style={{ fontSize: 110, fontWeight: 800, letterSpacing: "-0.04em", color: colors.forest, fontVariantNumeric: "tabular-nums" }}>
                ${rate}
              </span>
              <span style={{ fontSize: 34, fontWeight: 600, color: colors.gray }}>/ night</span>
              <span
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: radius.pill,
                  background: colors.lime,
                  color: colors.forest,
                  fontWeight: 800,
                  fontSize: 24,
                  opacity: toggle,
                }}
              >
                <Icon name="sparkle" size={22} color={colors.forest} /> AI pricing
              </span>
            </div>
          </div>
          <svg width={W} height={H + 60} style={{ position: "absolute", left: 40, bottom: 40, overflow: "visible" }}>
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.primaryBright} stopOpacity={0.28} />
                <stop offset="100%" stopColor={colors.primaryBright} stopOpacity={0} />
              </linearGradient>
              <clipPath id="reveal">
                <rect x={-10} y={-40} width={(W + 20) * draw} height={H + 100} />
              </clipPath>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={0} x2={W} y1={(H / 3) * i} y2={(H / 3) * i} stroke={colors.line} strokeWidth={2} />
            ))}
            <g clipPath="url(#reveal)">
              <path d={`${linePath} L ${W} ${H} L 0 ${H} Z`} fill="url(#area)" />
            </g>
            <path
              d={linePath}
              fill="none"
              stroke={colors.primary}
              strokeWidth={7}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
            />
            <circle cx={dx} cy={dy} r={14} fill={colors.white} stroke={colors.primary} strokeWidth={6} opacity={draw > 0.02 ? 1 : 0} />
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <text
                key={d}
                x={(i / 6) * W}
                y={H + 44}
                textAnchor={i === 0 ? "start" : i === 6 ? "end" : "middle"}
                fontFamily={fontFamily}
                fontWeight={600}
                fontSize={22}
                fill={colors.gray}
              >
                {d}
              </text>
            ))}
          </svg>
        </UICard>
      </VisualStage>
      <Headline lines={COPY.s10.headline} tone="onLight" />
    </SceneShell>
  );
};
