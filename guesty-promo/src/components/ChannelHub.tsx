import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, fontFamily, radius } from "../brand";
import { ease, enter, lerp } from "../anim";
import { Icon } from "./Icon";
import { Chip, UICard } from "./UI";

/** Channel names as listed on guesty.com (FAQ: "Expedia, Google Travel, Hopper…"). */
const CHANNELS = [
  { label: "Airbnb", x: 150, y: 90 },
  { label: "Booking.com", x: 750, y: 90 },
  { label: "Vrbo", x: 120, y: 370 },
  { label: "Expedia", x: 780, y: 370 },
  { label: "Google Travel", x: 175, y: 650 },
  { label: "Hopper", x: 725, y: 650 },
];
const CX = 450;
const CY = 370;
const CARD_W = 300;
const CARD_H = 300;

/**
 * Central listing card connected to channel chips.
 *  mode "fan":  chips fan out from the card, lines draw on (scene 6)
 *  mode "sync": everything already in place; pulses travel the lines and every chip
 *               updates price/availability at the same moment (scene 7)
 */
export const ChannelHub: React.FC<{ mode: "fan" | "sync" }> = ({ mode }) => {
  const frame = useCurrentFrame();
  const fan = mode === "fan";
  const pCard = fan ? enter(frame, 0) : 1;
  const updated = !fan && frame >= 10;

  return (
    <>
      <svg width={900} height={740} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {CHANNELS.map((c, i) => {
          const pLine = fan ? ease(frame, 3 + i, 10) : 1;
          const d = `M ${CX} ${CY} Q ${(CX + c.x) / 2} ${c.y < CY ? CY : c.y} ${c.x} ${c.y}`;
          return (
            <g key={c.label}>
              <path
                d={d}
                fill="none"
                stroke={colors.primary}
                strokeOpacity={0.35}
                strokeWidth={4}
                strokeDasharray="1"
                pathLength={1}
                strokeDashoffset={1 - pLine}
                strokeLinecap="round"
              />
              {!fan
                ? [0, 0.5].map((off) => {
                    const t = ((frame / 22 + off + i * 0.07) % 1 + 1) % 1;
                    return (
                      <path
                        key={off}
                        d={d}
                        fill="none"
                        stroke={colors.primaryBright}
                        strokeWidth={10}
                        strokeLinecap="round"
                        pathLength={1}
                        strokeDasharray={`0.06 1`}
                        strokeDashoffset={-t}
                        opacity={Math.sin(t * Math.PI)}
                      />
                    );
                  })
                : null}
            </g>
          );
        })}
      </svg>

      {/* listing card */}
      <UICard
        style={{
          left: CX - CARD_W / 2,
          top: CY - CARD_H / 2,
          width: CARD_W,
          height: CARD_H,
          opacity: pCard,
          transform: `scale(${lerp(pCard, 0.7, 1)})`,
        }}
      >
        <div
          style={{
            height: 150,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryBright} 55%, ${colors.mint})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="home" size={74} color={colors.white} strokeWidth={1.8} />
        </div>
        <div style={{ padding: "18px 22px", fontFamily }}>
          <div style={{ fontWeight: 800, fontSize: 30, color: colors.forest }}>Seaside Villa</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 24, fontWeight: 600 }}>
            <span style={{ color: colors.gray }}>per night</span>
            <span style={{ color: updated ? colors.primary : colors.forest, fontWeight: 800 }}>
              {updated ? "$189" : "$179"}
            </span>
          </div>
        </div>
      </UICard>

      {/* channel chips */}
      {CHANNELS.map((c, i) => {
        const p = fan ? enter(frame, 2 + i, 9) : 1;
        const x = lerp(p, CX, c.x);
        const y = lerp(p, CY, c.y);
        const pi = fan ? 0 : enter(frame, 10 + (i % 2), 8);
        return (
          <div
            key={c.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${lerp(p, 0.3, 1)})`,
              opacity: p,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Chip label={c.label} size="md" style={{ height: 76, fontSize: 32, padding: "0 28px" }} />
            {!fan ? (
              <div
                style={{
                  position: "absolute",
                  top: 84,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px 8px 10px",
                  borderRadius: radius.pill,
                  background: updated ? colors.success : colors.white,
                  color: updated ? colors.white : colors.gray,
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 22,
                  whiteSpace: "nowrap",
                  transform: `scale(${updated ? lerp(pi, 1.15, 1) : 1})`,
                  boxShadow: "0 8px 20px rgba(7,44,35,0.12)",
                  opacity: ease(frame, 0, 6),
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 99,
                    background: updated ? "rgba(255,255,255,0.25)" : colors.cream,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {updated ? <Icon name="check" size={18} color={colors.white} strokeWidth={3.2} /> : null}
                </div>
                {updated ? "$189 · Open" : "$179 · Open"}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
