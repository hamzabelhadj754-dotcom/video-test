import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Avatar,
  C,
  Check,
  EV,
  Eyebrow,
  LogoMark,
  RevealLine,
  SC,
  card,
  euro,
  floatCard,
  font,
  lerp,
  p,
  sceneMotion,
} from "../lib";
import { AppHeader, Phone, StatusBar } from "../Phone";

const Ambient: React.FC<{ x: number; y: number; color?: string; a?: number }> = ({ x, y, color = "124,92,255", a = 0.16 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 38% 48% at ${x}% ${y}%, rgba(${color},${a}) 0%, rgba(${color},0) 100%)`,
    }}
  />
);

const Tap: React.FC<{ f: number; at: number; x: number; y: number }> = ({ f, at, x, y }) => {
  const d = f - at;
  if (d < -8 || d > 18) return null;
  const pre = p(f, at - 8, 8);
  const post = p(f, at, 16);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 34,
        top: y - 34,
        width: 68,
        height: 68,
        borderRadius: 34,
        background: `rgba(255,255,255,${0.35 * pre * (1 - post)})`,
        boxShadow: `0 0 0 ${post * 26}px rgba(255,255,255,${0.25 * (1 - post)})`,
        transform: `scale(${lerp(1.3, 0.85, pre)})`,
      }}
    />
  );
};

/* =====================  SCENE 4 — INVOICE BUILDER  ===================== */

const ITEMS = [
  { name: "Brand identity design", meta: "1 × €900", amt: 900 },
  { name: "Landing page design", meta: "1 × €350", amt: 350 },
];

export const S4Invoice: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const o = SC.f1[0];
  const m = sceneMotion(f, dur, { from: "right", to: "left" });
  const clientT = p(f, EV.f1Client - o, 16);
  const itemT = EV.f1Items.map((g) => p(f, g - o, 16));
  const totalT = p(f, EV.f1Total[0] - o, EV.f1Total[1] - EV.f1Total[0]);
  const tap = EV.f1Tap - o;
  const pressed = f >= tap && f < tap + 5;
  const sent = p(f, tap + 6, 12);
  const fly = p(f, EV.f1Fly - o, 26, (x) => x * x);
  const docIn = p(f, EV.f1Total[0] - o + 10, 24);
  const drift = f / dur;

  return (
    <AbsoluteFill style={m}>
      <Ambient x={70} y={48} />
      {/* copy */}
      <div style={{ position: "absolute", left: 130, top: 270, width: 880 }}>
        <Eyebrow f={f} start={6} text="SMART INVOICES" dot={C.violet} />
        <RevealLine f={f} start={10} style={font(112, 800)}>
          Pro invoices
        </RevealLine>
        <RevealLine f={f} start={18} style={{ ...font(112, 800), marginTop: 6 }}>
          in 30 seconds.
        </RevealLine>
        <div style={{ ...font(34, 500, C.grey), marginTop: 40, lineHeight: 1.4, opacity: p(f, 34, 20) }}>
          Add a client. Add your work.
          <br />
          Hit send.
        </div>
      </div>

      {/* invoice document flying out */}
      <div style={{ position: "absolute", left: 1400, top: 150, perspective: 1800 }}>
        <div
          style={{
            ...floatCard({ width: 470, height: 660, padding: 38 }),
            opacity: docIn * (1 - fly),
            transform: `translateX(${lerp(-160, 0, docIn) + fly * 700}px) translateY(${-fly * 140}px) rotateY(-24deg) rotateZ(${lerp(-4, 3, docIn) + fly * 8}deg)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <LogoMark size={46} glow={0.4} />
            <div style={{ ...font(22, 700, C.grey), letterSpacing: "0.16em" }}>INVOICE</div>
          </div>
          <div style={{ ...font(34, 800), marginTop: 30 }}>#022</div>
          <div style={{ ...font(20, 500, C.grey), marginTop: 8 }}>Billed to Acme Studio</div>
          <div style={{ marginTop: 34, borderTop: `1px solid ${C.line}` }}>
            {ITEMS.map((it) => (
              <div key={it.name} style={{ display: "flex", justifyContent: "space-between", padding: "18px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ ...font(20, 600) }}>{it.name}</div>
                <div style={{ ...font(20, 600, C.grey) }}>{euro(it.amt)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 40 }}>
            <div style={{ ...font(22, 600, C.grey) }}>Total due</div>
            <div style={{ ...font(46, 800) }}>€1,250</div>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: C.violet, marginTop: 36, width: "40%" }} />
        </div>
      </div>

      {/* phone */}
      <div style={{ position: "absolute", left: 1010, top: 50 + Math.sin(f / 24) * 7, perspective: 2000 }}>
        <div style={{ transform: `rotateY(${lerp(-17, -11, drift)}deg) rotateX(4deg)` }}>
          <Phone width={470} glare={lerp(15, 75, drift)}>
            <StatusBar time="9:41" />
            <AppHeader title="New invoice" right={<div style={{ ...font(20, 600, C.grey) }}>#022</div>} />
            <div style={{ position: "absolute", top: 132, left: 18, right: 18 }}>
              <div style={{ ...font(15, 700, C.grey), letterSpacing: "0.14em", marginBottom: 10 }}>BILL TO</div>
              <div
                style={{
                  ...card({ padding: "16px 16px", display: "flex", alignItems: "center", gap: 14 }),
                  opacity: clientT,
                  transform: `translateY(${(1 - clientT) * 30}px)`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1.5px rgba(124,92,255,${0.6 * (1 - p(f, EV.f1Client - o + 16, 20))})`,
                }}
              >
                <Avatar text="AS" size={50} />
                <div>
                  <div style={{ ...font(22, 700) }}>Acme Studio</div>
                  <div style={{ ...font(16, 500, C.grey), marginTop: 4 }}>London, United Kingdom</div>
                </div>
              </div>
              <div style={{ ...font(15, 700, C.grey), letterSpacing: "0.14em", margin: "24px 0 10px" }}>ITEMS</div>
              {ITEMS.map((it, i) => (
                <div
                  key={it.name}
                  style={{
                    ...card({ padding: "15px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }),
                    opacity: itemT[i],
                    transform: `translateX(${(1 - itemT[i]) * 60}px)`,
                  }}
                >
                  <div>
                    <div style={{ ...font(19, 600) }}>{it.name}</div>
                    <div style={{ ...font(15, 500, C.grey), marginTop: 4 }}>{it.meta}</div>
                  </div>
                  <div style={{ ...font(20, 700) }}>{euro(it.amt)}</div>
                </div>
              ))}
              <div
                style={{
                  ...font(17, 600, C.grey),
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 4px",
                  opacity: itemT[1],
                }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${C.violet}`, display: "flex", alignItems: "center", justifyContent: "center", ...font(16, 700) }}>+</div>
                Add item
              </div>
              <div style={{ height: 1, background: C.line, margin: "18px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", ...font(17, 500, C.grey), opacity: totalT > 0 ? 1 : 0.4 }}>
                <span>Due date</span>
                <span style={{ color: C.white, fontWeight: 600 }}>In 14 days</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 18 }}>
                <div style={{ ...font(20, 600, C.grey) }}>Total</div>
                <div style={{ ...font(54, 800), letterSpacing: "-0.04em" }}>{euro(1250 * totalT)}</div>
              </div>
            </div>
            {/* send button */}
            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 40,
                height: 70,
                borderRadius: 22,
                background: C.violet,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                transform: `scale(${pressed ? 0.95 : 1})`,
                boxShadow: `0 14px 40px rgba(124,92,255,${0.45 + 0.4 * sent * (1 - p(f, tap + 20, 30))}), inset 0 1px 0 rgba(255,255,255,0.3)`,
                ...font(24, 700),
              }}
            >
              {sent > 0 ? (
                <>
                  <Check size={28} draw={sent} />
                  <span style={{ opacity: sent }}>Invoice sent</span>
                </>
              ) : (
                "Send invoice"
              )}
            </div>
            <Tap f={f} at={tap} x={240} y={790} />
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =====================  SCENE 5 — AUTO REMINDERS  ===================== */

