import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, fontFamily, radius } from "../brand";
import { enter, lerp, mapRange } from "../anim";
import { COPY } from "../copy";
import { Headline } from "../components/Headline";
import { Icon, IconName } from "../components/Icon";
import { DarkBackdrop, SceneShell, VisualStage } from "../components/Stage";
import { Chip } from "../components/UI";
import { SCENE } from "../timing";

const CHIPS = [
  { label: "Airbnb", x: 40, y: 150, rot: -5, delay: 0, from: 3, to: 27 },
  { label: "Booking.com", x: 300, y: 340, rot: 4, delay: 2, from: 1, to: 19 },
  { label: "Vrbo", x: 110, y: 540, rot: -3, delay: 4, from: 2, to: 14 },
];

const TOASTS: { icon: IconName; text: string; x: number; y: number; rot: number; at: number }[] = [
  { icon: "message", text: "New guest message", x: 500, y: 40, rot: 3, at: 3 },
  { icon: "calendar", text: "Booking request", x: 560, y: 210, rot: -4, at: 8 },
  { icon: "bell", text: "Check-in at 3 PM?", x: 0, y: 20, rot: -2, at: 13 },
  { icon: "tag", text: "Update your rates", x: 520, y: 520, rot: 5, at: 18 },
  { icon: "message", text: "Where are the keys?", x: 480, y: 640, rot: -3, at: 24 },
  { icon: "bell", text: "Calendar out of sync", x: 20, y: 400, rot: 3, at: 30 },
];

const Toast: React.FC<{ icon: IconName; text: string; p: number }> = ({ icon, text, p }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 24px 16px 16px",
      borderRadius: radius.pill,
      background: "rgba(255,255,255,0.12)",
      border: "1.5px solid rgba(255,255,255,0.18)",
      color: colors.white,
      fontFamily,
      fontWeight: 600,
      fontSize: 28,
      whiteSpace: "nowrap",
      opacity: p * 0.9,
      transform: `scale(${lerp(p, 0.6, 1)})`,
    }}
  >
    <span
      style={{
        width: 44,
        height: 44,
        borderRadius: 99,
        background: colors.alert,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={24} color={colors.white} strokeWidth={2.4} />
    </span>
    {text}
  </div>
);

export const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneShell bg={colors.forest}>
      <DarkBackdrop />
      <VisualStage lines={COPY.s01.headline.length} shake={4}>
        {TOASTS.map((t, i) => (
          <div key={i} style={{ position: "absolute", left: t.x, top: t.y, transform: `rotate(${t.rot}deg)` }}>
            <Toast icon={t.icon} text={t.text} p={enter(frame, t.at, 9)} />
          </div>
        ))}
        {CHIPS.map((c) => {
          const p = enter(frame, c.delay);
          const badge = Math.round(mapRange(frame, [c.delay + 2, SCENE], [c.from, c.to]));
          return (
            <div
              key={c.label}
              style={{
                position: "absolute",
                left: c.x,
                top: c.y,
                opacity: p,
                transform: `translateY(${(1 - p) * 80}px) rotate(${c.rot}deg) scale(${lerp(p, 0.5, 1)})`,
              }}
            >
              <Chip label={c.label} size="lg" badge={badge} />
            </div>
          );
        })}
      </VisualStage>
      <Headline lines={COPY.s01.headline} tone="onDark" />
    </SceneShell>
  );
};
