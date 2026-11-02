import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import {
  CALLOUTS,
  CAPTIONS,
  CUTS,
  DARK,
  DURATION_S,
  END_CARD,
  FPS,
  HOOK_END,
  PINK,
  SOURCE,
  STEPS,
  STEPS_IN,
  STEPS_OUT,
  YELLOW,
  ZOOMS,
} from "./data";
import { CheckBadge, Icon } from "./Icons";

const AR = "ReelArabic, 'Noto Sans Arabic', 'Noto Sans Arabic Blk'";
const LATIN = "Inter, 'Inter Display', sans-serif";

// Declared via CSS (not loadFont): loadFont's delayRender hangs under parallel rendering here.
// The same TTFs installed system-wide act as a fallback.
const FONT_CSS = `
@font-face { font-family: "ReelArabic"; font-weight: 900; src: url("${staticFile("arabic-black.ttf")}") format("truetype"); }
@font-face { font-family: "ReelArabic"; font-weight: 700; src: url("${staticFile("arabic-bold.ttf")}") format("truetype"); }
`;

const useT = () => useCurrentFrame() / FPS;
const f = (s: number) => Math.round(s * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const STROKE: React.CSSProperties = {
  WebkitTextStroke: "12px rgba(8,4,12,0.92)",
  paintOrder: "stroke fill",
  textShadow: "0 6px 18px rgba(0,0,0,0.55)",
};

// ------------------------------------------------------------------ video + camera
const zoomAt = (t: number) => {
  let i = 0;
  while (i + 1 < ZOOMS.length && ZOOMS[i + 1].at <= t) i++;
  const z = ZOOMS[i];
  const nextAt = ZOOMS[i + 1]?.at ?? DURATION_S;
  const p = interpolate(t, [z.at, nextAt], [0, 1], clamp);
  return { scale: z.from + (z.to - z.from) * p, ox: z.ox ?? 50, oy: z.oy ?? 38, idx: i };
};

const isHardCut = (s: number) => CUTS.some((c) => Math.abs(c - s) < 0.05) || s === 0;

const VideoLayer: React.FC = () => {
  const t = useT();
  const cur = zoomAt(t);
  let { scale } = cur;
  // Ease (≈5 frames) into punch-ins that are not on a hard cut, so they feel deliberate.
  const z = ZOOMS[cur.idx];
  if (!isHardCut(z.at) && cur.idx > 0) {
    const prev = zoomAt(z.at - 0.001).scale;
    scale = interpolate(t, [z.at, z.at + 5 / FPS], [prev, scale], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
  }
  // Kick on every hard cut.
  for (const c of CUTS) {
    const d = t - c;
    if (d >= 0 && d < 0.4) scale += interpolate(d, [0, 0.4], [0.06, 0], { easing: Easing.out(Easing.quad) });
  }
  const endDim = interpolate(t, [END_CARD, END_CARD + 0.5], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: `${cur.ox}% ${cur.oy}%`,
          filter: `contrast(1.08) saturate(1.14) brightness(${1.02 - endDim * 0.25})`,
        }}
      >
        <Video src={staticFile(SOURCE)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {/* bottom gradient for caption legibility */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 52%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0.15) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const CutFlash: React.FC = () => {
  const t = useT();
  let o = 0;
  for (const c of CUTS) {
    const d = t - c;
    if (d >= 0 && d < 0.2) o = Math.max(o, interpolate(d, [0, 0.2], [0.35, 0]));
  }
  return <AbsoluteFill style={{ background: "#fff", opacity: o, mixBlendMode: "screen" }} />;
};

// ------------------------------------------------------------------ captions
const CAPTION_Y = 1130;

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { fps } = useVideoConfig();
  const g = CAPTIONS.find((c) => t >= c.words[0][1] && t < c.end);
  if (!g) return null;
  const start = g.words[0][1];
  const pop = spring({ frame: frame - f(start), fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  const out = interpolate(t, [g.end - 0.08, g.end], [1, 0], clamp);

  return (
    <div
      style={{
        position: "absolute",
        top: CAPTION_Y,
        left: 70,
        right: 70,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        direction: "rtl",
        gap: "4px 18px",
        transform: `translateY(${(1 - pop) * 40}px) scale(${0.85 + pop * 0.15})`,
        opacity: Math.min(pop * 1.5, 1) * out,
      }}
    >
      {g.words.map(([raw, ws], i) => {
        const we = g.words[i + 1]?.[1] ?? g.end;
        const active = t >= ws && t < we;
        const kw = raw.includes("*");
        const text = raw.replace("*", "");
        const wPop = spring({ frame: frame - f(ws), fps, config: { damping: 12, stiffness: 300, mass: 0.5 } });
        const spoken = t >= ws;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              fontFamily: AR,
              fontWeight: 900,
              fontSize: 84,
              lineHeight: 1.45,
              padding: "0 14px",
              color: active ? "#fff" : kw ? YELLOW : "#fff",
              opacity: spoken ? 1 : 0.8,
              transform: `scale(${active ? 1 + 0.1 * wPop : 1})`,
              display: "inline-block",
            }}
          >
            {active && (
              <span
                style={{
                  position: "absolute",
                  inset: "14px 0 10px 0",
                  background: PINK,
                  borderRadius: 18,
                  boxShadow: `0 8px 28px ${PINK}88`,
                  transform: `scale(${0.7 + 0.3 * wPop}) rotate(-2deg)`,
                  zIndex: -1,
                }}
              />
            )}
            <span style={active ? { textShadow: "0 3px 10px rgba(0,0,0,0.35)" } : STROKE}>{text}</span>
          </span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ step tracker (top)
const StepTracker: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { fps } = useVideoConfig();
  if (t < STEPS_IN - 0.1 || t > STEPS_OUT + 0.6) return null;
  const inP = spring({ frame: frame - f(STEPS_IN), fps, config: { damping: 16, stiffness: 160 } });
  const outP = interpolate(t, [STEPS_OUT, STEPS_OUT + 0.4], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const activeIdx = STEPS.reduce((acc, s, i) => (t >= s.at ? i : acc), -1);

  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${(1 - inP) * -260 - outP * 260}px)`,
        opacity: 1 - outP,
      }}
    >
      <div
        style={{
          direction: "rtl",
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
          padding: "22px 30px 16px",
          borderRadius: 40,
          background: "rgba(14,8,20,0.62)",
          border: "2px solid rgba(255,255,255,0.12)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          backdropFilter: "blur(14px)",
        }}
      >
        {STEPS.map((s, i) => {
          const isActive = i === activeIdx;
          const done = i < activeIdx;
          const p = spring({ frame: frame - f(s.at), fps, config: { damping: 11, stiffness: 240, mass: 0.6 } });
          const lit = t >= s.at ? p : 0;
          const size = 92;
          const lineFill = i < STEPS.length - 1 ? interpolate(t, [STEPS[i + 1].at - 0.35, STEPS[i + 1].at], [0, 1], clamp) : 0;
          return (
            <React.Fragment key={s.label}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 132 }}>
                <div
                  style={{
                    position: "relative",
                    width: size,
                    height: size,
                    borderRadius: size,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive ? PINK : done ? "#fff" : "rgba(255,255,255,0.1)",
                    border: `3px solid ${isActive ? "#fff" : done ? "#fff" : "rgba(255,255,255,0.25)"}`,
                    boxShadow: isActive ? `0 0 ${30 * lit}px ${PINK}` : "none",
                    transform: `scale(${isActive ? 1 + 0.16 * lit : 1})`,
                  }}
                >
                  <Icon name={s.icon} size={50} color={isActive ? "#fff" : done ? PINK : "rgba(255,255,255,0.55)"} />
                  {done && (
                    <div style={{ position: "absolute", top: -8, right: -8 }}>
                      <CheckBadge size={34} />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: AR,
                    fontWeight: 700,
                    fontSize: 30,
                    color: isActive ? "#fff" : done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    marginTop: size / 2 - 3,
                    width: 26,
                    height: 6,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.18)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ width: `${lineFill * 100}%`, height: "100%", background: PINK, marginLeft: "auto" }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ hook (first 2.3s, no speech)
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const out = interpolate(t, [HOOK_END - 0.25, HOOK_END], [1, 0], clamp);
  const lines = [
    { text: "من الستوك", color: "#fff", at: 0.1 },
    { text: "حتى لباب الكليان", color: YELLOW, at: 0.45 },
  ];
  const tag = spring({ frame: frame - 2, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 1040, opacity: out }}>
      <div
        style={{
          fontFamily: LATIN,
          fontWeight: 800,
          fontSize: 38,
          letterSpacing: 1,
          color: "#fff",
          background: PINK,
          padding: "10px 28px",
          borderRadius: 999,
          transform: `scale(${tag})`,
          boxShadow: `0 10px 30px ${PINK}77`,
          marginBottom: 18,
        }}
      >
        YouCan Fulfillment
      </div>
      {lines.map((l) => {
        const p = spring({ frame: frame - f(l.at), fps, config: { damping: 10, stiffness: 200, mass: 0.7 } });
        return (
          <div
            key={l.text}
            style={{
              fontFamily: AR,
              fontWeight: 900,
              fontSize: 116,
              lineHeight: 1.35,
              color: l.color,
              direction: "rtl",
              transform: `scale(${interpolate(p, [0, 1], [1.6, 1])})`,
              opacity: Math.min(1, p * 2),
              ...STROKE,
              WebkitTextStroke: "16px rgba(8,4,12,0.95)",
            }}
          >
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ callouts on speech-free b-roll
const Callout: React.FC<{ text: string; sub: string; dur: number }> = ({ text, sub, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 12, stiffness: 200, mass: 0.7 } });
  const out = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", top: CAPTION_Y - 10, opacity: out }}>
      <div
        style={{
          direction: "rtl",
          fontFamily: AR,
          fontWeight: 900,
          fontSize: 92,
          color: "#fff",
          background: PINK,
          padding: "6px 46px 14px",
          borderRadius: 28,
          transform: `scale(${p}) rotate(${(1 - p) * -6 - 1.5}deg)`,
          boxShadow: `0 16px 44px ${PINK}88`,
        }}
      >
        {text}
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: `${AR}, ${LATIN}`,
          fontWeight: 900,
          fontSize: 50,
          color: YELLOW,
          direction: "rtl",
          opacity: interpolate(frame, [6, 14], [0, 1], clamp),
          transform: `translateY(${interpolate(frame, [6, 14], [20, 0], clamp)}px)`,
          ...STROKE,
          WebkitTextStroke: "10px rgba(8,4,12,0.92)",
        }}
      >
        {sub}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ end card
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 13, stiffness: 180, mass: 0.7 } });
  const words = ["خزّن", "أكّد", "غلّف", "وصّل"];
  const bg = interpolate(frame, [0, 12], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 980 }}>
      <AbsoluteFill
        style={{
          opacity: bg,
          background: "linear-gradient(to bottom, rgba(5,2,8,0) 38%, rgba(5,2,8,0.82) 52%, rgba(5,2,8,0.9) 100%)",
        }}
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, transform: `scale(${s(0)})` }}>
        <span style={{ fontFamily: LATIN, fontWeight: 900, fontSize: 90, color: "#fff", letterSpacing: -2, textShadow: "0 6px 24px rgba(0,0,0,0.6)" }}>
          YouCan
        </span>
        <span style={{ fontFamily: LATIN, fontWeight: 900, fontSize: 90, color: PINK, letterSpacing: -2, textShadow: "0 0 2px #fff, 0 6px 24px rgba(0,0,0,0.6)" }}>
          Fulfillment
        </span>
      </div>
      <div
        style={{
          width: interpolate(s(6), [0, 1], [0, 760]),
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${YELLOW}, ${PINK})`,
          margin: "20px 0 34px",
        }}
      />
      <div style={{ direction: "rtl", display: "flex", gap: 22 }}>
        {words.map((w, i) => {
          const p = s(10 + i * 5);
          return (
            <span
              key={w}
              style={{
                fontFamily: AR,
                fontWeight: 900,
                fontSize: 64,
                color: i % 2 ? YELLOW : "#fff",
                opacity: Math.min(1, p * 2),
                transform: `translateY(${(1 - p) * 40}px)`,
              }}
            >
              {w}
              {i < words.length - 1 && <span style={{ color: PINK, marginInlineStart: 22 }}>•</span>}
            </span>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 56,
          direction: "rtl",
          fontFamily: AR,
          fontWeight: 900,
          fontSize: 52,
          color: DARK,
          background: "#fff",
          padding: "12px 48px 20px",
          borderRadius: 999,
          transform: `scale(${s(34) * (1 + 0.04 * Math.sin((frame - 34) / 6))})`,
          boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
        }}
      >
        تابعنا باش يوصلك الجديد
      </div>
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: 8,
        width: `${(frame / durationInFrames) * 100}%`,
        background: `linear-gradient(90deg, ${YELLOW}, ${PINK})`,
      }}
    />
  );
};

// ------------------------------------------------------------------ sfx
const Sfx: React.FC<{ at: number; src: string; volume: number }> = ({ at, src, volume }) => (
  <Sequence from={Math.max(0, f(at))} durationInFrames={f(1.6)} layout="none">
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

export const FulfillmentReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style>{FONT_CSS}</style>
      <VideoLayer />
      <CutFlash />
      <Captions />
      <StepTracker />
      <Sequence durationInFrames={f(HOOK_END)} layout="none">
        <Hook />
      </Sequence>
      {CALLOUTS.map((c) => (
        <Sequence key={c.text} from={f(c.from)} durationInFrames={f(c.to - c.from)} layout="none">
          <Callout text={c.text} sub={c.sub} dur={f(c.to - c.from)} />
        </Sequence>
      ))}
      <Sequence from={f(END_CARD)} layout="none">
        <EndCard />
      </Sequence>
      <ProgressBar />

      <Sfx at={0} src="sfx-whip.wav" volume={0.45} />
      {CUTS.map((c) => (
        <Sfx key={c} at={c - 0.08} src="sfx-whoosh.wav" volume={0.5} />
      ))}
      {STEPS.map((s) => (
        <Sfx key={s.label} at={s.at} src="sfx-mouse-click.wav" volume={0.35} />
      ))}
      {CALLOUTS.map((c) => (
        <Sfx key={c.text} at={c.from} src="sfx-switch.wav" volume={0.4} />
      ))}
      <Sfx at={END_CARD} src="sfx-ding.wav" volume={0.35} />
    </AbsoluteFill>
  );
};
