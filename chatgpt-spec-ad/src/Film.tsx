import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import "./theme";
import { C, DARK, F, LIGHT, Theme, clamp, ease } from "./theme";
import {
  A1_BOLD, A1_REST, A2_HEAD, A2_ROWS, A3_HEAD, A3_QUOTE, BURST, BURST_CUTS, BURST_KEYS, BURST_PROMPTS, DURATION, FIN,
  KEYS1, KEYS2, KEYS3, KEYS4, Keystroke, S1, S2, S3, STATEMENTS, T1, T2, WALL, WORD_RATE, WORD_RATE_NIGHT, lastKeyBefore, textAt,
} from "./timeline";
import {
  COL, COMPOSER, Composer, PANEL, TopBar, Wave, UserBubble, answerStyle, caretVisible, composerBottomY, composerCenterY, streamWords,
} from "./ui";
import { Cam, CamKey, CameraRig, LOOKS, Look, PanelLight, Vignette, Wall, camAt, lerpLook } from "./World";
import { Whiteboard } from "./Whiteboard";

// ---------- Camera plan (panel coordinates; composer centre is 660, 440) ----------
const MAIN_KEYS: CamKey[] = [
  { f: 0, s: 3.3, fx: 380, fy: 446, rx: 6, ry: -10 }, // macro: the caret, waiting
  { f: 128, s: 3.55, fx: 396, fy: 446, rx: 6, ry: -9 },
  { f: 190, s: 1.04, fx: 660, fy: 430, rx: 5, ry: -12 }, // "So you open ChatGPT": the window
  { f: 212, s: 1.07, fx: 660, fy: 432, rx: 5, ry: -11 },
  { f: 248, s: 2.2, fx: 650, fy: 452, rx: 6, ry: -7 },
  { f: 310, s: 2.32, fx: 656, fy: 452, rx: 6, ry: -7 },
  { f: 334, s: 1.5, fx: 640, fy: 252, rx: 4, ry: -10 },
  { f: 380, s: 1.72, fx: 590, fy: 214, rx: 3, ry: -7 },
  { f: 414, s: 1.66, fx: 760, fy: 436, rx: 4, ry: 9 }, // whip through the passing light
  { f: 526, s: 1.8, fx: 690, fy: 446, rx: 4, ry: 7 },
  { f: 530, s: 1.8, fx: 690, fy: 446, rx: 4, ry: 7 },
  { f: 554, s: 1.42, fx: 650, fy: 330, rx: 3, ry: 6 },
  { f: 617.9, s: 1.6, fx: 610, fy: 404, rx: 3, ry: 4 },
  { f: 618, s: 2.05, fx: 660, fy: 452, rx: 2, ry: -1 }, // hard cut to 3 a.m.
  { f: 722, s: 2.2, fx: 660, fy: 452, rx: 2, ry: -1 },
  { f: 746, s: 1.52, fx: 600, fy: 222, rx: 2, ry: -3 },
  { f: 838, s: 1.78, fx: 540, fy: 240, rx: 2, ry: -4 },
];

const lookFor = (scene: 1 | 2 | 3, frame: number): Look => {
  if (scene === 1) return LOOKS.morning;
  if (scene === 2) {
    const t = interpolate(frame, [T2.start, T2.end - 2], [0, 1], { ...clamp, easing: ease.soft });
    return lerpLook(LOOKS.afternoon, LOOKS.dim, t);
  }
  return LOOKS.night;
};

// ---------- Shared chat flow: type -> send -> bubble rises -> thinking dot -> answer streams ----------
const ThinkingDot: React.FC<{ theme: Theme; frame: number; from: number; to: number }> = ({ theme, frame, from, to }) => {
  if (frame < from || frame >= to) return null;
  const s = 0.82 + 0.18 * Math.sin((frame - from) / 2.4);
  const o = interpolate(frame, [from, from + 3], [0, 1], clamp) * interpolate(frame, [to - 2, to], [1, 0], clamp);
  return <div style={{ width: 15, height: 15, borderRadius: 8, background: theme.text, transform: `scale(${s})`, opacity: o, marginTop: 8 }} />;
};

