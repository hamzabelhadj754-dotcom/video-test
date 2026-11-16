import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, H, W, chamfer } from "./theme";
import "./fonts";
import { disp, ff } from "./fonts";
import { INOUT, OUT, lerp, tw, Bz } from "./anim";
import { Obj, ObjectsScene, projectStudio } from "./three/Objects";
import { Card, Chip, Line } from "./ui/Bits";
import { Grain } from "./ui/Grain";

const SPRING: Bz = [0.22, 1.25, 0.36, 1];
export const DUR = 600;

// rep schedule for the light set: fast and easy, then slow and hard
export const REPS = Array.from({ length: 25 }, (_, k) => {
  const i = k + 1;
  return i <= 22 ? 178 + (i - 1) * 3.9 : 264 + (i - 23) * 10;
});
const repsDone = (f: number) => REPS.filter((r) => f >= r).length;
// curl lift 0..1 for the current rep
const curl = (f: number) => {
  for (let i = REPS.length - 1; i >= 0; i--) {
    if (f >= REPS[i]) {
      const d = (REPS[i + 1] ?? REPS[i] + 10) - REPS[i];
      const t = Math.min(1, (f - REPS[i]) / d);
      return Math.sin(t * Math.PI);
    }
  }
  return 0;
};

const objectsAt = (f: number): Obj[] => {
  const out: Obj[] = [];
  const bob = (k: number) => Math.sin(f / 17 + k) * 0.05;
  if (f < 112) {
    // hook: both swing in; then the light one is pushed to centre and leaves
    const inL = tw(f, -8, 22, 0, 1, SPRING);
    const inH = tw(f, -5, 25, 0, 1, SPRING);
    const toCentre = tw(f, 70, 92, 0, 1, INOUT);
    const leave = tw(f, 92, 110, 0, 1, [0.6, 0, 0.9, 0.5]);
    out.push({
      kind: "light",
      pos: [lerp(lerp(-3.2, -0.62, inL), 0, toCentre) + leave * 2.6, -0.95 + bob(0) + toCentre * 0.7 - leave * 1.2, toCentre * 2.2],
      rot: [0.35 + f * 0.004, lerp(2.6, 0.5, inL) + f * 0.006 + toCentre * 0.9, 0.25],
      shadowY: -1.75,
      opacity: 1,
    });
    const hOut = tw(f, 68, 90, 0, 1, INOUT);
    out.push({
      kind: "heavy",
      pos: [lerp(3.4, 0.52, inH) + hOut * 2.2, -0.05 + bob(1.3), -hOut * 2],
      rot: [0.3, lerp(-2.4, -0.6, inH) - f * 0.005, -0.2],
      scale: 0.66,
      shadowY: -1.75,
      opacity: 1 - tw(f, 82, 92, 0, 1),
    });
  } else if (f >= 150 && f < 306) {
    // light set: the dumbbell curls along with the counter
    const enter = tw(f, 152, 176, 0, 1, SPRING);
    const ex = tw(f, 292, 306, 0, 1, INOUT);
    const c = curl(f);
    out.push({
      kind: "light",
      pos: [lerp(2.6, 0.62, enter), 1.05 + c * 0.28 + bob(2) * 0.5, 0],
      rot: [0.25 + c * 0.35, 0.55 + f * 0.004, 0.22 - c * 0.15],
      scale: 0.72 * (1 - ex * 0.3),
      opacity: 1 - ex,
    });
  } else if (f >= 352 && f < 470) {
    const inn = tw(f, 352, 376, 0, 1, SPRING);
    const ex = tw(f, 448, 468, 0, 1, INOUT);
    out.push({
      kind: "light",
      pos: [-0.7 - ex * 1.6, lerp(-2.8, 0.1, inn) + bob(0.5), 0],
      rot: [0.32, 0.6 + f * 0.005, 0.25],
      scale: 0.86,
      shadowY: -1.1,
      opacity: 1 - ex,
    });
    out.push({
      kind: "heavy",
      pos: [0.72 + ex * 1.6, lerp(-3.0, -0.05, tw(f, 356, 380, 0, 1, SPRING)) + bob(2), 0],
      rot: [0.28, -0.6 - f * 0.004, -0.2],
      scale: 0.62,
      shadowY: -1.1,
      opacity: 1 - ex,
    });
  }
  return out;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export const Film: React.FC<{ sub?: number }> = ({ sub = 1 }) => {
  const f = useCurrentFrame() / sub;
  const objs = objectsAt(f);

  // dark beat: the room dims around a single thought
  const dark = tw(f, 298, 314, 0, 1, INOUT) * tw(f, 342, 358, 1, 0, INOUT);
  // global camera drift and pushes
  const push = 1 + tw(f, 0, 90, 0, 0.04, INOUT) + tw(f, 150, 300, 0, 0.03, [0, 0, 1, 1]) + tw(f, 352, 466, 0, 0.03, [0, 0, 1, 1]) + tw(f, 470, 600, 0, 0.06, [0.3, 0, 0.7, 1]);
  const camBlur = tw(f, 294, 304, 0, 10, [0.6, 0, 1, 0.5]) * tw(f, 306, 312, 1, 0) + tw(f, 340, 350, 0, 10, IN2) * tw(f, 352, 362, 1, 0);
  const slide = tw(f, 136, 150, 0, -900, [0.7, 0, 0.9, 0.4]); // text beat leaves to the left
  const slideBlur = Math.min(16, Math.abs(tw(f, 136, 150, 0, 1, [0.7, 0, 0.9, 0.4]) - tw(f - 1, 136, 150, 0, 1, [0.7, 0, 0.9, 0.4])) * 220);

  // accent line: leaps out of the light dumbbell and carries us to the next beat
  const lp = projectStudio([0, -0.25, 2.2], W, H);
  const lineDraw = tw(f, 82, 102, 0, 1, INOUT);
  const lineErase = tw(f, 94, 114, 0, 1, INOUT);
  const linePath = `M -60 1380 C 260 1420, 300 ${lp.y + 40}, ${lp.x} ${lp.y} S 980 ${lp.y - 260}, 1160 ${lp.y - 120}`;

  // light set
  const n = repsDone(f);
  const lastRep = n ? REPS[n - 1] : 0;
  const roll = n >= 23 ? tw(f, lastRep, lastRep + 4, 0, 1, OUT) : 1;
  const zone = n <= 15 ? 0 : n <= 22 ? 1 : 2;
  const cards = [
    { at: 182, title: "Reps 1–15", sub: "Feels easy", bg: C.mint, ink: C.mintInk, icon: "check" as const },
    { at: 236, title: "Reps 16–22", sub: "Gets hard", bg: C.peach, ink: C.peachInk, icon: "flame" as const },
    { at: 264, title: "Reps 23–25", sub: "This is where it grows", bg: C.rose, ink: C.roseInk, icon: "bolt" as const },
  ];

  // compare chips
  const Lp = projectStudio([-0.7, 0.1, 0], W, H);
  const Hp = projectStudio([0.72, -0.05, 0], W, H);
  const merge = tw(f, 410, 432, 0, 1, [0.6, 0, 0.2, 1]);
  const chip = (at: number, from: { x: number; y: number }, dx: number, dy: number) => {
    const p = tw(f, at, at + 16, 0, 1, SPRING);
    const x = lerp(from.x, from.x + dx, p);
    const y = lerp(from.y, from.y + dy, p);
    return { left: lerp(x, W / 2, merge), top: lerp(y, 1180, merge), opacity: Math.min(1, p * 2) * (1 - tw(f, 426, 434, 0, 1)), transform: `translate(-50%, -50%) scale(${lerp(0.4, 1, p) * (1 - merge * 0.4)})`, filter: `blur(${merge * (1 - merge) * 16}px)` };
  };
  const sameCard = tw(f, 428, 446, 0, 1, SPRING);
  // the "same growth" card morphs into the reps-in-reserve pill
  const morph = tw(f, 462, 484, 0, 1, INOUT);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Atmosphere f={f} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 50% at 50% 45%, #1E1E21 0%, ${C.dark} 75%)`, opacity: dark }} />

      <AbsoluteFill style={{ transform: `scale(${push})`, filter: camBlur > 0.3 ? `blur(${camBlur}px)` : undefined }}>
        <ObjectsScene width={W} height={H} objs={objs} />

        {/* A. hook */}
        {f < 112 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 360 }}>
            <Line f={f} text="Light or heavy?" at={-8} out={33} size={100} wght={620} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
              <Line f={f} text="Same *muscle*" at={37} out={76} size={112} wght={660} />
              <Line f={f} text="growth." at={42} out={77} size={112} wght={660} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 262 }}>
              <Line f={f} text="One condition." at={54} out={78} size={48} wght={450} color={C.ink60} />
            </div>
          </div>
        ) : null}
        {f >= 78 && f < 120 ? (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <path d={linePath} fill="none" stroke={C.accent} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${lineDraw - lineErase} 1`} strokeDashoffset={-lineErase} style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.7))" }} />
          </svg>
        ) : null}

        {/* B. one condition */}
        {f >= 96 && f < 152 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 820, transform: `translateX(${slide}px) scale(${1 + tw(f, 96, 136, 0, 0.05, [0, 0, 1, 1])})`, filter: slideBlur > 0.3 ? `blur(${slideBlur}px)` : undefined }}>
            <Line f={f} text="Take every set" at={100} size={104} wght={620} />
            <Line f={f} text="close to *failure.*" at={108} size={104} wght={650} />
          </div>
        ) : null}

        {/* C. a light set */}
        {f >= 150 && f < 312 ? (
          <AbsoluteFill style={{ opacity: tw(f, 296, 308, 1, 0) }}>
            <div style={{ position: "absolute", left: 96, top: 300 }}>
              <Line f={f} text="A light set." at={154} size={104} wght={650} align="left" />
              <Line f={f} text="30% of your max" at={160} size={46} wght={450} color={C.ink60} align="left" />
            </div>
            <div style={{ position: "absolute", left: 96, top: 610, opacity: tw(f, 170, 182, 0, 1) }}>
              <div style={{ ...ff(500), fontSize: 26, letterSpacing: "0.24em", color: C.ink60, textTransform: "uppercase" }}>Rep</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
                <div style={{ height: 170, overflow: "hidden", ...disp(900, 70), fontSize: 200, lineHeight: "170px", letterSpacing: "-0.02em", color: C.ink, fontVariantNumeric: "tabular-nums", textShadow: zone === 2 ? "0 0 40px rgba(255,255,255,0.55)" : "none" }}>
                  <div style={{ transform: `translateY(${-roll * 170}px)` }}>
                    <div>{pad2(Math.max(0, n - 1))}</div>
                    <div>{pad2(n)}</div>
                  </div>
                </div>
                <div style={{ ...ff(500), fontSize: 46, color: C.ink35, paddingBottom: 14 }}>/25</div>
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 930, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              {cards.map((c, i) => {
                const p = tw(f, c.at, c.at + 18, 0, 1, SPRING);
                const active = i === zone;
                return (
                  <div
                    key={c.title}
                    style={{
                      opacity: Math.min(1, p * 1.6) * (active ? 1 : 0.55),
                      transform: `translateY(${(1 - p) * 120}px) scale(${(active ? 1 : 0.95) * lerp(0.85, 1, p)})`,
                      filter: `blur(${(1 - p) * 14}px)`,
                    }}
                  >
                    <Card title={c.title} sub={c.sub} bg={c.bg} ink={c.ink} icon={c.icon} glow={i === 2 && active ? 0.6 + 0.4 * Math.sin(f / 3) : 0} />
                  </div>
                );
              })}
            </div>
          </AbsoluteFill>
        ) : null}

        {/* D. dark beat */}
        {f >= 304 && f < 356 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 840, transform: `scale(${1 + tw(f, 304, 356, 0, 0.06, [0, 0, 1, 1])})` }}>
            <Line f={f} text="Stop at rep 10?" at={306} out={342} size={64} wght={450} color="rgba(255,255,255,0.6)" glow />
            <div style={{ height: 18 }} />
            <Line f={f} text="Growth stalls." at={318} out={344} size={120} wght={640} color="#FFFFFF" glow />
          </div>
        ) : null}

        {/* E. light vs heavy */}
        {f >= 352 && f < 486 ? (
          <AbsoluteFill style={{ opacity: tw(f, 352, 362, 0, 1) }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 360 }}>
              <Line f={f} text="Light vs heavy" at={356} out={460} size={104} wght={650} />
            </div>
            {f < 436 ? (
              <>
                <div style={{ position: "absolute", ...chip(378, Lp, -40, -330) }}><Chip text="30%" bg={C.lilac} ink={C.lilacInk} /></div>
                <div style={{ position: "absolute", ...chip(384, Lp, 30, 300) }}><Chip text="25 reps" bg={C.lilac} ink={C.lilacInk} /></div>
                <div style={{ position: "absolute", ...chip(381, Hp, 40, -330) }}><Chip text="80%" bg="#E4E4E7" ink={C.ink} /></div>
                <div style={{ position: "absolute", ...chip(387, Hp, -30, 300) }}><Chip text="8 reps" bg="#E4E4E7" ink={C.ink} /></div>
              </>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: W / 2,
                top: 1180,
                transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, sameCard)})`,
                opacity: Math.min(1, sameCard * 2) * tw(f, 462, 470, 1, 0),
                filter: `blur(${(1 - Math.min(1, sameCard)) * 10}px)`,
              }}
            >
              <Card title="Same growth" sub="When both go close to failure" bg={C.mint} ink={C.mintInk} icon="check" w={800} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 1300, opacity: tw(f, 442, 454, 0, 1) * tw(f, 462, 470, 1, 0) }}>
              <Line f={f} text="Max strength? Heavy still wins." at={442} size={34} wght={450} color={C.ink60} />
            </div>
          </AbsoluteFill>
        ) : null}

        {/* F. the rule */}
        {f >= 462 && f < 552 ? (
          <AbsoluteFill style={{ opacity: tw(f, 538, 550, 1, 0), filter: `blur(${tw(f, 538, 550, 0, 12)}px)` }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 560 }}>
              <Line f={f} text="The rule" at={468} size={44} wght={500} color={C.ink60} />
              <div style={{ height: 20 }} />
              <Line f={f} text="Stop *0–3* reps" at={474} size={94} wght={680} />
              <Line f={f} text="before failure." at={481} size={94} wght={680} />
            </div>
            {/* the card becomes the pill */}
            <div
              style={{
                position: "absolute",
                left: W / 2,
                top: lerp(1180, 1150, morph),
                width: lerp(800, 840, morph),
                height: lerp(150, 120, morph),
                transform: "translate(-50%, -50%)",
                clipPath: chamfer(22),
                background: "linear-gradient(165deg, rgba(58,61,66,0.95), rgba(16,16,18,0.96))",
                opacity: tw(f, 460, 466, 0, 1),
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                gap: 10,
                boxSizing: "border-box",
              }}
            >
              {[5, 4, 3, 2, 1, 0].map((v, i) => {
                const on = v <= 3 ? tw(f, 494 + (3 - v) * 5, 500 + (3 - v) * 5, 0, 1, OUT) : 0;
                return (
                  <div
                    key={v}
                    style={{
                      flex: 1,
                      height: 92,
                      clipPath: chamfer(14),
                      background: on > 0.5 ? "linear-gradient(170deg,#FFFFFF,#C9CCD2)" : "rgba(255,255,255,0.06)",
                      color: on > 0.5 ? "#0B0B0C" : C.ink35,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...disp(900, 76),
                      fontSize: 46,
                      opacity: tw(f, 480 + i * 2, 490 + i * 2, 0, 1),
                      transform: `scale(${1 + Math.sin(on * Math.PI) * 0.12})`,
                      
                    }}
                  >
                    {v}
                  </div>
                );
              })}
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 1240, opacity: tw(f, 500, 512, 0, 1) }}>
              <Line f={f} text="reps left in the tank" at={500} size={34} wght={450} color={C.ink60} />
            </div>
          </AbsoluteFill>
        ) : null}

        {/* G. end: the monogram */}
        {f >= 544 ? <EndCard f={f} /> : null}
      </AbsoluteFill>

      <Grain opacity={0.1} vignette={0.45} seed={Math.floor(f)} />
    </AbsoluteFill>
  );
};
const IN2: Bz = [0.55, 0, 0.9, 0.4];

