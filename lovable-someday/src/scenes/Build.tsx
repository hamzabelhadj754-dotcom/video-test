import { AbsoluteFill } from "remotion";
import { C, EASE, GRADIENT } from "../theme";
import { SANS, SERIF } from "../fonts";
import { Cursor } from "../ui/Cursor";
import { Glow } from "../ui/Glow";
import { CamKey, camAt, camBlur, camCss, lerp, pathAt, press, tw } from "../anim";
import { PG, PROBE } from "../probe";

const DAYS = [["Mon", 9], ["Tue", 10], ["Wed", 11], ["Thu", 12], ["Fri", 13], ["Sat", 14], ["Sun", 15]] as const;
const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30"];
const STYLISTS = [
  { n: "Amal", r: "Colour", g: "linear-gradient(135deg,#FF8F1B,#FD2980)" },
  { n: "Ines", r: "Cuts", g: "linear-gradient(135deg,#FB65C2,#7491FF)" },
  { n: "Sofia", r: "Braids", g: "linear-gradient(135deg,#4F88FF,#B0ACFE)" },
];

export const T = { day: 318, slot: 368, book: 412, card: 416 };
const SNAP = [0.8, 0, 0.1, 1] as const;

const CAM: CamKey[] = [
  { f: 240, cam: { rx: 9, ry: -19, rz: 2.5, s: 1.0, x: -70, y: 0 } },
  { f: 297, cam: { rx: 8, ry: -16, rz: 2.2, s: 1.09, x: -90, y: 0 } },
  { f: 304, cam: { rx: 5, ry: -9, rz: 1, s: 1.9, x: -330, y: 262 }, e: SNAP },
  { f: 342, cam: { rx: 4.5, ry: -8, rz: 1, s: 1.98, x: -350, y: 272 } },
  { f: 349, cam: { rx: 5, ry: -8, rz: 1, s: 2.0, x: 120, y: -150 }, e: SNAP },
  { f: 387, cam: { rx: 4.5, ry: -7, rz: 1, s: 2.08, x: 128, y: -160 } },
  { f: 396, cam: { rx: 7, ry: -13, rz: 1.5, s: 1.0, x: -30, y: 0 }, e: SNAP },
  { f: 436, cam: { rx: 6, ry: -9, rz: 1.2, s: 1.05, x: -50, y: -10 } },
];

const Skel: React.FC<{ f: number; r?: number; o?: number }> = ({ f, r = 16, o = 1 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: r,
      opacity: o,
      backgroundImage:
        "linear-gradient(100deg, rgba(27,27,27,0.07) 35%, rgba(27,27,27,0.16) 50%, rgba(27,27,27,0.07) 65%)",
      backgroundSize: "300% 100%",
      backgroundPosition: `${100 - ((f * 5) % 200)}% 0`,
    }}
  />
);

// Content resolving out of a skeleton block.
const Res: React.FC<{ f: number; at: number; r?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  f,
  at,
  r,
  style,
  children,
}) => {
  const p = tw(f, at, at + 10, 0, 1);
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={{ opacity: p, transform: `translateY(${(1 - p) * 10}px)`, height: "100%" }}>{children}</div>
      {p < 1 ? <Skel f={f} r={r} o={1 - p} /> : null}
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 19, height: 24, lineHeight: "24px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink30, overflow: "hidden" }}>
    {children}
  </div>
);

const Step: React.FC<{ f: number; at: number; done: number; label: string }> = ({ f, at, done, label }) => {
  const p = tw(f, at, at + 10, 0, 1);
  const d = tw(f, done, done + 6, 0, 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, height: 48, fontSize: 25, color: C.creme, opacity: p * lerp(1, 0.55, d), transform: `translateX(${(1 - p) * -14}px)` }}>
      <div style={{ position: "relative", width: 24, height: 24 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: GRADIENT, opacity: 1 - d, transform: `rotate(${f * 9}deg) scale(${0.85 + 0.15 * Math.sin(f / 3)})` }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "rgba(247,244,237,0.2)", opacity: d, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
      </div>
      {label}
    </div>
  );
};