const ChatFlow: React.FC<{
  frame: number;
  theme: Theme;
  keys: Keystroke[];
  send: number;
  answerStart: number;
  answer: React.ReactNode;
  attachH?: number;
  attachment?: React.ReactNode;
  hover?: number;
  bubbleImage?: React.ReactNode;
}> = ({ frame, theme, keys, send, answerStart, answer, attachH = 0, attachment, hover = 0, bubbleImage }) => {
  const sent = frame >= send;
  const typed = sent ? "" : textAt(keys, frame);
  const caret = sent ? caretVisible(frame, -999) : caretVisible(frame, lastKeyBefore(keys, frame));
  const press = interpolate(frame, [send - 3, send - 1, send + 2], [0, 1, 0], clamp);
  const hBefore = COMPOSER.h + (attachment ? COMPOSER.attach : 0);
  const aH = sent ? interpolate(frame, [send, send + 8], [attachH, 0], { ...clamp, easing: ease.out }) : attachH;
  const h = COMPOSER.h + aH;
  const cy = interpolate(frame, [send, send + 24], [composerCenterY, composerBottomY(COMPOSER.h)], { ...clamp, easing: ease.cam });
  const top = cy - h / 2;

  const rise = interpolate(frame, [send, send + 24], [0, 1], { ...clamp, easing: ease.cam });
  const startY = composerCenterY - hBefore / 2 + 16 + (attachment ? COMPOSER.attach : 0) - 84 - (bubbleImage ? 210 : 0);
  const bubbleO = interpolate(frame, [send, send + 3], [0, 1], clamp);
  const finalText = keys[keys.length - 1].text;

  return (
    <>
      <div style={{ position: "absolute", left: COL.x, top: 84, width: COL.w, display: "flex", flexDirection: "column" }}>
        {sent ? (
          <div style={{ transform: `translateY(${(1 - rise) * startY}px)`, opacity: bubbleO }}>
            {bubbleImage ? (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>{bubbleImage}</div>
            ) : null}
            <UserBubble theme={theme}>{finalText}</UserBubble>
          </div>
        ) : null}
        <div style={{ height: 34 }} />
        <ThinkingDot theme={theme} frame={frame} from={send + 6} to={answerStart} />
        {frame >= answerStart ? <div style={answerStyle(theme)}>{answer}</div> : null}
      </div>
      <div style={{ position: "absolute", left: (PANEL.w - COMPOSER.w) / 2, top }}>
        <Composer theme={theme} text={typed} caret={caret} press={press} hover={hover} attachment={attachment} attachH={aH} />
      </div>
    </>
  );
};

