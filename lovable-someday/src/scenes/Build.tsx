import { AbsoluteFill } from "remotion";
import { C, GRADIENT } from "../theme";
import { SANS, SERIF } from "../fonts";
import { Glow } from "../ui/Glow";
import { Grain } from "../ui/Grain";

const DAYS = [
  ["Mon", 9],
  ["Tue", 10],
  ["Wed", 11],
  ["Thu", 12],
  ["Fri", 13],
  ["Sat", 14],
  ["Sun", 15],
] as const;
const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30"];
const STYLISTS = [
  { n: "Amal", r: "Colour", g: "linear-gradient(135deg,#FF8F1B,#FD2980)" },
  { n: "Ines", r: "Cuts", g: "linear-gradient(135deg,#FB65C2,#7491FF)" },
  { n: "Sofia", r: "Braids", g: "linear-gradient(135deg,#4F88FF,#B0ACFE)" },
];

const Skeleton: React.FC<{ w: number | string; h: number; r?: number }> = ({ w, h, r = 14 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      background:
        "linear-gradient(100deg, rgba(27,27,27,0.06) 30%, rgba(27,27,27,0.13) 50%, rgba(27,27,27,0.06) 70%)",
    }}
  />
);

const Step: React.FC<{ label: string; done?: boolean }> = ({ label, done }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, height: 46, fontSize: 24, color: done ? C.creme60 : C.creme }}>
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        background: done ? "rgba(247,244,237,0.16)" : GRADIENT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        color: C.creme,
      }}
    >
      {done ? "✓" : ""}
    </div>
    {label}
  </div>
);

export const Build: React.FC<{
  cam?: { rx: number; ry: number; rz: number; s: number; x: number; y: number };
}> = ({ cam = { rx: 9, ry: -19, rz: 2.5, s: 1, x: 0, y: 0 } }) => {
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <Glow x={1160} y={560} w={1700} h={1150} blur={110} from={150} opacity={1} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 62% 54%, rgba(27,27,27,0) 30%, rgba(27,27,27,0.35) 72%, rgba(27,27,27,0.9) 100%)",
        }}
      />
      <AbsoluteFill style={{ perspective: 2000, perspectiveOrigin: "55% 48%" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)`,
            fontFamily: SANS,
          }}
        >
          {/* chat plane, behind and out of focus */}
          <div
            style={{
              position: "absolute",
              left: -150,
              top: 240,
              width: 600,
              transform: "translateZ(-260px)",
              filter: "blur(1.8px)",
              color: C.creme,
            }}
          >
            <div
              style={{
                background: "rgba(247,244,237,0.1)",
                border: "1.5px solid rgba(247,244,237,0.16)",
                borderRadius: 28,
                padding: "26px 30px",
                fontSize: 30,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                marginBottom: 34,
              }}
            >
              A booking app for Mum&rsquo;s salon
            </div>
            <Step label="Booking calendar" done />
            <Step label="Stylist profiles" done />
            <Step label="Confirmation flow" />
          </div>

          {/* app window, the hero */}
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
              boxShadow:
                "0 0 0 1.5px rgba(255,255,255,0.5), 0 70px 140px rgba(0,0,0,0.55), 0 0 120px rgba(253,41,128,0.25)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 24px", borderBottom: `1.5px solid ${C.ink10}` }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: 7, background: "rgba(27,27,27,0.14)" }} />
              ))}
              <div
                style={{
                  margin: "0 auto",
                  width: 420,
                  height: 34,
                  borderRadius: 17,
                  background: "rgba(27,27,27,0.06)",
                  fontSize: 17,
                  color: C.ink60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                salon-amal.lovable.app
              </div>
              <div style={{ width: 59 }} />
            </div>
            <div style={{ padding: "44px 56px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 78, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  Salon Amal
                </div>
                <div style={{ fontSize: 20, color: C.ink60 }}>Open today until 19:00</div>
              </div>
              <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink30, marginTop: 40 }}>
                Pick a day
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
                {DAYS.map(([d, n]) => {
                  const on = d === "Sat";
                  return (
                    <div
                      key={d}
                      style={{
                        flex: 1,
                        height: 112,
                        borderRadius: 22,
                        background: on ? C.ink : "#FFFFFF",
                        color: on ? C.creme : C.ink,
                        border: on ? "none" : `1.5px solid ${C.ink10}`,
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
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
                <div style={{ flex: 1.25 }}>
                  <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink30 }}>
                    Saturday
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                    {SLOTS.map((s, i) =>
                      i > 5 ? (
                        <Skeleton key={s} w="100%" h={66} r={18} />
                      ) : (
                        <div
                          key={s}
                          style={{
                            height: 66,
                            borderRadius: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            fontWeight: 500,
                            fontVariantNumeric: "tabular-nums",
                            background: s === "10:30" ? C.orange : "#FFFFFF",
                            color: s === "10:30" ? "#FFFFFF" : i === 1 ? C.ink30 : C.ink,
                            textDecoration: i === 1 ? "line-through" : "none",
                            border: s === "10:30" ? "none" : `1.5px solid ${C.ink10}`,
                            boxShadow: s === "10:30" ? "0 10px 24px rgba(255,109,27,0.35)" : "none",
                          }}
                        >
                          {s}
                        </div>
                      ),
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 30,
                      height: 84,
                      borderRadius: 42,
                      background: C.ink,
                      color: C.creme,
                      fontSize: 28,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Book Saturday, 10:30
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink30 }}>
                    With
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                    {STYLISTS.map((p, i) => (
                      <div
                        key={p.n}
                        style={{
                          height: 82,
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
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* confirmation card floating in front */}
          <div
            style={{
              position: "absolute",
              left: 1350,
              top: 700,
              width: 470,
              borderRadius: 30,
              background: "#FFFFFF",
              color: C.ink,
              padding: "30px 34px",
              transform: "translateZ(210px)",
              boxShadow: "0 50px 90px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(27,27,27,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: GRADIENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                ✓
              </div>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>You&rsquo;re booked</div>
            </div>
            <div style={{ fontSize: 23, color: C.ink60, marginTop: 16, lineHeight: 1.4 }}>
              Sat 14 · 10:30 · Colour with Amal
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <Grain opacity={0.12} vignette={0.4} />
    </AbsoluteFill>
  );
};