// ---------- atmosphere: charcoal sweep, top light, drifting haze and dust ----------
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const Atmosphere: React.FC<{ f: number }> = ({ f }) => (
  <>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 55% at 50% 28%, #2B2E33 0%, #17181B 46%, #0A0A0B 82%)" }} />
    <AbsoluteFill style={{ background: "conic-gradient(from 180deg at 50% -6%, rgba(255,255,255,0) 164deg, rgba(255,255,255,0.075) 180deg, rgba(255,255,255,0) 196deg)", filter: "blur(26px)" }} />
    {[0, 1, 2].map((k) => (
      <div
        key={k}
        style={{
          position: "absolute",
          left: 540 + Math.sin(f / 90 + k * 2.1) * 260 - 500,
          top: 700 + k * 380 + Math.cos(f / 110 + k) * 80 - 300,
          width: 1000,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(255,255,255,0.05), rgba(255,255,255,0))",
          filter: "blur(40px)",
        }}
      />
    ))}
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 80 }, (_, i) => {
        const sp = 0.25 + rnd(i + 3) * 0.6;
        const y = ((rnd(i) * H - f * sp) % H + H) % H;
        const x = rnd(i + 9) * W + Math.sin(f / 50 + i) * 14;
        const r = 1 + rnd(i + 5) * 2.6;
        return <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.08 + rnd(i + 7) * 0.32} style={{ filter: r > 2.6 ? "blur(1.5px)" : undefined }} />;
      })}
    </svg>
  </>
);