// ---------- Scene 1: 7:12 a.m. ----------
const Scene1: React.FC<{ frame: number }> = ({ frame }) => {
  const theme = LIGHT;
  const b = streamWords(A1_BOLD, 0, S1.answerStart, frame, WORD_RATE);
  const r = streamWords(A1_REST, b.count, S1.answerStart, frame, WORD_RATE);
  const boldDone = frame > S1.answerStart + b.count * WORD_RATE + 6;
  const sweepPos = interpolate(frame, [S1.sweep, S1.sweep + 30], [100, 0], { ...clamp, easing: ease.cam });
  const boldStyle: React.CSSProperties = boldDone
    ? {
        backgroundImage: `linear-gradient(100deg, ${theme.text} 0%, ${theme.text} 40%, ${C.amber} 50%, ${theme.text} 60%, ${theme.text} 100%)`,
        backgroundSize: "260% 100%",
        backgroundPosition: `${sweepPos}% 0`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : {};
  return (
    <ChatFlow
      frame={frame}
      theme={theme}
      keys={KEYS1}
      send={S1.send}
      answerStart={S1.answerStart}
      answer={
        <>
          <div style={{ fontWeight: 600, marginBottom: 12, display: "inline-block", ...boldStyle }}>{b.nodes}</div>
          <div>{r.nodes}</div>
        </>
      }
    />
  );
};

// ---------- Scene 2: 2:40 p.m. (drag a whiteboard photo in) ----------
const Pointer: React.FC<{ scale: number }> = ({ scale }) => (
  <svg width={34} height={48} viewBox="0 0 17 24" style={{ transform: `scale(${scale})`, transformOrigin: "2px 2px", overflow: "visible", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.28))" }}>
    <path d="M1 1 L1 18.2 L5.4 14 L8.6 21.4 L11.6 20.1 L8.5 12.9 L14.6 12.9 Z" fill="#111" stroke="#FDFDFC" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const quad = (p: number, a: number[], b: number[], c: number[]) => [
  (1 - p) * (1 - p) * a[0] + 2 * (1 - p) * p * b[0] + p * p * c[0],
  (1 - p) * (1 - p) * a[1] + 2 * (1 - p) * p * b[1] + p * p * c[1],
];

const Scene2: React.FC<{ frame: number }> = ({ frame }) => {
  const theme = LIGHT;
  const { dragStart, drop } = S2;
  const p = interpolate(frame, [dragStart, drop], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.12, 1) });
  let [cx, cy] = quad(p, [1520, 860], [1200, 300], [720, 404]);
  const away = interpolate(frame, [drop + 4, drop + 22], [0, 1], { ...clamp, easing: ease.cam });
  cx += away * 300;
  cy += away * 250;
  const cursorO = frame < dragStart ? 0 : 1 - interpolate(frame, [drop + 8, drop + 22], [0, 1], clamp);
  const press = interpolate(frame, [drop - 3, drop, drop + 3], [0, 1, 0], clamp);

  const attachH = interpolate(frame, [drop, drop + 10], [0, COMPOSER.attach], { ...clamp, easing: ease.out });
  const hover = frame < drop ? interpolate(p, [0.72, 0.92], [0, 1], clamp) : interpolate(frame, [drop, drop + 6], [1, 0], clamp);

  // The dragged card lands and becomes the attachment thumbnail.
  const land = interpolate(frame, [drop, drop + 12], [0, 1], { ...clamp, easing: ease.out });
  const thumbTop = composerCenterY - (COMPOSER.h + COMPOSER.attach) / 2 + 16;
  const thumb = { x: (PANEL.w - COMPOSER.w) / 2 + 14 + 6, y: thumbTop, w: 64, h: 64 };
  const card = { x: cx - 196, y: cy - 128, w: 232, h: 156 };
  const lerp = (a: number, b: number) => a + (b - a) * land;
  const cardRect = frame < drop ? card : { x: lerp(card.x, thumb.x), y: lerp(card.y, thumb.y), w: lerp(card.w, thumb.w), h: lerp(card.h, thumb.h) };
  const cardRot = frame < drop ? -4 + 2 * p : lerp(-2, 0);
  const showCard = frame >= dragStart && frame < drop + 12;

  const head = streamWords(A2_HEAD, 0, S2.answerStart, frame, WORD_RATE);
  let idx = head.count;
  const rows = A2_ROWS.map((row, i) => {
    const t = streamWords(row.t, idx, S2.answerStart, frame, WORD_RATE, { fontWeight: 600 });
    idx += t.count;
    const s = streamWords(row.s, idx, S2.answerStart, frame, WORD_RATE);
    idx += s.count;
    return (
      <div key={i} style={{ display: "flex", gap: 14, alignItems: "baseline", marginTop: i === 0 ? 14 : 8 }}>
        <span style={{ width: 22, color: theme.sub, opacity: s.nodes.length ? 1 : 0 }}>
          {streamWords(`${i + 1}.`, idx - s.count - t.count, S2.answerStart, frame, WORD_RATE).nodes}
        </span>
        <span style={{ width: 58, fontVariantNumeric: "tabular-nums" }}>{t.nodes}</span>
        <span>{s.nodes}</span>
      </div>
    );
  });

  return (
    <>
      <ChatFlow
        frame={frame}
        theme={theme}
        keys={KEYS2}
        send={S2.send}
        answerStart={S2.answerStart}
        attachH={attachH}
        hover={hover}
        attachment={<div style={{ opacity: frame >= drop + 12 ? 1 : 0 }}><Whiteboard w={64} h={64} radius={12} /></div>}
        bubbleImage={<Whiteboard w={300} h={200} radius={18} />}
        answer={
          <>
            <div>{head.nodes}</div>
            {rows}
          </>
        }
      />
      {showCard ? (
        <div
          style={{
            position: "absolute",
            left: cardRect.x,
            top: cardRect.y,
            transform: `rotate(${cardRot}deg)`,
            boxShadow: `0 ${18 * (1 - land)}px ${40 * (1 - land) + 6}px rgba(30,20,10,${0.28 - 0.2 * land})`,
            borderRadius: 14,
          }}
        >
          <Whiteboard w={cardRect.w} h={cardRect.h} radius={lerp(14, 12)} />
        </div>
      ) : null}
      {cursorO > 0 ? (
        <div style={{ position: "absolute", left: cx, top: cy, opacity: cursorO }}>
          <Pointer scale={1 - 0.1 * press} />
        </div>
      ) : null}
    </>
  );
};

