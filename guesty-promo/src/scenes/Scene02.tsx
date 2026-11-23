import React from "react";
import { useCurrentFrame } from "remotion";
import { channelColor, colors, fontFamily, radius } from "../brand";
import { enter, lerp, mapRange } from "../anim";
import { COPY } from "../copy";
import { Headline } from "../components/Headline";
import { Icon } from "../components/Icon";
import { DarkBackdrop, SceneShell, VisualStage } from "../components/Stage";
import { Chip, UICard } from "../components/UI";

/** Bars: [row, startCol, span] on a 7x4 grid. */
const MiniCalendar: React.FC<{ channel: string; color: string; bars: [number, number, number][]; clash?: [number, number, number] }> = ({
  channel,
  color,
  bars,
  clash,
}) => {
  const cell = 46;
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <Chip label={channel} size="sm" tone="tint" />
        <div style={{ fontFamily, fontWeight: 700, fontSize: 22, color: colors.gray }}>June</div>
      </div>
      <div style={{ position: "relative", width: cell * 7, height: cell * 4 }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (i % 7) * cell,
              top: Math.floor(i / 7) * cell,
              width: cell - 6,
              height: cell - 6,
              borderRadius: 8,
              background: colors.cream,
            }}
          />
        ))}
        {bars.map(([r, c, span], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c * cell + 4,
              top: r * cell + 10,
              width: span * cell - 14,
              height: 20,
              borderRadius: 99,
              background: color,
            }}
          />
        ))}
        {clash ? (
          <div
            style={{
              position: "absolute",
              left: clash[1] * cell - 2,
              top: clash[0] * cell + 2,
              width: clash[2] * cell - 2,
              height: 36,
              borderRadius: 10,
              border: `4px solid ${colors.alert}`,
              background: "rgba(250,87,103,0.25)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

const CALS = [
  { channel: "Airbnb", x: 20, y: 40, rot: -8, fromX: -700, fromY: 0, delay: 0 },
  { channel: "Booking.com", x: 480, y: 70, rot: 7, fromX: 700, fromY: 0, delay: 1 },
  { channel: "Vrbo", x: 250, y: 230, rot: -2, fromX: 0, fromY: 800, delay: 2 },
];

const BARS: Record<string, [number, number, number][]> = {
  Airbnb: [[0, 1, 3], [1, 4, 3], [2, 0, 2], [3, 2, 4]],
  "Booking.com": [[0, 3, 3], [1, 0, 3], [2, 3, 3], [3, 0, 2]],
  Vrbo: [[0, 0, 2], [1, 2, 4], [2, 4, 3], [3, 1, 3]],
};

/** The scene's UI illustration (shared by the classic and soft versions). */
export const Scene02Stage: React.FC = () => {
  const frame = useCurrentFrame();
  // impact shake after the calendars collide, decaying
  const impact = mapRange(frame, [7, 9, 22], [0, 9, 0]);
  const pAlert = enter(frame, 3, 7);

  return (
      <VisualStage lines={COPY.s02.headline.length} shake={impact + 1.5}>
        {CALS.map((c) => {
          const p = enter(frame, c.delay, 8 - c.delay);
          return (
            <UICard
              key={c.channel}
              dark
              style={{
                left: c.x,
                top: c.y,
                width: 370,
                transform: `translate(${(1 - p) * c.fromX}px, ${(1 - p) * c.fromY}px) rotate(${c.rot}deg)`,
              }}
            >
              <MiniCalendar
                channel={c.channel}
                color={channelColor[c.channel]}
                bars={BARS[c.channel]}
                clash={c.channel === "Vrbo" ? [1, 2, 3] : undefined}
              />
            </UICard>
          );
        })}
        {/* the alert slams in */}
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 520,
            width: 720,
            opacity: Math.min(1, pAlert * 2),
            transform: `scale(${lerp(pAlert, 1.7, 1)}) rotate(-3deg)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "30px 40px",
              borderRadius: radius.card,
              background: colors.alert,
              color: colors.white,
              fontFamily,
              fontWeight: 800,
              fontSize: 60,
              letterSpacing: "-0.02em",
              boxShadow: "0 30px 80px rgba(250,87,103,0.45), 0 0 0 10px rgba(250,87,103,0.25)",
            }}
          >
            <Icon name="alert" size={72} color={colors.white} strokeWidth={2.4} />
            {COPY.s02.alert}
          </div>
        </div>
      </VisualStage>
  );
};

export const Scene02: React.FC = () => (
  <SceneShell bg={colors.forest}>
    <DarkBackdrop />
    <Scene02Stage />
    <Headline lines={COPY.s02.headline} tone="onDark" />
  </SceneShell>
);