const HEX = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = ((-90 + 60 * k) * Math.PI) / 180;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");

const EndCard: React.FC<{ f: number }> = ({ f }) => {
  const cx = 540;
  const cy = 860;
  const draw = tw(f, 548, 574, 0, 1, INOUT);
  const fill = tw(f, 566, 578, 0, 1);
  const logo = tw(f, 568, 588, 0, 1, OUT);
  const sweep = tw(f, 580, 598, -40, 140, INOUT);
  const word = tw(f, 576, 592, 0, 1, OUT);
  const LW = 360;
  const LH = (LW * 967) / 952;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <polygon points={HEX(cx, cy, 300)} fill="#000000" opacity={fill * 0.92} />
        <polygon points={HEX(cx, cy, 300)} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 1`} style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,0.7))" }} opacity={1 - fill * 0.6} />
      </svg>
      <div style={{ position: "absolute", left: cx - LW / 2, top: cy - LH / 2, width: LW, height: LH, opacity: logo, transform: `scale(${0.9 + 0.1 * logo})`, filter: `blur(${(1 - logo) * 14}px) drop-shadow(0 0 24px rgba(255,255,255,0.18))` }}>
        <Img src={staticFile("brand/gd_letters.png")} style={{ width: LW, height: LH }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitMaskImage: `url(${staticFile("brand/gd_letters.png")})`,
            maskImage: `url(${staticFile("brand/gd_letters.png")})`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            background: `linear-gradient(115deg, rgba(255,255,255,0) ${sweep - 18}%, rgba(255,255,255,0.95) ${sweep}%, rgba(255,255,255,0) ${sweep + 18}%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center", opacity: word, transform: `translateY(${(1 - word) * 20}px)`, filter: `blur(${(1 - word) * 8}px)` }}>
        <div style={{ ...disp(800, 112), fontSize: 64, letterSpacing: "0.32em", paddingLeft: "0.32em", color: C.ink }}>Gainsdom</div>
        <div style={{ ...ff(500), fontSize: 26, letterSpacing: "0.34em", paddingLeft: "0.34em", textTransform: "uppercase", color: C.ink60, marginTop: 18 }}>Train smarter</div>
      </div>
    </AbsoluteFill>
  );
};