// ---------- Scene 3: 3:04 a.m. ----------
const Scene3: React.FC<{ frame: number }> = ({ frame }) => {
  const theme = DARK;
  const h = streamWords(A3_HEAD, 0, S3.answerStart, frame, WORD_RATE_NIGHT);
  const q = streamWords(A3_QUOTE, h.count, S3.answerStart, frame, WORD_RATE_NIGHT);
  return (
    <ChatFlow
      frame={frame}
      theme={theme}
      keys={KEYS3}
      send={S3.send}
      answerStart={S3.answerStart}
      answer={
        <>
          <div>{h.nodes}</div>
          <div style={{ marginTop: 16, paddingLeft: 20, borderLeft: `3px solid ${theme.rule}` }}>{q.nodes}</div>
        </>
      }
    />
  );
};

// ---------- One shot of the main continuous camera ----------
const Panel: React.FC<{ theme: Theme; look: Look; frame: number; children: React.ReactNode }> = ({ theme, look, frame, children }) => (
  <div style={{ position: "absolute", inset: 0, background: theme.bg, borderRadius: 26, overflow: "hidden" }}>
    <TopBar theme={theme} />
    {children}
    <PanelLight look={look} frame={frame} />
  </div>
);

const MainShot: React.FC<{ frame: number; cam: Cam; scene: 1 | 2 | 3 }> = ({ frame, cam, scene }) => {
  const look = lookFor(scene, frame);
  const theme = scene === 3 ? DARK : LIGHT;
  return (
    <AbsoluteFill>
      <Wall look={look} cam={cam} />
      <CameraRig cam={cam} look={look} dark={theme.dark}>
        <Panel theme={theme} look={look} frame={frame}>
          {scene === 1 ? <Scene1 frame={frame} /> : scene === 2 ? <Scene2 frame={frame} /> : <Scene3 frame={frame} />}
        </Panel>
      </CameraRig>
    </AbsoluteFill>
  );
};

// ---------- Transition 1: a band of sunlight passes the lens and leaves the afternoon behind it ----------
const SKEW = Math.tan((8 * Math.PI) / 180) * 540;
const sweepX = (frame: number) => interpolate(frame, [T1.start, T1.end], [-520, 2440], { ...clamp, easing: ease.cam });

const ShadowPass: React.FC<{ frame: number }> = ({ frame }) => {
  const x = sweepX(frame);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 260,
        top: -240,
        width: 520,
        height: 1560,
        transform: "skewX(-8deg)",
        background: "linear-gradient(90deg, rgba(255,236,206,0) 0%, rgba(255,238,212,0.9) 30%, rgba(255,248,236,1) 50%, rgba(255,238,212,0.9) 70%, rgba(255,236,206,0) 100%)",
        filter: "blur(34px)",
      }}
    />
  );
};

