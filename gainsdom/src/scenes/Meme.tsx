import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Glitch } from "../components/Glitch";
import { C, F, glitchAt, prog, shakes, typed } from "../theme";

const LINES: { text: string; at: number }[] = [
  { text: "Starting Monday.", at: 24 },
  { text: "Starting after this week.", at: 54 },
  { text: "Starting in January.", at: 84 },
];
const ERROR_AT = 134;

/** MOTIVATION.EXE — the loading bar that never finishes. */
export const Meme: React.FC = () => {
  const frame = useCurrentFrame();
  const s = shakes(frame, [ERROR_AT], 14, 26);
  const g = glitchAt(frame, [ERROR_AT - 2, ERROR_AT + 6], 5);
  const error = frame >= ERROR_AT;

  const open = prog(frame, 0, 12);
  const day = Math.round(
    interpolate(frame, [10, 140], [1, 365], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    }),
  );
  const pct = interpolate(frame, [12, 112], [0, 97], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const blocks = 20;
  const filled = Math.floor((pct / 100) * blocks);
  const head = error ? C.accent : C.ink;

  return (
    <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
      {/* Background day counter: time passing while nothing happens */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 170 }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: "0.3em", color: C.dim }}>
          DAYS SINCE &ldquo;I&rsquo;LL START&rdquo;
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 380,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: `3px ${error ? C.accent : "rgba(241,240,236,0.28)"}`,
          }}
        >
          {String(day).padStart(3, "0")}
        </div>
      </AbsoluteFill>

      {/* The window */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 360 }}>
        <Glitch intensity={g} seed={`meme${frame}`}>
          <div
            style={{
              width: 900,
              border: `4px solid ${head}`,
              backgroundColor: C.bg,
              boxShadow: `18px 18px 0 ${error ? C.accent : "rgba(241,240,236,0.14)"}`,
              transform: `scaleY(${open})`,
              transformOrigin: "top",
            }}
          >
            <div
              style={{
                backgroundColor: head,
                color: C.bg,
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 24px",
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: "0.08em",
              }}
            >
              <span>{error ? "FATAL_ERROR.LOG" : "MOTIVATION.EXE"}</span>
              <span>[ _ ][ X ]</span>
            </div>

            <div style={{ padding: "34px 36px 40px" }}>
              {!error ? (
                <>
                  <div style={{ fontFamily: F.mono, fontSize: 32, color: C.ink, letterSpacing: "0.02em" }}>
                    WAITING FOR THE RIGHT MOOD
                    {".".repeat(1 + (Math.floor(frame / 8) % 3))}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 26, alignItems: "center" }}>
                    {Array.from({ length: blocks }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 46,
                          backgroundColor: i < filled ? C.ink : "transparent",
                          border: `2px solid ${i < filled ? C.ink : "rgba(241,240,236,0.25)"}`,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: F.mono,
                      fontSize: 26,
                      color: C.dim,
                    }}
                  >
                    <span>EST. TIME REMAINING: ∞</span>
                    <span style={{ color: C.ink }}>{Math.floor(pct)}%</span>
                  </div>

                  <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 16 }}>
                    {LINES.map((l) => {
                      if (frame < l.at) return null;
                      const struck = prog(frame, l.at + 16, 8);
                      const stampOn = frame >= l.at + 20;
                      return (
                        <div
                          key={l.text}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontFamily: F.body,
                            fontWeight: 700,
                            fontSize: 42,
                            color: struck > 0.5 ? C.mute : C.ink,
                          }}
                        >
                          <span style={{ position: "relative" }}>
                            &gt; {typed(l.text, frame, l.at, 2.4)}
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                top: "54%",
                                height: 5,
                                width: `${struck * 100}%`,
                                backgroundColor: C.ink,
                              }}
                            />
                          </span>
                          {stampOn && (
                            <span
                              style={{
                                fontFamily: F.mono,
                                fontSize: 22,
                                fontWeight: 700,
                                color: C.accent,
                                border: `2px solid ${C.accent}`,
                                padding: "4px 10px",
                                letterSpacing: "0.1em",
                                transform: `scale(${interpolate(prog(frame, l.at + 20, 5), [0, 1], [1.6, 1])})`,
                              }}
                            >
                              POSTPONED
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: F.mono, fontSize: 28, color: C.accent, letterSpacing: "0.12em" }}>
                    ERROR 0x000 — PROCESS NEVER STARTED
                  </div>
                  <div
                    style={{
                      fontFamily: F.display,
                      fontSize: 150,
                      lineHeight: 0.92,
                      color: C.ink,
                      marginTop: 18,
                      textTransform: "uppercase",
                    }}
                  >
                    Motivation
                    <br />
                    not found.
                  </div>
                  <div
                    style={{
                      marginTop: 30,
                      fontFamily: F.mono,
                      fontSize: 32,
                      color: C.dim,
                      textTransform: "uppercase",
                    }}
                  >
                    {typed("// it was never coming.", frame, ERROR_AT + 14, 1.6)}
                  </div>
                </>
              )}
            </div>
          </div>
        </Glitch>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