const STEPS = [
  { day: "Day 0", text: "Invoice sent" },
  { day: "Day 3", text: "Friendly reminder sent" },
  { day: "Day 7", text: "Follow-up sent" },
];

const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <div
    style={{
      width: 58,
      height: 34,
      borderRadius: 17,
      background: on > 0.5 ? C.violet : "#3a3a3f",
      position: "relative",
      boxShadow: on > 0.5 ? "0 0 18px rgba(124,92,255,0.6)" : undefined,
    }}
  >
    <div style={{ position: "absolute", top: 3, left: lerp(3, 27, on), width: 28, height: 28, borderRadius: 14, background: "#fff" }} />
  </div>
);

export const S5Reminders: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const o = SC.f2[0];
  const m = sceneMotion(f, dur, { from: "right", to: "left" });
  const tog = p(f, EV.f2Toggle - o, 10);
  const cardT = EV.f2Cards.map((g) => p(f, g - o, 18));
  const line = interpolate(f, [EV.f2Cards[0] - o, EV.f2Cards[2] - o + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = f / dur;

  return (
    <AbsoluteFill style={m}>
      <Ambient x={28} y={50} />
      {/* phone left */}
      <div style={{ position: "absolute", left: 180, top: 60 + Math.sin(f / 24) * 7, perspective: 2000 }}>
        <div style={{ transform: `rotateY(${lerp(17, 11, drift)}deg) rotateX(4deg)` }}>
          <Phone width={460} glare={lerp(70, 20, drift)}>
            <StatusBar time="9:41" />
            <AppHeader title="Invoice #022" />
            <div style={{ position: "absolute", top: 130, left: 18, right: 18 }}>
              <div style={{ ...card({ padding: 20 }) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar text="AS" size={44} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...font(20, 700) }}>Acme Studio</div>
                    <div style={{ ...font(15, 500, C.grey), marginTop: 3 }}>Due in 14 days</div>
                  </div>
                  <div style={{ ...font(26, 800) }}>€1,250</div>
                </div>
                <div
                  style={{
                    marginTop: 16,
                    display: "inline-flex",
                    padding: "6px 14px",
                    borderRadius: 999,
                    boxShadow: "inset 0 0 0 1.5px rgba(124,92,255,0.8)",
                    background: "rgba(124,92,255,0.14)",
                    ...font(15, 700),
                  }}
                >
                  Awaiting payment
                </div>
              </div>
              <div style={{ ...card({ padding: "18px 20px", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }) }}>
                <div>
                  <div style={{ ...font(20, 700) }}>Auto-reminders</div>
                  <div style={{ ...font(15, 500, C.grey), marginTop: 3 }}>Polite, on schedule</div>
                </div>
                <Toggle on={tog} />
              </div>
              <div style={{ ...font(15, 700, C.grey), letterSpacing: "0.14em", margin: "24px 0 10px" }}>SCHEDULE</div>
              {["Day 3 · Friendly reminder", "Day 7 · Follow-up", "Day 14 · Final notice"].map((s, i) => {
                const done = i < 2 ? p(f, EV.f2Cards[i + 1] - o + 4, 10) : 0;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: `1px solid ${C.line}` }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        background: done > 0 ? C.violet : "transparent",
                        boxShadow: done > 0 ? undefined : "inset 0 0 0 2px #45454b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={18} draw={done} />
                    </div>
                    <div style={{ ...font(18, 600, done > 0 ? C.white : C.grey) }}>{s}</div>
                  </div>
                );
              })}
              <div style={{ ...card({ padding: 18, marginTop: 18 }), opacity: p(f, EV.f2Cards[1] - o, 14) }}>
                <div style={{ ...font(14, 700, C.grey), letterSpacing: "0.12em" }}>SENT AUTOMATICALLY</div>
                <div style={{ ...font(17, 500), lineHeight: 1.45, marginTop: 8 }}>
                  Hi Acme Studio team, a friendly reminder that invoice #022 is due soon…
                </div>
              </div>
            </div>
          </Phone>
        </div>
      </div>

      {/* copy + big timeline */}
      <div style={{ position: "absolute", left: 830, top: 110, width: 1000 }}>
        <Eyebrow f={f} start={6} text="AUTOMATIC REMINDERS" dot={C.violet} />
        <RevealLine f={f} start={10} style={font(88, 800)}>
          Reminders that
        </RevealLine>
        <RevealLine f={f} start={18} style={{ ...font(88, 800), marginTop: 6 }}>
          send themselves.
        </RevealLine>
      </div>
      <div style={{ position: "absolute", left: 830, top: 470, width: 960 }}>
        <div
          style={{
            position: "absolute",
            left: 45,
            top: 50,
            width: 4,
            height: 300 * line,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${C.violet}, rgba(124,92,255,0.3))`,
            boxShadow: "0 0 16px rgba(124,92,255,0.7)",
          }}
        />
        {STEPS.map((s, i) => {
          const t = cardT[i];
          return (
            <div
              key={s.day}
              style={{
                ...floatCard({ height: 116, marginBottom: 24, display: "flex", alignItems: "center", gap: 26, padding: "0 30px 0 0" }),
                background: "transparent",
                boxShadow: "none",
                opacity: t,
                transform: `translateX(${(1 - t) * 220}px)`,
              }}
            >
              <div
                style={{
                  width: 94,
                  height: 94,
                  borderRadius: 47,
                  background: C.violet,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 ${30 * t}px rgba(124,92,255,0.65), inset 0 1.5px 0 rgba(255,255,255,0.35)`,
                  flexShrink: 0,
                  transform: `scale(${lerp(0.6, 1, t)})`,
                }}
              >
                <Check size={50} draw={p(f, EV.f2Cards[i] - o + 8, 12)} width={2.8} />
              </div>
              <div
                style={{
                  ...floatCard({ flex: 1, height: 116, display: "flex", alignItems: "center", gap: 26, padding: "0 34px" }),
                }}
              >
                <div style={{ ...font(30, 700, C.grey), width: 104 }}>{s.day}</div>
                <div style={{ width: 2, height: 44, background: C.line }} />
                <div style={{ ...font(38, 700), flex: 1 }}>{s.text}</div>
                <Check size={40} color={C.white} draw={p(f, EV.f2Cards[i] - o + 12, 12)} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* =====================  SCENE 6 — DASHBOARD  ===================== */