// ---------- Burst: four questions, four hours, cut on the beat ----------
const BurstShot: React.FC<{ frame: number }> = ({ frame }) => {
  let i = 0;
  for (let k = 0; k < BURST.count; k++) if (frame >= BURST_CUTS[k]) i = k;
  const local = frame - BURST_CUTS[i];
  const len = BURST_CUTS[i + 1] - BURST_CUTS[i];
  const p = BURST_PROMPTS[i];
  const theme = p.look === "evening" || p.look === "night" ? DARK : LIGHT;
  const look = LOOKS[p.look];
  const side = i % 2 === 0 ? -1 : 1;
  const keys: CamKey[] = [
    { f: 0, s: 2.0, fx: 660 - side * 36, fy: 450, rx: 6, ry: side * 11 },
    { f: len, s: 2.24, fx: 660 + side * 8, fy: 448, rx: 5, ry: side * 8 },
  ];
  const cam = camAt(keys, local, 0.5);
  const k = BURST_KEYS[i];
  const typed = textAt(k, frame);
  return (
    <AbsoluteFill>
      <Wall look={look} cam={cam} />
      <CameraRig cam={cam} look={look} dark={theme.dark}>
        <Panel theme={theme} look={look} frame={frame}>
          <div style={{ position: "absolute", left: (PANEL.w - COMPOSER.w) / 2, top: composerCenterY - COMPOSER.h / 2 }}>
            <Composer theme={theme} text={typed} caret={caretVisible(frame, lastKeyBefore(k, frame))} />
          </div>
        </Panel>
      </CameraRig>
    </AbsoluteFill>
  );
};

// ---------- Finale: the wall of questions, the one you'd never say out loud, the button becomes the brand ----------
const DEPTH = [
  { sc: 0.8, blur: 2.4, op: 0.55, speed: 0.32 },
  { sc: 1, blur: 0, op: 1, speed: 0.62 },
  { sc: 1.22, blur: 7, op: 0.85, speed: 1.15 },
];

