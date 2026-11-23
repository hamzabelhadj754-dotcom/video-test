import React from "react";
import { useCurrentFrame } from "remotion";
import { channelColor, colors, fontFamily } from "../brand";
import { EASE, enter } from "../anim";
import { COPY } from "../copy";
import { Headline } from "../components/Headline";
import { LightBackdrop, SceneShell, VisualStage } from "../components/Stage";
import { Chip, UICard } from "../components/UI";
import { interpolate } from "remotion";

const PROPS = ["Seaside Villa", "City Loft", "Lake Cabin", "Garden House", "Ocean Studio"];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
/** [row, startDay, span, channel, guest] — no overlaps. */
const BOOKINGS: [number, number, number, string, string][] = [
  [0, 0, 3, "Airbnb", "Emma R."],
  [0, 3, 4, "Booking.com", "Noah K."],
  [1, 1, 4, "Vrbo", "Mia S."],
  [1, 5, 2, "Airbnb", "Liam"],
  [2, 0, 2, "Direct", "Ava T."],
  [2, 2, 5, "Airbnb", "Ethan W."],
  [3, 0, 4, "Booking.com", "Zoe L."],
  [3, 4, 3, "Vrbo", "Omar H."],
  [4, 1, 2, "Vrbo", "Ivy"],
  [4, 3, 3, "Direct", "Leo B."],
];

const LEFT = 220;
const COL = (900 - LEFT - 30) / 7;
const TOP = 170;
const ROW = 104;

/** Multi-calendar: reservation bars from every channel slide into place — no overlaps. */
export const Scene08: React.FC = () => {
  const frame = useCurrentFrame();
  const pCard = enter(frame, 0);
  return (
    <SceneShell bg={colors.mintSoft} transition="wipeLeft">
      <LightBackdrop tint={colors.mint} />
      <VisualStage lines={COPY.s08.headline.length}>
        <UICard style={{ left: 0, top: 0, width: 900, height: 740, opacity: pCard, transform: `translateY(${(1 - pCard) * 50}px)` }}>
          {/* legend */}
          <div style={{ position: "absolute", left: 30, top: 28, display: "flex", gap: 12 }}>
            {["Airbnb", "Booking.com", "Vrbo", "Direct"].map((c) => (
              <Chip key={c} label={c} size="sm" tone="tint" style={{ height: 50, fontSize: 22 }} />
            ))}
          </div>
          {/* day header */}
          {DAYS.map((d, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: LEFT + i * COL,
                width: COL,
                top: 112,
                textAlign: "center",
                fontFamily,
                fontWeight: 700,
                fontSize: 24,
                color: i >= 5 ? colors.primary : colors.gray,
              }}
            >
              {d}
            </div>
          ))}
          {/* rows */}
          {PROPS.map((name, r) => (
            <React.Fragment key={name}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: TOP + r * ROW,
                  height: ROW,
                  borderTop: `2px solid ${colors.line}`,
                  background: r % 2 ? "rgba(247,245,242,0.6)" : "transparent",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  top: TOP + r * ROW + ROW / 2,
                  transform: "translateY(-50%)",
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 25,
                  color: colors.forest,
                  width: LEFT - 40,
                }}
              >
                {name}
              </div>
            </React.Fragment>
          ))}
          {BOOKINGS.map(([r, d, span, ch, guest], i) => {
            const delay = 2 + i;
            const p = interpolate(frame, [delay, delay + 9], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE,
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: LEFT + d * COL + 4,
                  top: TOP + r * ROW + 20,
                  width: span * COL - 8,
                  height: ROW - 40,
                  borderRadius: 14,
                  background: channelColor[ch],
                  color: colors.white,
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 24,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 18,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  opacity: Math.min(1, p * 2),
                  transform: `translateX(${(1 - p) * 600}px)`,
                  boxShadow: "0 6px 14px rgba(7,44,35,0.12)",
                }}
              >
                {guest}
              </div>
            );
          })}
        </UICard>
      </VisualStage>
      <Headline lines={COPY.s08.headline} tone="onLight" />
    </SceneShell>
  );
};
