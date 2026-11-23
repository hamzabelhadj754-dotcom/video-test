import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, fontFamily, radius } from "../brand";
import { ease, enter } from "../anim";
import { COPY } from "../copy";
import { Headline } from "../components/Headline";
import { Icon, IconName } from "../components/Icon";
import { LightBackdrop, SceneShell, VisualStage } from "../components/Stage";
import { Skeleton, UICard } from "../components/UI";

const CardTitle: React.FC<{ icon: IconName; title: string }> = ({ icon, title }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 20px",
      borderRadius: radius.pill,
      background: colors.mint,
      color: colors.forest,
      fontFamily,
      fontWeight: 800,
      fontSize: 27,
      whiteSpace: "nowrap",
    }}
  >
    <Icon name={icon} size={26} color={colors.primary} strokeWidth={2.4} />
    {title}
  </div>
);

const Row: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontFamily,
      fontSize: strong ? 28 : 25,
      fontWeight: strong ? 800 : 600,
      color: strong ? colors.primary : colors.forest,
      padding: "12px 0",
      borderTop: strong ? `2px solid ${colors.line}` : "none",
    }}
  >
    <span style={{ opacity: strong ? 1 : 0.7 }}>{label}</span>
    <span>{value}</span>
  </div>
);

/** Two cards slide in side by side: direct booking website + owner statements. */
/** The scene's UI illustration (shared by the classic and soft versions). */
export const Scene11Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const pL = enter(frame, 1, 8);
  const pR = enter(frame, 3, 8);
  const bars = [0.45, 0.6, 0.52, 0.75, 0.9];
  return (
      <VisualStage lines={COPY.s11.headline.length}>
        {/* Booking website */}
        <UICard style={{ left: 0, top: 20, width: 435, height: 700, transform: `translateX(${(1 - pL) * -700}px) rotate(${(1 - pL) * -6}deg)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px", background: colors.cream }}>
            {[colors.coral, colors.peach, colors.primaryBright].map((c) => (
              <div key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />
            ))}
            <div
              style={{
                marginLeft: 10,
                flex: 1,
                height: 32,
                borderRadius: 99,
                background: colors.white,
                fontFamily,
                fontSize: 18,
                fontWeight: 600,
                color: colors.gray,
                display: "flex",
                alignItems: "center",
                paddingLeft: 14,
              }}
            >
              yourbrand.com
            </div>
          </div>
          <div style={{ padding: "22px 24px 0" }}>
            <CardTitle icon="globe" title="Booking website" />
          </div>
          <div
            style={{
              margin: "20px 24px 0",
              height: 220,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryBright} 60%, ${colors.mint})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="home" size={90} color={colors.white} strokeWidth={1.6} />
          </div>
          <div style={{ padding: "18px 24px", fontFamily }}>
            <div style={{ fontWeight: 800, fontSize: 30, color: colors.forest }}>Seaside Villa</div>
            <Skeleton w="70%" h={14} style={{ marginTop: 14 }} />
            <Skeleton w="50%" h={14} style={{ marginTop: 10 }} />
            <div
              style={{
                marginTop: 24,
                height: 70,
                borderRadius: radius.pill,
                background: colors.primary,
                color: colors.white,
                fontWeight: 800,
                fontSize: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Book now
            </div>
          </div>
        </UICard>

        {/* Owner statements */}
        <UICard style={{ left: 465, top: 20, width: 435, height: 700, transform: `translateX(${(1 - pR) * 700}px) rotate(${(1 - pR) * 6}deg)` }}>
          <div style={{ padding: "26px 24px 0" }}>
            <CardTitle icon="file" title="Owner statements" />
          </div>
          <div style={{ padding: "26px 28px 0", fontFamily }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.gray }}>Monthly statement</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: colors.forest, marginTop: 4 }}>Seaside Villa</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 180, padding: "20px 28px 0" }}>
            {bars.map((b, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${b * 100 * ease(frame, 6 + i * 2, 10)}%`,
                  borderRadius: 10,
                  background: i === bars.length - 1 ? colors.primary : colors.mint,
                }}
              />
            ))}
          </div>
          <div style={{ padding: "18px 28px 0" }}>
            <Row label="Revenue" value="$8,420" />
            <Row label="Expenses" value="$1,260" />
            <Row label="Owner payout" value="$7,160" strong />
          </div>
        </UICard>
      </VisualStage>
  );
};

export const Scene11: React.FC = () => (
  <SceneShell bg={colors.cream} transition="wipeRight">
    <LightBackdrop />
    <Scene11Stage />
    <Headline lines={COPY.s11.headline} tone="onLight" />
  </SceneShell>
);
