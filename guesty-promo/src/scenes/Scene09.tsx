import React from "react";
import { useCurrentFrame } from "remotion";
import { channelColor, colors, fontFamily, radius } from "../brand";
import { enter, lerp } from "../anim";
import { COPY } from "../copy";
import { Headline } from "../components/Headline";
import { Icon } from "../components/Icon";
import { LightBackdrop, SceneShell, VisualStage } from "../components/Stage";
import { Avatar, Chip, UICard } from "../components/UI";

const MESSAGES = [
  { name: "Sofia G.", ch: "Airbnb", text: "Can we check in early?", time: "now" },
  { name: "Daniel P.", ch: "Booking.com", text: "Is parking included?", time: "2m" },
  { name: "Hannah L.", ch: "Vrbo", text: "What's the Wi-Fi password?", time: "5m" },
];
const REPLY = "Sure! Early check-in at 1 PM is all set.";

/** Unified inbox: messages from every channel stack in; an AI reply types itself. */
export const Scene09: React.FC = () => {
  const frame = useCurrentFrame();
  const pCard = enter(frame, 0);
  const pReply = enter(frame, 10, 8);
  const typed = Math.round(lerp(Math.min(1, Math.max(0, (frame - 16) / 22)), 0, REPLY.length));
  const caretOn = Math.floor(frame / 8) % 2 === 0 || typed < REPLY.length;

  return (
    <SceneShell bg={colors.cream} transition="wipeRight">
      <LightBackdrop />
      <VisualStage lines={COPY.s09.headline.length}>
        <UICard style={{ left: 0, top: 50, width: 900, height: 640, opacity: pCard, transform: `translateY(${(1 - pCard) * 50}px)` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "28px 32px",
              borderBottom: `2px solid ${colors.line}`,
              fontFamily,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 800, fontSize: 34, color: colors.forest }}>
              <Icon name="message" size={34} color={colors.primary} strokeWidth={2.4} />
              Inbox
            </div>
            <div
              style={{
                padding: "10px 20px",
                borderRadius: radius.pill,
                background: colors.mint,
                color: colors.primary,
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              All channels
            </div>
          </div>
          {MESSAGES.map((m, i) => {
            const p = enter(frame, 2 + i * 2, 9);
            return (
              <div
                key={m.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "20px 32px",
                  borderBottom: `2px solid ${colors.line}`,
                  background: i === 0 ? colors.mintSoft : colors.white,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 80}px)`,
                  fontFamily,
                }}
              >
                <Avatar initials={m.name.slice(0, 1) + m.name.split(" ")[1][0]} color={channelColor[m.ch]} size={64} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 28, color: colors.forest }}>{m.name}</span>
                    <Chip label={m.ch} size="sm" tone="tint" style={{ height: 36, fontSize: 18, padding: "0 12px" }} />
                    <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 600, color: colors.gray }}>{m.time}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 26, fontWeight: 500, color: colors.ink, opacity: 0.75 }}>{m.text}</div>
                </div>
              </div>
            );
          })}
          {/* AI reply composer */}
          <div
            style={{
              position: "absolute",
              left: 32,
              right: 32,
              bottom: 32,
              borderRadius: 22,
              background: colors.forest,
              padding: "24px 28px",
              fontFamily,
              opacity: pReply,
              transform: `translateY(${(1 - pReply) * 60}px)`,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: radius.pill,
                background: colors.lime,
                color: colors.forest,
                fontWeight: 800,
                fontSize: 22,
              }}
            >
              <Icon name="sparkle" size={22} color={colors.forest} strokeWidth={2.2} />
              AI reply
            </div>
            <div style={{ marginTop: 16, fontSize: 30, fontWeight: 600, color: colors.white, minHeight: 40 }}>
              {REPLY.slice(0, typed)}
              <span style={{ opacity: caretOn ? 1 : 0, color: colors.mint }}>|</span>
            </div>
          </div>
        </UICard>
      </VisualStage>
      <Headline lines={COPY.s09.headline} tone="onLight" />
    </SceneShell>
  );
};
