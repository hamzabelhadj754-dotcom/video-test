import React from "react";
import { useCurrentFrame } from "remotion";
import { channelColor, colors, fontFamily } from "../brand";
import { ease, enter, lerp } from "../anim";
import { Icon, IconName } from "../components/Icon";
import { Chip, glassSurface } from "../components/UI";
import { SCENES } from "../timing";

const CX = 450;
const CY = 370;
const CARD_W = 480;
const CARD_H = 520;
const PILL_W = 720;
const PILL_H = 118;

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: "globe", label: "Channel manager" },
  { icon: "calendar", label: "Multi-calendar" },
  { icon: "message", label: "Guest inbox" },
  { icon: "trend", label: "AI pricing" },
  { icon: "file", label: "Owner portal" },
];
const QUERY = "Meet Guesty";

type Phase = "morph" | "orbit" | "synced";

/**
 * Scenes 5–7 share one hub so cuts between them are seamless:
 *  morph:  search pill types "Meet Guesty" then morphs into the feature card (scene 5)
 *  orbit:  channels fly out and orbit the card in a tilted ring (scene 6)
 *  synced: ring keeps turning, everything gets a green check + sync pulses (scene 7)
 */
export const Hub: React.FC<{ phase: Phase; sceneId: number }> = ({ phase, sceneId }) => {
  const frame = useCurrentFrame();
  const global = frame + SCENES[sceneId - 1].start;
  const m = phase === "morph" ? ease(frame, 10, 12) : 1;
  const typed = phase === "morph" ? Math.round(Math.min(1, Math.max(0, (frame - 1) / 8)) * QUERY.length) : QUERY.length;
  const caret = phase === "morph" && frame < 12 && Math.floor(frame / 4) % 2 === 0;
  const pIn = phase === "morph" ? enter(frame, 0) : 1;

  const w = lerp(m, PILL_W, CARD_W);
  const h = lerp(m, PILL_H, CARD_H);

  const card = (
    <div
      style={{
        position: "absolute",
        left: CX - w / 2,
        top: CY - h / 2,
        width: w,
        height: h,
        ...glassSurface(lerp(m, PILL_H / 2, 36)),
        overflow: "hidden",
        fontFamily,
        opacity: pIn,
        filter: pIn < 0.999 ? `blur(${(1 - pIn) * 14}px)` : undefined,
        transform: `scale(${lerp(pIn, 0.92, 1)})`,
        zIndex: 2,
      }}
    >
      {/* search row */}
      <div
        style={{
          position: "absolute",
          left: lerp(m, 30, 18),
          right: lerp(m, 30, 18),
          top: lerp(m, (PILL_H - 70) / 2, 22),
          height: lerp(m, 70, 70),
          borderRadius: 99,
          background: `rgba(7,44,35,${0.06 * m})`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          paddingLeft: lerp(m, 6, 18),
          color: colors.forest,
          fontSize: lerp(m, 44, 32),
          fontWeight: 500,
        }}
      >
        <Icon name="search" size={lerp(m, 40, 32)} color={colors.gray} strokeWidth={2.2} />
        <span>
          {QUERY.slice(0, typed)}
          <span style={{ opacity: caret ? 1 : 0, color: colors.primary }}>|</span>
        </span>
      </div>
      {/* feature rows */}
      {FEATURES.map((f, i) => {
        const p = phase === "morph" ? ease(frame, 15 + i * 3, 8) : 1;
        const check = phase === "synced" ? enter(frame, 10 + i * 2, 8) : 0;
        return (
          <div
            key={f.label}
            style={{
              position: "absolute",
              left: 30,
              right: 26,
              top: 112 + i * 80,
              height: 62,
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: 32,
              whiteSpace: "nowrap",
              fontWeight: 600,
              color: colors.forest,
              opacity: p,
              filter: p < 0.999 ? `blur(${(1 - p) * 10}px)` : undefined,
              transform: `translateY(${(1 - p) * 18}px)`,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 17,
                background: colors.mint,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={f.icon} size={30} color={colors.primary} strokeWidth={2.3} />
            </div>
            {f.label}
            <div
              style={{
                marginLeft: "auto",
                width: 42,
                height: 42,
                borderRadius: 99,
                background: colors.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: check,
                transform: `scale(${lerp(check, 0.4, 1)})`,
              }}
            >
              <Icon name="check" size={20} color={colors.white} strokeWidth={3.2} />
            </div>
          </div>
        );
      })}
    </div>
  );

  if (phase === "morph") return card;
  return (
    <>
      {phase === "synced" ? <SyncPulses frame={frame} /> : null}
      <Orbit frame={frame} global={global} entering={phase === "orbit"} synced={phase === "synced"}>
        {card}
      </Orbit>
    </>
  );
};

const SyncPulses: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {[0, 1, 2].map((k) => {
      const t = (frame - 8 - k * 12) / 28;
      if (t < 0 || t > 1) return null;
      const r = lerp(t, 280, 620);
      return (
        <div
          key={k}
          style={{
            position: "absolute",
            left: CX - r,
            top: CY - r * 0.78,
            width: r * 2,
            height: r * 1.56,
            borderRadius: "50%",
            border: `4px solid rgba(255,255,255,${(1 - t) * 0.7})`,
            zIndex: 0,
          }}
        />
      );
    })}
  </>
);

type Item = { label?: string; icon?: IconName };
const ITEMS: Item[] = [
  { label: "Airbnb" },
  { icon: "calendar" },
  { label: "Booking.com" },
  { label: "Vrbo" },
  { icon: "home" },
  { label: "Expedia" },
  { label: "Google Travel" },
  { label: "Hopper" },
];
const RX = 352;
const RY = 335;

/** Tilted ring of channels around the card; items behind the card are smaller and dimmer. */
const Orbit: React.FC<{ frame: number; global: number; entering: boolean; synced: boolean; children: React.ReactNode }> = ({
  frame,
  global,
  entering,
  synced,
  children,
}) => {
  const p = entering ? ease(frame, 0, 12) : 1;
  const speed = (Math.PI * 2) / 240; // one turn per 8 s
  const rendered = ITEMS.map((it, i) => {
    const a = global * speed + (i / ITEMS.length) * Math.PI * 2;
    const depth = (Math.sin(a) + 1) / 2; // 1 = front (bottom of ring)
    const x = CX + Math.cos(a) * RX * lerp(p, 0.25, 1);
    const y = CY + Math.sin(a) * RY * lerp(p, 0.25, 1);
    const s = lerp(depth, 0.72, 1) * lerp(p, 0.4, 1);
    const check = synced ? enter(frame, 10 + (i % 3), 8) : 0;
    const node = (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${s})`,
          opacity: Math.min(1, p * 1.4) * lerp(depth, 0.55, 1),
          filter: `blur(${(1 - depth) * 2.2 + (1 - p) * 10}px)`,
          zIndex: depth > 0.5 ? 3 : 1,
        }}
      >
        {it.label ? (
          <Chip label={it.label} size="md" style={{ height: 80, fontSize: 32, padding: "0 28px" }} />
        ) : (
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 24,
              ...glassSurface(24),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={it.icon!} size={40} color={channelColor.Vrbo} strokeWidth={2.2} />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            right: -8,
            top: -10,
            width: 34,
            height: 34,
            borderRadius: 99,
            background: colors.success,
            border: "3px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: check,
            transform: `scale(${lerp(check, 0.3, 1)})`,
          }}
        >
          <Icon name="check" size={18} color={colors.white} strokeWidth={3.4} />
        </div>
      </div>
    );
    return { node, front: depth > 0.5 };
  });
  return (
    <>
      {rendered.filter((r) => !r.front).map((r) => r.node)}
      {children}
      {rendered.filter((r) => r.front).map((r) => r.node)}
    </>
  );
};
