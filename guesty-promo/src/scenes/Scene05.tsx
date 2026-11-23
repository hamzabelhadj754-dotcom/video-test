import React from "react";
import { useCurrentFrame } from "remotion";
import { channelColor, colors, fontFamily } from "../brand";
import { ease, enter, lerp } from "../anim";
import { COPY } from "../copy";
import { Headline } from "../components/Headline";
import { Icon, IconName } from "../components/Icon";
import { LightBackdrop, SceneShell, VisualStage } from "../components/Stage";
import { Avatar, Skeleton, UICard } from "../components/UI";

const NAV: IconName[] = ["grid", "calendar", "message", "trend", "tasks", "users", "globe"];

const Panel: React.FC<{ title: string; icon: IconName; p: number; style: React.CSSProperties; children: React.ReactNode }> = ({
  title,
  icon,
  p,
  style,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      borderRadius: 20,
      background: colors.white,
      border: `2px solid ${colors.line}`,
      padding: 22,
      boxSizing: "border-box",
      opacity: p,
      transform: `translateY(${(1 - p) * 40}px) scale(${lerp(p, 0.94, 1)})`,
      ...style,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: colors.mint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={22} color={colors.primary} strokeWidth={2.4} />
      </div>
      <div style={{ fontFamily, fontWeight: 700, fontSize: 26, color: colors.forest }}>{title}</div>
    </div>
    {children}
  </div>
);

/** One platform — a dashboard builds itself: frame, sidebar, header, then cards stagger in. */
export const Scene05: React.FC = () => {
  const frame = useCurrentFrame();
  const pFrame = enter(frame, 0);
  const pSide = ease(frame, 2, 8);
  const pHead = ease(frame, 3, 8);
  const cards = [5, 7, 9, 11].map((d) => enter(frame, d, 9));
  const spark = ease(frame, 10, 20);

  return (
    <SceneShell bg={colors.cream}>
      <LightBackdrop />
      <VisualStage lines={COPY.s05.headline.length}>
        <UICard
          style={{
            left: 0,
            top: 10,
            width: 900,
            height: 720,
            opacity: pFrame,
            transform: `translateY(${(1 - pFrame) * 60}px) scale(${lerp(pFrame, 0.92, 1)})`,
          }}
        >
          {/* sidebar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 110,
              background: colors.forest,
              transform: `translateX(${(1 - pSide) * -110}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 30,
              gap: 22,
            }}
          >
            {NAV.map((n, i) => (
              <div
                key={n}
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  background: i === 0 ? colors.primary : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: ease(frame, 3 + i, 6),
                }}
              >
                <Icon name={n} size={30} color={i === 0 ? colors.white : colors.mint} strokeWidth={2.2} />
              </div>
            ))}
          </div>
          {/* header */}
          <div
            style={{
              position: "absolute",
              left: 110,
              right: 0,
              top: 0,
              height: 100,
              borderBottom: `2px solid ${colors.line}`,
              display: "flex",
              alignItems: "center",
              padding: "0 30px",
              gap: 20,
              opacity: pHead,
              transform: `translateY(${(1 - pHead) * -30}px)`,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 56,
                borderRadius: 99,
                background: colors.cream,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 22px",
                fontFamily,
                fontSize: 24,
                fontWeight: 500,
                color: colors.gray,
              }}
            >
              <Icon name="search" size={24} color={colors.gray} />
              Search reservations, guests…
            </div>
            <Icon name="bell" size={32} color={colors.forest} />
            <Avatar initials="JD" color={colors.primary} size={54} />
          </div>
          {/* cards */}
          <div style={{ position: "absolute", left: 140, top: 130, right: 30, bottom: 30 }}>
            <Panel title="Reservations" icon="calendar" p={cards[0]} style={{ left: 0, top: 0, width: 355, height: 270 }}>
              {[
                [0, 0.7, "Airbnb"],
                [0.25, 0.65, "Booking.com"],
                [0.1, 0.55, "Vrbo"],
              ].map(([l, w, ch], i) => (
                <div
                  key={i}
                  style={{
                    marginLeft: `${(l as number) * 100}%`,
                    width: `${(w as number) * 100 * ease(frame, 10 + i * 2, 10)}%`,
                    height: 34,
                    borderRadius: 99,
                    background: channelColor[ch as string],
                    marginBottom: 16,
                  }}
                />
              ))}
            </Panel>
            <Panel title="Inbox" icon="message" p={cards[1]} style={{ left: 375, top: 0, width: 355, height: 270 }}>
              {[colors.coral, colors.periwinkle, colors.primaryBright].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 99, background: c, flexShrink: 0 }} />
                  <Skeleton w={`${80 - i * 15}%`} h={14} />
                </div>
              ))}
            </Panel>
            <Panel title="Revenue" icon="trend" p={cards[2]} style={{ left: 0, top: 290, width: 355, height: 270 }}>
              <svg width="310" height="150" viewBox="0 0 310 150">
                <path
                  d="M0 130 C 40 120, 60 95, 100 100 S 160 60, 200 70 S 260 25, 310 15"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth={6}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - spark}
                />
              </svg>
            </Panel>
            <Panel title="Tasks" icon="tasks" p={cards[3]} style={{ left: 375, top: 290, width: 355, height: 270 }}>
              {[0, 1, 2].map((i) => {
                const done = ease(frame, 14 + i * 4, 6);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        border: `3px solid ${done > 0.5 ? colors.success : colors.grayLight}`,
                        background: done > 0.5 ? colors.success : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                      }}
                    >
                      <Icon name="check" size={22} color={colors.white} strokeWidth={3} style={{ opacity: done }} />
                    </div>
                    <Skeleton w={`${75 - i * 12}%`} h={14} />
                  </div>
                );
              })}
            </Panel>
          </div>
        </UICard>
      </VisualStage>
      <Headline lines={COPY.s05.headline} tone="onLight" />
    </SceneShell>
  );
};
