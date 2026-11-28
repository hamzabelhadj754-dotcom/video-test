import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO_B64, SERIF_B64, SERIF_ITALIC_B64 } from "./fonts.generated";

// ── tokens ───────────────────────────────────────────────────────────────────
const INK = "#EDEBE6";
const BG = "#0B0A09";
const SERIF = "Instrument Serif";
const MONO = "JB Mono";
const GRADE = "saturate(0.62) contrast(1.07) brightness(0.9)"; // one look for five different photos

if (typeof document !== "undefined" && !document.getElementById("hr-fonts")) {
  const st = document.createElement("style");
  st.id = "hr-fonts";
  st.textContent = `
@font-face{font-family:"${SERIF}";src:url(data:font/woff2;base64,${SERIF_B64}) format("woff2");font-style:normal;font-display:block}
@font-face{font-family:"${SERIF}";src:url(data:font/woff2;base64,${SERIF_ITALIC_B64}) format("woff2");font-style:italic;font-display:block}
@font-face{font-family:"${MONO}";src:url(data:font/woff2;base64,${MONO_B64}) format("woff2");font-weight:100 800;font-display:block}`;
  document.head.appendChild(st);
}
const useFonts = () => {
  const [h] = useState(() => delayRender("fonts", { timeoutInMilliseconds: 60000 }));
  useEffect(() => {
    Promise.all([
      document.fonts.load(`400 100px "${SERIF}"`),
      document.fonts.load(`italic 400 100px "${SERIF}"`),
      document.fonts.load(`500 20px "${MONO}"`),
    ])
      .catch(() => undefined)
      .then(() => continueRender(h));
  }, [h]);
};

const E = {
  gate: Easing.bezier(0.72, 0, 0.12, 1), // frame open/close
  reveal: Easing.bezier(0.65, 0, 0.15, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
};
const p = (f: number, a: number, b: number, e: (t: number) => number = (t) => t) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ── timeline (30 fps, 10 s, loops) ───────────────────────────────────────────
// Accelerating hard cuts (frames per photo), then the frame closes into a gallery.
const OPEN: [number, number][] = [
  [1, 5], [3, 5], [2, 4], [5, 4], [1, 3], [3, 3], [2, 3], [5, 3], [1, 2], [3, 2],
]; // 34 frames, then photo 4 holds
const SHRINK = [48, 64];
const GALLERY = [4, 1, 5, 3, 2]; // setup → work → work → stretch → rest
const G0 = 64; // gallery (card) start: photo 4 already showing since frame 34
// Reveal frame of each gallery photo. The flat-lay is the quietest image, so it gets the
// shortest stay; the workout photos get ~1.4s each.
const REVEAL = [34, 84, 127, 170, 213];
const EXPAND = [259, 275];
const CLOSE: [number, number][] = [
  [5, 4], [3, 3], [4, 3], [1, 3], [5, 3], [2, 3], [4, 3], [3, 3],
]; // 25 frames → 300, last photo ≠ first photo so the loop reads as one more cut
export const TOTAL = EXPAND[1] + CLOSE.reduce((s, c) => s + c[1], 0);

export const CUTS = (() => {
  const out: number[] = [];
  let f = 0;
  OPEN.forEach(([, d]) => {
    out.push(f);
    f += d;
  });
  out.push(f); // photo 4
  for (let i = 1; i < GALLERY.length; i++) out.push(REVEAL[i]);
  f = EXPAND[1];
  CLOSE.forEach(([, d]) => {
    out.push(f);
    f += d;
  });
  return out;
})();

const CARD = { w: 828, h: 1104, cx: 540, cy: 900 };
const cardRect = { l: CARD.cx - CARD.w / 2, t: CARD.cy - CARD.h / 2, r: CARD.cx + CARD.w / 2, b: CARD.cy + CARD.h / 2 };

const flick = (seq: [number, number][], start: number, f: number) => {
  let t = start;
  for (let i = 0; i < seq.length; i++) {
    if (f < t + seq[i][1]) return { photo: seq[i][0], k: i, local: f - t };
    t += seq[i][1];
  }
  return null;
};

// ── layers ───────────────────────────────────────────────────────────────────
const FullPhoto: React.FC<{ n: number; seed: number; local: number; extraScale?: number; origin?: string }> = ({
  n,
  seed,
  local,
  extraScale = 1,
  origin = "540px 960px",
}) => {
  // each cut gets its own tiny framing offset: handheld energy without shake
  const s = (1.03 + rnd(seed) * 0.05 + local * 0.004) * extraScale;
  const dx = (rnd(seed + 9) - 0.5) * 24;
  const dy = (rnd(seed + 17) - 0.5) * 24;
  return (
    <Img
      src={staticFile(`photos/${n}_full.jpg`)}
      style={{
        position: "absolute",
        width: 1080,
        height: 1920,
        transform: `translate(${dx}px, ${dy}px) scale(${s})`,
        transformOrigin: origin,
        filter: GRADE,
      }}
    />
  );
};

const CardPhoto: React.FC<{ n: number; age: number; clipTop?: number; lift?: number }> = ({ n, age, clipTop = 0, lift = 0 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      clipPath: `inset(${clipTop * 100}% 0 0 0)`,
    }}
  >
    <Img
      src={staticFile(`photos/${n}_card.jpg`)}
      style={{
        width: CARD.w,
        height: CARD.h,
        transform: `translateY(${lift}%) scale(${1.0 + Math.max(0, age) * 0.0016})`,
        transformOrigin: "50% 55%",
        filter: GRADE,
      }}
    />
  </div>
);