export const Build: React.FC<{ f: number; world?: string }> = ({ f, world }) => {
  const cam = camAt(f, CAM);
  const blur = camBlur(f, CAM) * 0.6;
  const winIn = tw(f, 240, 280, 0, 1, [0.3, 0.6, 0.25, 1]);
  const sheen = (a: number, d: number) => tw(f, a, a + d, 130, -30, [0.45, 0, 0.25, 1]);

  const dayX = tw(f, T.day, T.day + 12, 1, 5, [0.6, 0, 0.1, 1]); // pill slides Tue -> Sat
  const dayLabel = tw(f, T.day + 4, T.day + 14, 0, 1, EASE.inOut);
  const slotOn = tw(f, T.slot, T.slot + 8, 0, 1);
  const btnLabel = tw(f, T.slot + 3, T.slot + 14, 0, 1, EASE.inOut);
  const btnPress = f >= T.book && f < T.book + 4 ? 0.96 : 1;
  const card = tw(f, T.card, T.card + 22, 0, 1, [0.2, 1.35, 0.35, 1]);
  const glowPulse = Math.max(0, Math.exp(-(f - T.card) / 12)) * (f >= T.card ? 1 : 0);

  const cur = pathAt(f, [
    { f: 300, x: 520, y: 470 },
    { f: T.day - 1, x: 846, y: 330 },
    { f: 346, x: 846, y: 330 },
    { f: T.slot - 2, x: 528, y: 492 },
    { f: 392, x: 528, y: 492 },
    { f: T.book - 1, x: 330, y: 672 },
    { f: 424, x: 330, y: 672 },
    { f: 446, x: 470, y: 800 },
  ]);
  const DAYW = 132;
  const DAYG = 14;

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <Glow
        x={lerp(960, 1160, tw(f, 240, 274, 0, 1, EASE.inOut))}
        y={560}
        w={lerp(2700, 1700, tw(f, 240, 274, 0, 1, EASE.inOut)) * (1 + glowPulse * 0.12)}
        h={lerp(1500, 1150, tw(f, 240, 274, 0, 1, EASE.inOut)) * (1 + glowPulse * 0.12)}
        blur={110}
        from={149 + (f - 238) * 0.45}
        opacity={1}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 62% 54%, rgba(27,27,27,0) 30%, rgba(27,27,27,0.35) 72%, rgba(27,27,27,0.9) 100%)",
          opacity: 1 - glowPulse * 0.35,
        }}
      />
      <AbsoluteFill style={{ transform: world, transformOrigin: "0 0" }}>
      <AbsoluteFill style={{ perspective: 2000, perspectiveOrigin: "55% 48%", filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: camCss(cam), fontFamily: SANS }}>
          {/* chat plane */}
          <div style={{ position: "absolute", left: -150, top: 240, width: 600, transform: "translateZ(-260px)", filter: "blur(1.8px)", color: C.creme }}>
            <div
              style={{
                background: "rgba(247,244,237,0.1)",
                border: "1.5px solid rgba(247,244,237,0.16)",
                borderRadius: 28,
                padding: "24px 30px",
                fontSize: 29,
                lineHeight: 1.32,
                letterSpacing: "-0.01em",
                marginBottom: 30,
                opacity: 1,
                ...(PROBE === "bubble" ? { background: PG } : {}),
              }}
            >
              A booking app for Mum&rsquo;s salon.
              <br />
              Make it feel like her.
            </div>
            <Step f={f} at={250} done={286} label="Booking calendar" />
            <Step f={f} at={274} done={322} label="Stylist profiles" />
            <Step f={f} at={349} done={418} label="Confirmation flow" />
          </div>

          {/* app window */}
          <div
            style={{
              position: "absolute",
              left: 600,
              top: 96,
              width: 1120,
              height: 880,
              borderRadius: 30,
              background: C.creme,
              color: C.ink,
              opacity: tw(f, 241, 254, 0, 1, EASE.inOut),
              transform: `translateY(${(1 - winIn) * 150}px) rotateX(${(1 - winIn) * 9}deg) scale(${lerp(0.95, 1, winIn)})`,
              transformOrigin: "50% 100%",
              boxShadow: "0 0 0 1.5px rgba(255,255,255,0.5), 0 70px 140px rgba(0,0,0,0.55), 0 0 120px rgba(253,41,128,0.25)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 58, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 10, padding: "0 24px", borderBottom: `1.5px solid ${C.ink10}` }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: 7, background: "rgba(27,27,27,0.14)" }} />
              ))}
              <div style={{ margin: "0 auto", width: 420, height: 34, borderRadius: 17, background: "rgba(27,27,27,0.06)", fontSize: 17, color: C.ink60, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ opacity: tw(f, 262, 272, 0, 1) }}>salon-amal.lovable.app</span>
              </div>
              <div style={{ width: 59 }} />
            </div>
            <div style={{ padding: "44px 56px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 78 }}>
                <Res f={f} at={250} style={{ height: 78 }}>
                  <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 78, letterSpacing: "-0.03em", lineHeight: "78px", paddingRight: 12 }}>Salon Amal</div>
                </Res>
                <Res f={f} at={256} style={{ height: 28 }}>
                  <div style={{ fontSize: 20, lineHeight: "28px", color: C.ink60 }}>Open today until 19:00</div>
                </Res>
              </div>
              <div style={{ marginTop: 40 }}>
                <Label>Pick a day</Label>
              </div>
              <div style={{ position: "relative", display: "flex", gap: DAYG, marginTop: 16 }}>
                {DAYS.map(([d, n], i) => {
                  return (
                    <Res key={d} f={f} at={258 + i * 3} r={22} style={{ flex: 1, height: 112 }}>
                      <div
                        style={{
                          height: 112,
                          boxSizing: "border-box",
                          borderRadius: 22,
                          background: "#FFFFFF",
                          border: `1.5px solid ${C.ink10}`,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 2,
                          color: C.ink,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <div style={{ fontSize: 18, opacity: 0.6 }}>{d}</div>
                        <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.03em" }}>{n}</div>
                      </div>
                    </Res>
                  );
                })}
                <div
                  style={{
                    position: "absolute",
                    left: dayX * (DAYW + DAYG),
                    top: 0,
                    width: DAYW,
                    height: 112,
                    borderRadius: 22,
                    background: C.ink,
                    overflow: "hidden",
                    opacity: tw(f, 280, 290, 0, 1),
                    transform: `scaleX(${1 + Math.sin(tw(f, T.day, T.day + 12, 0, 1) * Math.PI) * 0.12})`,
                  }}
                >
                  <div style={{ position: "absolute", left: -dayX * (DAYW + DAYG), top: 0, display: "flex", gap: DAYG, color: C.creme }}>
                    {DAYS.map(([d, n]) => (
                      <div key={d} style={{ width: DAYW, height: 112, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <div style={{ fontSize: 18, opacity: 0.6 }}>{d}</div>
                        <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.03em" }}>{n}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
                <div style={{ flex: 1.25 }}>
                  <Label>
                    <div style={{ transform: `translateY(${-dayLabel * 24}px)` }}>
                      <div>Tuesday</div>
                      <div>Saturday</div>
                    </div>
                  </Label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                    {SLOTS.map((s, i) => {
                      const sel = s === "10:30" ? slotOn : 0;
                      const taken = i === 1;
                      return (
                        <Res key={s} f={f} at={349 + i * 2} r={18} style={{ height: 66 }}>
                          <div
                            style={{
                              height: 66,
                              boxSizing: "border-box",
                              borderRadius: 18,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 24,
                              fontWeight: 500,
                              fontVariantNumeric: "tabular-nums",
                              background: sel > 0.5 ? C.orange : "#FFFFFF",
                              color: sel > 0.5 ? "#FFFFFF" : taken ? C.ink30 : C.ink,
                              textDecoration: taken ? "line-through" : "none",
                              border: sel > 0.5 ? "none" : `1.5px solid ${C.ink10}`,
                              boxShadow: `0 10px 24px rgba(255,109,27,${0.38 * sel})`,
                              transform: `scale(${1 + Math.sin(sel * Math.PI) * 0.09})`,
                            }}
                          >
                            {s}
                          </div>
                        </Res>
                      );
                    })}
                  </div>
                  <Res f={f} at={288} r={42} style={{ marginTop: 30, height: 84 }}>
                    <div
                      style={{
                        height: 84,
                        borderRadius: 42,
                        background: C.ink,
                        color: C.creme,
                        fontSize: 28,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        overflow: "hidden",
                        transform: `scale(${btnPress})`,
                      }}
                    >
                      <div style={{ transform: `translateY(${-btnLabel * 84}px)`, textAlign: "center", lineHeight: "84px" }}>
                        <div style={{ opacity: 0.45 }}>Pick a time</div>
                        <div>Book Saturday, 10:30</div>
                      </div>
                    </div>
                  </Res>
                </div>
                <div style={{ flex: 1 }}>
                  <Label>With</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                    {STYLISTS.map((p, i) => (
                      <Res key={p.n} f={f} at={272 + i * 6} r={22} style={{ height: 82 }}>
                        <div
                          style={{
                            height: 82,
                            boxSizing: "border-box",
                            borderRadius: 22,
                            background: "#FFFFFF",
                            border: i === 0 ? `2.5px solid ${C.ink}` : `1.5px solid ${C.ink10}`,
                            display: "flex",
                            alignItems: "center",
                            gap: 18,
                            padding: "0 18px",
                          }}
                        >
                          <div style={{ width: 50, height: 50, borderRadius: 25, background: p.g }} />
                          <div>
                            <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em" }}>{p.n}</div>
                            <div style={{ fontSize: 18, color: C.ink60 }}>{p.r}</div>
                          </div>
                        </div>
                      </Res>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                mixBlendMode: "soft-light",
                backgroundImage: "linear-gradient(112deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 60%)",
                backgroundSize: "250% 100%",
                backgroundPosition: `${f < 300 ? sheen(250, 30) : sheen(400, 26)}% 0`,
                zIndex: 4,
              }}
            />
            <Cursor x={cur.x} y={cur.y} size={0.8} scale={press(f, [T.day, T.slot, T.book])} opacity={tw(f, 300, 306, 0, 1) * tw(f, 436, 444, 1, 0)} />
          </div>

          {/* confirmation card */}
          <div
            style={{
              position: "absolute",
              left: 1350,
              top: 700,
              width: 470,
              boxSizing: "border-box",
              borderRadius: 30,
              background: "#FFFFFF",
              color: C.ink,
              padding: "30px 34px",
              opacity: tw(f, T.card, T.card + 6, 0, 1),
              transform: `translateZ(${lerp(-60, 210, card)}px) scale(${lerp(0.8, 1, card)})`,
              boxShadow: "0 50px 90px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(27,27,27,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: PROBE === "card" ? PG : GRADIENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transform: `scale(${tw(f, T.card + 6, T.card + 20, 0, 1, [0.2, 1.6, 0.35, 1])})` }}>
                ✓
              </div>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>You&rsquo;re booked</div>
            </div>
            <div style={{ fontSize: 23, color: C.ink60, marginTop: 16, lineHeight: 1.4 }}>Sat 14 · 10:30 · Colour with Amal</div>
          </div>
        </div>
      </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