const BARS = [0.42, 0.58, 0.5, 0.72, 0.64, 0.8];
const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

const StatusPill: React.FC<{ paid: number; scale?: number }> = ({ paid, scale = 1 }) => {
  // 3D flip Pending -> Paid
  const rot = paid * 180;
  const showBack = rot > 90;
  const s = scale;
  return (
    <div style={{ perspective: 600 * s }}>
      <div
        style={{
          transform: `rotateX(${showBack ? rot - 180 : rot}deg)`,
          display: "inline-flex",
          alignItems: "center",
          gap: 8 * s,
          padding: `${7 * s}px ${16 * s}px`,
          borderRadius: 999,
          background: showBack ? "rgba(61,220,151,0.18)" : "rgba(255,255,255,0.08)",
          boxShadow: showBack
            ? `inset 0 0 0 ${1.5 * s}px ${C.mint}, 0 0 ${26 * s}px rgba(61,220,151,0.55)`
            : `inset 0 0 0 ${1.5 * s}px rgba(180,188,214,0.35)`,
          ...font(17 * s, 700, C.white),
          letterSpacing: 0,
          whiteSpace: "nowrap",
        }}
      >
        {showBack ? (
          <>
            <div style={{ width: 22 * s, height: 22 * s, borderRadius: 11 * s, background: C.mint, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={16 * s} color="#0A0A0A" width={3.2} />
            </div>
            Paid
          </>
        ) : (
          <>
            <div style={{ width: 9 * s, height: 9 * s, borderRadius: 5 * s, background: C.grey }} />
            Pending
          </>
        )}
      </div>
    </div>
  );
};

export const S6Dashboard: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const o = SC.f3[0];
  const m = sceneMotion(f, dur, { from: "right", to: "scale" });
  const barsAt = EV.f3Bars - o;
  const paidAt = EV.f3Paid - o;
  const paid = p(f, paidAt, 12);
  const glow = p(f, paidAt, 8) * (1 - p(f, paidAt + 20, 50) * 0.6);
  const received = 4850 + 1250 * p(f, paidAt + 4, 24);
  const drift = f / dur;
  const big = p(f, 40, 22);

  return (
    <AbsoluteFill style={m}>
      <Ambient x={70} y={48} />
      <Ambient x={32} y={64} color="61,220,151" a={0.13 * glow} />
      <div style={{ position: "absolute", left: 130, top: 150, width: 860 }}>
        <Eyebrow f={f} start={6} text="LIVE DASHBOARD" dot={C.violet} />
        <RevealLine f={f} start={10} style={font(88, 800)}>
          See every payment
        </RevealLine>
        <RevealLine f={f} start={18} style={{ ...font(88, 800), marginTop: 6 }}>
          in real time.
        </RevealLine>
      </div>
      {/* big floating invoice row */}
      <div style={{ position: "absolute", left: 120, top: 540, perspective: 1600 }}>
        <div
          style={{
            ...floatCard({ width: 920, height: 190, display: "flex", alignItems: "center", gap: 26, padding: "0 36px" }),
            opacity: big,
            transform: `translateY(${(1 - big) * 60}px) rotateY(8deg) rotateX(6deg) scale(${1 + 0.03 * glow})`,
            boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.09), 0 0 0 ${1.5}px rgba(61,220,151,${0.6 * glow}), 0 0 70px rgba(61,220,151,${0.3 * glow}), 0 50px 100px -20px rgba(0,0,0,0.75)`,
          }}
        >
          <Avatar text="AS" size={84} />
          <div style={{ flex: 1 }}>
            <div style={{ ...font(40, 700) }}>Acme Studio</div>
            <div style={{ ...font(26, 500, C.grey), marginTop: 8 }}>Invoice #022</div>
          </div>
          <div style={{ ...font(46, 800), marginRight: 10 }}>€1,250</div>
          <StatusPill paid={paid} scale={1.7} />
        </div>
      </div>

      {/* phone right */}
      <div style={{ position: "absolute", left: 1150, top: 50 + Math.sin(f / 24) * 7, perspective: 2000 }}>
        <div style={{ transform: `rotateY(${lerp(-17, -11, drift)}deg) rotateX(4deg)` }}>
          <Phone width={470} glare={lerp(15, 75, drift)}>
            <StatusBar time="9:41" />
            <AppHeader title="Overview" back={false} right={<div style={{ ...font(17, 600, C.grey) }}>This month</div>} />
            <div style={{ position: "absolute", top: 128, left: 18, right: 18 }}>
              <div style={{ ...card({ padding: 20 }) }}>
                <div style={{ ...font(16, 600, C.grey) }}>Received</div>
                <div style={{ ...font(46, 800), letterSpacing: "-0.04em", marginTop: 4 }}>{euro(received)}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 150, marginTop: 18 }}>
                  {BARS.map((b, i) => {
                    const t = p(f, barsAt + i * 5, 22);
                    const last = i === BARS.length - 1;
                    const extra = last ? 0.18 * p(f, paidAt + 4, 20) : 0;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ width: "100%", height: 120, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                          {last && (
                            <div
                              style={{
                                height: 120 * extra,
                                borderRadius: "8px 8px 0 0",
                                background: C.mint,
                                boxShadow: `0 0 18px rgba(61,220,151,${0.7 * glow})`,
                              }}
                            />
                          )}
                          <div
                            style={{
                              height: 120 * b * t,
                              borderRadius: last && extra > 0.01 ? "0 0 8px 8px" : 8,
                              background: last ? C.violet : "rgba(124,92,255,0.42)",
                            }}
                          />
                        </div>
                        <div style={{ ...font(13, 600, C.grey) }}>{MONTHS[i]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ ...font(15, 700, C.grey), letterSpacing: "0.14em", margin: "24px 0 10px" }}>INVOICES</div>
              {[
                { c: "Acme Studio", n: "#022", a: "€1,250", live: true },
                { c: "Orchard & Co", n: "#020", a: "€980", live: false },
                { c: "Halden Media", n: "#019", a: "€600", live: false },
              ].map((r) => (
                <div
                  key={r.n}
                  style={{
                    ...card({ padding: "14px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }),
                    boxShadow: r.live
                      ? `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1.5px rgba(61,220,151,${0.7 * glow})`
                      : undefined,
                  }}
                >
                  <Avatar text={r.c.split(" ").map((w) => w[0]).join("").slice(0, 2)} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...font(17, 700) }}>{r.c}</div>
                    <div style={{ ...font(14, 500, C.grey), marginTop: 2 }}>
                      {r.n} · {r.a}
                    </div>
                  </div>
                  <StatusPill paid={r.live ? paid : 0} scale={0.9} />
                </div>
              ))}
            </div>
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
};