const Gallery: React.FC<{ f: number }> = ({ f }) => {
  // stack: previous photo underneath, current photo revealed bottom→top like a film gate
  const layers: React.ReactNode[] = [];
  GALLERY.forEach((n, i) => {
    const start = REVEAL[i];
    if (f < start - 1) return;
    const nextStart = REVEAL[i + 1] ?? EXPAND[0];
    if (i < GALLERY.length - 1 && f > nextStart + 12) return;
    const e = i === 0 ? 1 : p(f, start, start + 11, E.reveal);
    layers.push(<CardPhoto key={n} n={n} age={f - start} clipTop={1 - e} lift={(1 - e) * 6} />);
    if (i > 0 && e > 0 && e < 1) {
      layers.push(
        <div
          key={`edge${n}`}
          style={{ position: "absolute", left: 0, right: 0, top: `${(1 - e) * 100}%`, height: 2, background: INK, opacity: 0.55 }}
        />,
      );
    }
  });
  return <>{layers}</>;
};

const Caption: React.FC<{ f: number }> = ({ f }) => {
  const inT = p(f, G0 - 4, G0 + 12, E.out);
  const outT = p(f, EXPAND[0] - 10, EXPAND[0], E.gate);
  const a = inT * (1 - outT);
  const row: React.CSSProperties = {
    fontFamily: MONO,
    fontWeight: 500,
    fontSize: 25,
    letterSpacing: "0.32em",
    color: INK,
    textTransform: "uppercase",
  };
  return (
    <>
      <div style={{ position: "absolute", left: cardRect.l, top: cardRect.t - 62, opacity: a * 0.75, transform: `translateY(${(1 - inT) * 10}px)`, ...row }}>
        home series
      </div>
      <div style={{ position: "absolute", right: 1080 - cardRect.r, top: cardRect.t - 62, opacity: a * 0.45, transform: `translateY(${(1 - inT) * 10}px)`, ...row }}>
        vol. 02
      </div>
      {/* frame counter: which photo of five */}
      <div style={{ position: "absolute", left: cardRect.l, top: cardRect.b + 30, display: "flex", gap: 10, opacity: a }}>
        {GALLERY.map((_, i) => {
          const start = i === 0 ? G0 : REVEAL[i];
          const on = f >= start && (i === GALLERY.length - 1 || f < REVEAL[i + 1]);
          return <div key={i} style={{ width: on ? 34 : 10, height: 3, background: INK, opacity: on ? 0.9 : 0.3 }} />;
        })}
      </div>
    </>
  );
};

// Small, quiet, dead centre: one line that sits on every photo.
const Title: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 1920 - CARD.cy * 2 }}>
    <div
      style={{
        position: "absolute",
        width: 620,
        height: 150,
        left: 230,
        top: CARD.cy - 75,
        background: "radial-gradient(ellipse at center, rgba(5,5,5,0.38) 0%, rgba(5,5,5,0) 70%)",
      }}
    />
    <div
      style={{
        position: "relative",
        whiteSpace: "nowrap",
        color: INK,
        fontFamily: SERIF,
        fontSize: 46,
        letterSpacing: "0.01em",
        textShadow: "0 1px 12px rgba(0,0,0,0.55)",
      }}
    >
      we do <span style={{ fontStyle: "italic" }}>home workouts.</span>
    </div>
  </AbsoluteFill>
);

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.42, pointerEvents: "none" }}>
    <Img src={staticFile(`grain${f % 8}.png`)} style={{ width: 1080, height: 1920 }} />
  </AbsoluteFill>
);

export const Reel: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  useFonts();
  const f = useCurrentFrame();

  // gate: 0 = full bleed, 1 = closed to the card
  const gate = f < SHRINK[0] ? 0 : f < EXPAND[0] ? p(f, SHRINK[0], SHRINK[1], E.gate) : 1 - p(f, EXPAND[0], EXPAND[1], E.gate);
  const clip = {
    l: lerp(0, cardRect.l, gate),
    t: lerp(0, cardRect.t, gate),
    r: lerp(0, 1080 - cardRect.r, gate),
    b: lerp(0, 1920 - cardRect.b, gate),
  };
  const radius = lerp(0, 4, gate);

  // Fast cuts use the full-bleed plates; everything from frame 34 to 275 is ONE gallery layer
  // that is simply scaled to fill the screen while the gate is open (seamless, no crossfade).
  const o = flick(OPEN, 0, f);
  const c = flick(CLOSE, EXPAND[1], f);
  const cut = o ?? c;
  const fill = 1.86; // card scale that covers 1080x1920 around the card centre
  const gScale = lerp(fill, 1, gate);
  const inGallery = f >= 34 && f < EXPAND[1];

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill
        style={{
          clipPath: `inset(${clip.t}px ${clip.r}px ${clip.b}px ${clip.l}px round ${radius}px)`,
          overflow: "hidden",
        }}
      >
        {cut && <FullPhoto n={cut.photo} seed={cut.k + (o ? 1 : 60)} local={cut.local} />}
        {inGallery && (
          <div
            style={{
              position: "absolute",
              left: cardRect.l,
              top: cardRect.t,
              width: CARD.w,
              height: CARD.h,
              transform: `scale(${gScale})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Gallery f={f} />
          </div>
        )}
        {/* vignette inside the picture */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 75% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      </AbsoluteFill>
      {/* hairline frame once the gate is closed */}
      <div
        style={{
          position: "absolute",
          left: clip.l,
          top: clip.t,
          right: clip.r,
          bottom: clip.b,
          border: `1px solid rgba(237,235,230,${0.22 * gate})`,
          borderRadius: radius,
        }}
      />
      <Caption f={f} />
      <Title />
      <Grain f={f} />
      {audio && <Audio src={staticFile("sfx.wav")} />}
    </AbsoluteFill>
  );
};