const WallBubble: React.FC<{ b: (typeof WALL)[number]; frame: number }> = ({ b, frame }) => {
  const d = DEPTH[b.d];
  const k = interpolate(frame, [b.at, b.at + 18], [0, 1], { ...clamp, easing: ease.out });
  const t0 = FIN.fade + (2 - b.d) * 5;
  const leave = interpolate(frame, [t0, t0 + 24], [0, 1], { ...clamp, easing: ease.in });
  if (k <= 0 || leave >= 1) return null;
  const t = frame - FIN.start;
  const x = b.x + Math.sin((frame + b.at) / 37) * 6 * d.speed;
  const y = b.y - d.speed * t - leave * 60 * d.speed + (1 - k) * 18;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${d.sc * (0.96 + 0.04 * k)})`,
        transformOrigin: "0 0",
        opacity: k * (1 - leave) * d.op,
        filter: `blur(${d.blur + leave * 10 + (1 - k) * 6}px)`,
        background: "#FDFDFC",
        color: "#0D0D0D",
        borderRadius: b.size * 1.1,
        padding: `${b.size * 0.42}px ${b.size * 0.78}px`,
        fontFamily: F.sans,
        fontSize: b.size,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        boxShadow: "0 1px 2px rgba(30,22,12,0.05), 0 10px 30px rgba(30,22,12,0.08)",
      }}
    >
      {b.text}
    </div>
  );
};

const Finale: React.FC<{ frame: number }> = ({ frame }) => {
  const theme = LIGHT;
  const push = interpolate(frame, [FIN.fade, FIN.fade + 46], [0, 1], { ...clamp, easing: ease.cam });
  const cs = 1.3 + 0.32 * push + 0.03 * interpolate(frame, [FIN.start, FIN.fade], [0, 1], clamp);
  const cx = 960;
  const cy = 560;
  const sent = frame >= FIN.send;
  const typed = sent ? "" : textAt(KEYS4, frame);
  const press = interpolate(frame, [FIN.send - 3, FIN.send - 1, FIN.send + 2], [0, 1, 0], clamp);
  const leave = interpolate(frame, [FIN.fly + 2, FIN.fly + 18], [0, 1], { ...clamp, easing: ease.in });

  // The send button leaves the box, flies to centre and opens like an iris onto the logo.
  const bx0 = cx + (728 - 380) * cs;
  const by0 = cy + (80 - 56) * cs;
  const fp = interpolate(frame, [FIN.fly, FIN.iris], [0, 1], { ...clamp, easing: ease.cam });
  const tx = 960;
  const ty = 430;
  const ctrl = [bx0 - 60, ty - 150];
  const bx = (1 - fp) * (1 - fp) * bx0 + 2 * (1 - fp) * fp * ctrl[0] + fp * fp * tx;
  const by = (1 - fp) * (1 - fp) * by0 + 2 * (1 - fp) * fp * ctrl[1] + fp * fp * ty;
  const D0 = 36 * cs;
  const D1 = 232;
  const D = D0 + (D1 - D0) * fp;
  const iris = interpolate(frame, [FIN.iris, FIN.irisEnd], [0, 1], { ...clamp, easing: ease.out });
  const ring = (D / 2) * (1 - iris);
  const flying = frame >= FIN.fly && iris < 1;
  const logoOn = frame >= FIN.iris;
  const logoScale = 0.93 + 0.07 * iris + 0.012 * interpolate(frame, [FIN.irisEnd, DURATION], [0, 1], clamp);

  const words = ["Ask", "anything."];
  const specIn = interpolate(frame, [FIN.spec, FIN.spec + 20], [0, 1], { ...clamp, easing: ease.out });

  return (
    <AbsoluteFill>
      {WALL.filter((b) => b.d < 2).map((b) => (
        <WallBubble key={b.text} b={b} frame={frame} />
      ))}
      {leave < 1 ? (
        <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%, -50%) translateY(${leave * 26}px) scale(${cs})`, opacity: 1 - leave }}>
          <Composer
            theme={theme}
            text={typed}
            caret={caretVisible(frame, lastKeyBefore(KEYS4, frame))}
            press={press}
            buttonOpacity={frame >= FIN.fly ? 0 : 1}
          />
        </div>
      ) : null}
      {WALL.filter((b) => b.d === 2).map((b) => (
        <WallBubble key={b.text} b={b} frame={frame} />
      ))}
      {logoOn ? (
        <Img
          src={staticFile("logo/blossom-black.svg")}
          style={{ position: "absolute", left: tx - 210, top: ty - 210, width: 420, height: 420, transform: `scale(${logoScale})` }}
        />
      ) : null}
      {flying ? (
        <div
          style={{
            position: "absolute",
            left: bx - D / 2,
            top: by - D / 2,
            width: D,
            height: D,
            borderRadius: "50%",
            boxSizing: "border-box",
            border: `${Math.max(0, ring)}px solid #0D0D0D`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ opacity: 1 - interpolate(fp, [0, 0.35], [0, 1], clamp), transform: `scale(${D / 36})` }}>
            <Wave c="#FDFDFC" />
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 610, textAlign: "center", fontFamily: F.serif, fontSize: 132, lineHeight: 1, letterSpacing: "-0.022em", color: C.ink }}>
        {words.map((w, i) => {
          const t0 = FIN.headline + i * 9;
          const k = interpolate(frame, [t0, t0 + 26], [0, 1], { ...clamp, easing: ease.out });
          return (
            <span
              key={w}
              style={{
                display: "inline-block",
                marginRight: i === 0 ? "0.22em" : 0,
                fontStyle: i === 1 ? "italic" : "normal",
                opacity: k,
                transform: `translateY(${(1 - k) * 34}px)`,
                filter: `blur(${(1 - k) * 12}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 120, bottom: 64, opacity: specIn * 0.9, fontFamily: F.mono, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: "#77746E" }}>
        Spec ad · Not affiliated with OpenAI
      </div>
    </AbsoluteFill>
  );
};

// ---------- Statement lines: the voice's chapter lines, word by word on the voice ----------
const Statements: React.FC = () => {
  const frame = useCurrentFrame();
  const st = STATEMENTS.find((s) => frame >= s.f0 - 2 && frame < s.f1 + 34);
  if (!st) return null;
  const dark = st.f0 >= S3.start && st.f0 < BURST.start;
  const words = st.text.replace(/[…]/g, "").trim().split(" ");
  const span = st.f1 - st.f0;
  const total = words.reduce((n, w) => n + w.length + 1, 0);
  let acc = 0;
  const out = interpolate(frame, [st.f1 + 18, st.f1 + 34], [0, 1], { ...clamp, easing: ease.in });
  // the last word is italic; "3 a.m." counts as one unit
  const units: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words[i] === "3" && words[i + 1] === "a.m.") {
      units.push("3 a.m.");
      i++;
    } else units.push(words[i]);
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        bottom: 88,
        fontFamily: F.serif,
        fontSize: 64,
        lineHeight: 1,
        letterSpacing: "-0.012em",
        color: dark ? "#EDEDEA" : "#141210",
        opacity: 1 - out,
        transform: `translateY(${-out * 14}px)`,
        filter: `blur(${out * 6}px)`,
        whiteSpace: "nowrap",
        textShadow: dark ? "0 2px 24px rgba(0,0,0,0.5)" : "0 2px 24px rgba(253,251,246,0.7)",
      }}
    >
      {units.map((w, i) => {
        const t = st.f0 + (acc / total) * span * 0.92;
        acc += w.length + 1;
        const k = interpolate(frame, [t - 2, t + 14], [0, 1], { ...clamp, easing: ease.out });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.24em",
              fontStyle: i === units.length - 1 ? "italic" : "normal",
              opacity: k,
              transform: `translateY(${(1 - k) * 22}px)`,
              filter: `blur(${(1 - k) * 9}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Smooth gradients live outside the motion-blur stack, so stacked samples never band them.
const EndBackground: React.FC<{ frame: number }> = ({ frame }) => {
  // Dawn light through the window (6:02 AM, the next morning), clearing to plain paper for the logo.
  const light = 1 - interpolate(frame, [FIN.send - 10, FIN.iris - 6], [0, 1], { ...clamp, easing: ease.soft });
  const drift = (frame - FIN.start) * 0.15;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(140% 120% at 50% 42%, #F7F6F2 0%, ${C.paper} 50%, #ECEAE4 100%)` }} />
      {light > 0.01 ? (
        <AbsoluteFill style={{ opacity: light }}>
          <Wall look={LOOKS.dawn} cam={{ s: 1, fx: 660 - drift, fy: 440, rx: 0, ry: 0 }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const vignetteAt = (frame: number) => {
  if (frame >= FIN.start) return 0.12;
  if (frame >= BURST.start) {
    let i = 0;
    for (let k = 0; k < BURST.count; k++) if (frame >= BURST_CUTS[k]) i = k;
    return LOOKS[BURST_PROMPTS[i].look].vignette;
  }
  if (frame >= S3.start) return LOOKS.night.vignette;
  if (frame >= T1.end) return lookFor(2, frame).vignette;
  if (frame >= T1.start) return interpolate(frame, [T1.start, T1.end], [LOOKS.morning.vignette, LOOKS.afternoon.vignette], clamp);
  return LOOKS.morning.vignette;
};

// ---------- The frame ----------
const FilmFrame: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= FIN.start) return <Finale frame={frame} />;
  if (frame >= BURST.start) return <BurstShot frame={frame} />;
  const cam = camAt(MAIN_KEYS, frame);
  if (frame >= T1.start && frame <= T1.end) {
    const x = sweepX(frame);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ clipPath: `polygon(${x + SKEW}px 0, 1920px 0, 1920px 1080px, ${x - SKEW}px 1080px)` }}>
          <MainShot frame={frame} cam={cam} scene={1} />
        </AbsoluteFill>
        <AbsoluteFill style={{ clipPath: `polygon(0 0, ${x + SKEW}px 0, ${x - SKEW}px 1080px, 0 1080px)` }}>
          <MainShot frame={frame} cam={cam} scene={2} />
        </AbsoluteFill>
        <ShadowPass frame={frame} />
      </AbsoluteFill>
    );
  }
  const scene = frame < S2.start ? 1 : frame < S3.start ? 2 : 3;
  return <MainShot frame={frame} cam={cam} scene={scene} />;
};

// ---------- Time label (top right): the only caption the film needs ----------
const LABELS: { from: number; text: string | null; dark: boolean; roll?: boolean }[] = [
  { from: 0, text: "7:12 AM", dark: false },
  { from: 398, text: "2:40 PM", dark: false, roll: true },
  { from: 618, text: "3:04 AM", dark: true },
  { from: 838, text: "11:20 AM", dark: false },
  { from: 865, text: "6:45 PM", dark: false },
  { from: 889, text: "9:58 PM", dark: true },
  { from: 910, text: "1:16 AM", dark: true },
  { from: 940, text: "6:02 AM", dark: false }, // the next morning
  { from: FIN.send, text: null, dark: false },
];

const TimeLabel: React.FC = () => {
  const frame = useCurrentFrame();
  let i = 0;
  for (let k = 0; k < LABELS.length; k++) if (frame >= LABELS[k].from) i = k;
  const cur = LABELS[i];
  if (!cur.text) return null;
  const prev = i > 0 ? LABELS[i - 1] : null;
  const roll = cur.roll ? interpolate(frame, [cur.from, cur.from + 12], [0, 1], { ...clamp, easing: ease.out }) : 1;
  const style = (dark: boolean): React.CSSProperties => ({
    position: "absolute",
    right: 0,
    top: 0,
    fontFamily: F.mono,
    fontWeight: 500,
    fontSize: 20,
    letterSpacing: "0.12em",
    color: dark ? "#9097A6" : "#5E5A54",
    whiteSpace: "nowrap",
  });
  const intro = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: ease.out });
  return (
    <div style={{ position: "absolute", right: 120, top: 78, width: 300, height: 28, overflow: "hidden", opacity: i === 0 ? intro : 1 }}>
      {cur.roll && prev?.text && roll < 1 ? (
        <div style={{ ...style(prev.dark), transform: `translateY(${-roll * 28}px)` }}>{prev.text}</div>
      ) : null}
      <div style={{ ...style(cur.dark), transform: `translateY(${(1 - roll) * 28}px)` }}>{cur.text}</div>
    </div>
  );
};

const BLUR_RANGES: [number, number][] = [
  [128, 192],
  [310, 336],
  [378, 414],
  [448, 480],
  [530, 556],
  [722, 748],
];
const SOFT_BLUR_RANGES: [number, number][] = [[FIN.fly, FIN.iris + 2]]; // a short shutter, so the flying button never smears

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const blur = BLUR_RANGES.some(([a, b]) => frame >= a && frame <= b);
  const soft = SOFT_BLUR_RANGES.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      {frame >= FIN.start ? <EndBackground frame={frame} /> : null}
      {blur || soft ? (
        <CameraMotionBlur shutterAngle={soft ? 70 : 180} samples={6}>
          <FilmFrame />
        </CameraMotionBlur>
      ) : (
        <FilmFrame />
      )}
      <Vignette amount={vignetteAt(frame)} />
      <Statements />
      <TimeLabel />
    </AbsoluteFill>
  );
};
