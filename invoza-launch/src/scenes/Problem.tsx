import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, DocIcon, EV, Eyebrow, RevealLine, SC, card, floatCard, font, lerp, p, sceneMotion } from "../lib";
import { Phone, StatusBar } from "../Phone";
import T from "../timeline.json";

/* =====================  SCENE 1 — HOOK  ===================== */

const NOTIFS = [
  { id: "#014", d: "23 days overdue", amt: "€1,250" },
  { id: "#017", d: "9 days overdue", amt: "€840" },
  { id: "#021", d: "5 days overdue", amt: "€2,100" },
];

const OverdueNotif: React.FC<{ n: (typeof NOTIFS)[number]; t: number }> = ({ n, t }) => (
  <div
    style={{
      ...card({ borderRadius: 24 }),
      background: "rgba(34,34,38,0.94)",
      height: 96,
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 18px",
      opacity: t,
      transform: `translateY(${(1 - t) * -26}px) scale(${lerp(0.92, 1, t)})`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1.5px rgba(255,90,95,${0.45 * t}), 0 0 34px rgba(255,90,95,${0.28 * t})`,
    }}
  >
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: 14,
        background: C.coral,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 20px rgba(255,90,95,0.55)",
      }}
    >
      <DocIcon size={26} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ ...font(21, 700) }}>Invoice {n.id}</div>
        <div style={{ ...font(15, 500, C.grey) }}>now</div>
      </div>
      <div style={{ ...font(19, 500, C.grey), marginTop: 5 }}>
        {n.d} · {n.amt}
      </div>
    </div>
  </div>
);

export const CornerClock: React.FC<{ time: string; ampm: string; opacity: number; sub: string }> = ({
  time,
  ampm,
  opacity,
  sub,
}) => (
  <div style={{ position: "absolute", left: 86, top: 70, opacity }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <div style={{ ...font(72, 300), letterSpacing: "-0.02em", textShadow: "0 0 30px rgba(255,255,255,0.25)" }}>{time}</div>
      <div style={{ ...font(30, 500, C.grey) }}>{ampm}</div>
    </div>
    <div style={{ ...font(22, 600, C.grey), letterSpacing: "0.18em", marginTop: 8 }}>{sub}</div>
  </div>
);

export const S1Hook: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const notifAt = EV.notifs.map((g) => g - SC.hook[0]);
  const wake = p(f, EV.wake, 14);
  const push = interpolate(f, [0, dur + 12], [1, 1.34], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.3, 0, 0.3, 1),
  });
  const out = p(f, dur, 9);
  let shake = 0;
  for (const t of notifAt) {
    const d = f - t;
    if (d >= 0 && d < 14) shake += Math.sin(d * 2.7) * 6 * (1 - d / 14);
  }
  const shown = notifAt.filter((t) => f >= t).length;
  const glow = notifAt.reduce((a, t) => a + p(f, t, 10), 0);

  return (
    <AbsoluteFill style={{ opacity: 1 - out, background: "#060607" }}>
      {/* desk with soft overhead lamp */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 52% 50%, #2B2B2E 0%, #1a1a1c 38%, #0d0d0e 70%, #070707 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(176deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 9px)",
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${push * (1 + out * 0.15)})`, transformOrigin: "50% 46%" }}>
        {/* coral bounce light on the desk */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 30% 36% at 50% 48%, rgba(255,90,95,${0.07 * glow}) 0%, rgba(255,90,95,0) 100%)`,
          }}
        />
        <div style={{ position: "absolute", left: 960 - 250, top: 20, perspective: 1900 }}>
          <div
            style={{
              transform: `rotateX(34deg) rotateZ(-9deg) translateX(${shake}px)`,
              transformOrigin: "50% 50%",
            }}
          >
            <Phone width={500} glare={lerp(10, 60, f / dur)} shadow="0 50px 60px rgba(0,0,0,0.85), 0 10px 20px rgba(0,0,0,0.7)">
              <AbsoluteFill
                style={{
                  background: "radial-gradient(ellipse 120% 70% at 50% 0%, #2a2a30 0%, #141416 55%, #0b0b0c 100%)",
                }}
              />
              <StatusBar time="11:47" hideTime />
              <div style={{ position: "absolute", top: 104, width: "100%", textAlign: "center" }}>
                <div style={{ ...font(20, 600, C.grey) }}>Tuesday 18 November</div>
                <div style={{ ...font(104, 600), letterSpacing: "-0.03em", marginTop: 4 }}>11:47</div>
              </div>
              <div style={{ position: "absolute", top: 318, left: 12, right: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                {NOTIFS.slice(0, shown).map((n, i) => (
                  <OverdueNotif key={n.id} n={n} t={p(f, notifAt[i], 12)} />
                ))}
              </div>
              {/* screen off → wake */}
              <AbsoluteFill style={{ background: "#000", opacity: 1 - wake }} />
            </Phone>
          </div>
        </div>
      </AbsoluteFill>
      <CornerClock time="11:47" ampm="PM" sub="STILL WAITING" opacity={p(f, 0, 14)} />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 75% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)" }}
      />
    </AbsoluteFill>
  );
};

/* =====================  SCENE 2 — PAIN  ===================== */

const typedText = (g: number) => {
  // g = global seconds
  let txt = "";
  let active = false;
  let deleting = false;
  for (const s of T.typing) {
    const chars = Array.from(s.text);
    if (g < s.t0) break;
    const k = Math.min(1, (g - s.t0) / (s.t1 - s.t0));
    if (s.kind === "type") {
      txt = chars.slice(0, Math.floor(k * chars.length)).join("");
    } else {
      txt = chars.slice(0, Math.ceil((1 - k) * chars.length)).join("");
    }
    active = k < 1;
    deleting = s.kind === "delete" && k < 1;
  }
  return { txt, active, deleting };
};

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const Keyboard: React.FC<{ lastChar: string; deleting: boolean; pulse: boolean }> = ({ lastChar, deleting, pulse }) => {
  const key = (ch: string, w = 33) => {
    const lit = pulse && ch === lastChar.toLowerCase();
    return (
      <div
        key={ch}
        style={{
          width: w,
          height: 46,
          borderRadius: 7,
          background: lit ? "#6a6a72" : "#3a3a3f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...font(20, 500),
          boxShadow: "0 1px 0 rgba(0,0,0,0.5)",
        }}
      >
        {ch.length === 1 ? ch : ""}
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 300, background: "#1d1d20", padding: "14px 4px 0" }}>
      {KEY_ROWS.map((r, i) => (
        <div key={r} style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
          {i === 2 && <div style={{ width: 46, height: 46, borderRadius: 7, background: "#2a2a2e" }} />}
          {Array.from(r).map((ch) => key(ch))}
          {i === 2 && (
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 7,
                background: deleting && pulse ? "#6a6a72" : "#2a2a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="18" viewBox="0 0 24 18">
                <path d="M8 2h13v14H8L2 9z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 6l6 6M18 6l-6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        <div style={{ width: 86, height: 46, borderRadius: 7, background: "#2a2a2e" }} />
        <div style={{ width: 196, height: 46, borderRadius: 7, background: lastChar === " " && pulse ? "#6a6a72" : "#3a3a3f" }} />
        <div style={{ width: 86, height: 46, borderRadius: 7, background: "#2a2a2e" }} />
      </div>
    </div>
  );
};

const SHEET_ROWS = [
  ["Acme Studio", "#014", "€1,250", "23 days"],
  ["Bluefin Labs", "#017", "€840", "9 days"],
  ["Orchard & Co", "#021", "€2,100", "5 days"],
  ["Halden Media", "#011", "€600", "?"],
];

const Spreadsheet: React.FC<{ f: number; start: number }> = ({ f, start }) => {
  const t = p(f, start, 22);
  const cols = [270, 130, 160, 240];
  return (
    <div
      style={{
        ...floatCard({ width: 840, padding: "26px 0 18px" }),
        opacity: t,
        transform: `translateY(${(1 - t) * 60}px) rotateX(${lerp(14, 8, t)}deg) rotateY(9deg) rotateZ(-1.5deg)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 30px 18px" }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${C.grey}` }} />
        <div style={{ ...font(24, 600, C.grey) }}>invoices_FINAL_v7 (2).xlsx</div>
      </div>
      <div style={{ display: "flex", padding: "12px 30px", borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        {["Client", "Invoice", "Amount", "Status"].map((h, i) => (
          <div key={h} style={{ width: cols[i], ...font(20, 700, C.grey), letterSpacing: "0.08em" }}>
            {h.toUpperCase()}
          </div>
        ))}
      </div>
      {SHEET_ROWS.map((r, ri) => {
        const rt = p(f, start + 8 + ri * 6, 14);
        return (
          <div
            key={r[1]}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 30px",
              borderBottom: ri < 3 ? `1px solid ${C.line}` : undefined,
              opacity: rt,
            }}
          >
            <div style={{ width: cols[0], ...font(26, 600) }}>{r[0]}</div>
            <div style={{ width: cols[1], ...font(24, 500, C.grey) }}>{r[1]}</div>
            <div style={{ width: cols[2], ...font(26, 600) }}>{r[2]}</div>
            <div style={{ width: cols[3] }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: ri < 3 ? "rgba(255,90,95,0.2)" : "rgba(255,255,255,0.07)",
                  boxShadow: ri < 3 ? "inset 0 0 0 1.5px rgba(255,90,95,0.7)" : "inset 0 0 0 1.5px rgba(255,255,255,0.15)",
                  ...font(20, 600),
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 4, background: ri < 3 ? C.coral : C.grey }} />
                {ri < 3 ? `Overdue ${r[3]}` : "Unknown"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const S2Pain: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  if (f >= dur) return null; // hard cut to black
  const g = (SC.pain[0] + f) / 30;
  const { txt, active, deleting } = typedText(g);
  const cursorOn = active || Math.floor(f / 9) % 2 === 0;
  const lastChar = deleting ? "" : txt.slice(-1);
  const pulse = active && f % 2 === 0;
  const enter = sceneMotion(f, dur, { from: "scale", to: "none" });
  const drift = f / dur;

  return (
    <AbsoluteFill style={{ ...enter }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 45% 55% at 72% 50%, rgba(255,90,95,0.14) 0%, rgba(255,90,95,0) 70%)",
        }}
      />
      {/* left column */}
      <div style={{ position: "absolute", left: 120, top: 130, width: 1100 }}>
        <Eyebrow f={f} start={8} text="11:52 PM · STILL NO REPLY" dot={C.coral} />
        <RevealLine f={f} start={16} style={font(88, 800)}>
          Awkward follow-ups.
        </RevealLine>
        <RevealLine f={f} start={56} style={{ ...font(88, 800), marginTop: 8 }}>
          Endless spreadsheets.
        </RevealLine>
      </div>
      <div style={{ position: "absolute", left: 110, top: 480, perspective: 1600 }}>
        <Spreadsheet f={f} start={62} />
      </div>
      {/* phone */}
      <div style={{ position: "absolute", left: 1220, top: 52 + Math.sin(f / 22) * 6, perspective: 2000 }}>
        <div style={{ transform: `rotateY(${lerp(-20, -13, drift)}deg) rotateX(5deg) rotateZ(1.5deg)` }}>
          <Phone width={470} glare={lerp(20, 70, drift)}>
            <StatusBar time="11:52" />
            <div style={{ position: "absolute", top: 66, left: 22, right: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ ...font(19, 500, C.grey) }}>Cancel</div>
              <div style={{ ...font(20, 700) }}>New message</div>
              <div style={{ width: 34, height: 34, borderRadius: 17, background: "#3a3a3f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke={C.grey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div style={{ position: "absolute", top: 124, left: 22, right: 22 }}>
              {[
                ["To:", "Acme Studio"],
                ["Subject:", "Invoice #014"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ ...font(19, 500, C.grey) }}>{k}</div>
                  <div style={{ ...font(19, 600), padding: k === "To:" ? "4px 12px" : 0, borderRadius: 999, background: k === "To:" ? "#2c2c31" : undefined }}>{v}</div>
                </div>
              ))}
              <div style={{ ...font(29, 600), lineHeight: 1.38, marginTop: 22, minHeight: 120 }}>
                {txt}
                <span
                  style={{
                    display: "inline-block",
                    width: 2.5,
                    height: 30,
                    marginLeft: 2,
                    verticalAlign: "-5px",
                    background: "#fff",
                    opacity: cursorOn ? 1 : 0,
                  }}
                />
              </div>
            </div>
            <Keyboard lastChar={lastChar} deleting={deleting} pulse={pulse} />
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =====================  SCENE 3 — TURN  ===================== */
export { S3Turn } from "./Turn";
