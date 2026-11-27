import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import "./theme";
import { C, DARK, F, LIGHT, Theme, clamp, ease } from "./theme";
import {
  A1_BOLD, A1_REST, A2_HEAD, A2_ROWS, A3_HEAD, A3_QUOTE, BURST, BURST_KEYS, BURST_PROMPTS, END,
  KEYS1, KEYS2, KEYS3, Keystroke, S1, S2, S3, T1, T2, WORD_RATE, lastKeyBefore, textAt,
} from "./timeline";
import {
  COL, COMPOSER, Composer, PANEL, TopBar, UserBubble, answerStyle, caretVisible, composerBottomY, composerCenterY, streamWords,
} from "./ui";
import { Cam, CamKey, CameraRig, LOOKS, Look, PanelLight, Vignette, Wall, camAt, lerpLook } from "./World";
import { Whiteboard } from "./Whiteboard";

// ---------- Camera plan (panel coordinates; composer centre is 660, 440) ----------
const MAIN_KEYS: CamKey[] = [
  { f: 0, s: 2.05, fx: 660, fy: 462, rx: 7, ry: -8 },
  { f: 62, s: 2.24, fx: 662, fy: 456, rx: 6, ry: -7 },
  { f: 100, s: 1.5, fx: 640, fy: 252, rx: 4, ry: -10 },
  { f: 188, s: 1.74, fx: 590, fy: 212, rx: 3, ry: -7 },
  { f: 222, s: 1.66, fx: 760, fy: 436, rx: 4, ry: 9 }, // whip through the passing light
  { f: 286, s: 1.8, fx: 690, fy: 446, rx: 4, ry: 7 },
  { f: 324, s: 1.42, fx: 650, fy: 330, rx: 3, ry: 6 },
  { f: 399.9, s: 1.62, fx: 610, fy: 404, rx: 3, ry: 4 },
  { f: 400, s: 2.05, fx: 660, fy: 452, rx: 2, ry: -1 }, // hard cut to 3 a.m.
  { f: 472, s: 2.2, fx: 660, fy: 452, rx: 2, ry: -1 },
  { f: 512, s: 1.52, fx: 620, fy: 222, rx: 2, ry: -3 },
  { f: 560, s: 1.7, fx: 580, fy: 236, rx: 2, ry: -4 },
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
  const cy = interpolate(frame, [send, send + 22], [composerCenterY, composerBottomY(COMPOSER.h)], { ...clamp, easing: ease.out });
  const top = cy - h / 2;

  const rise = interpolate(frame, [send, send + 20], [0, 1], { ...clamp, easing: ease.out });
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
  const h = streamWords(A3_HEAD, 0, S3.answerStart, frame, WORD_RATE);
  const q = streamWords(A3_QUOTE, h.count, S3.answerStart, frame, WORD_RATE);
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
      <Vignette amount={look.vignette} />
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
  const i = Math.min(BURST.count - 1, Math.floor((frame - BURST.start) / BURST.shot));
  const local = frame - (BURST.start + i * BURST.shot);
  const p = BURST_PROMPTS[i];
  const theme = p.look === "evening" || p.look === "night" ? DARK : LIGHT;
  const look = LOOKS[p.look];
  const side = i % 2 === 0 ? -1 : 1;
  const keys: CamKey[] = [
    { f: 0, s: 2.0, fx: 660 - side * 36, fy: 450, rx: 6, ry: side * 11 },
    { f: BURST.shot, s: 2.24, fx: 660 + side * 8, fy: 448, rx: 5, ry: side * 8 },
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
      <Vignette amount={look.vignette} />
    </AbsoluteFill>
  );
};

// ---------- End card: the placeholder becomes the line ----------
const EndCard: React.FC<{ frame: number }> = ({ frame }) => {
  const theme = LIGHT;
  const pull = interpolate(frame, [END.start + 6, END.start + 46], [0, 1], { ...clamp, easing: ease.cam });
  const scale = 2.2 + (1.3 - 2.2) * pull;
  const y = 540 + (612 - 540) * pull;
  const drift = 1 + 0.018 * interpolate(frame, [END.start, END.start + 110], [0, 1], clamp);
  const lift = interpolate(frame, [END.lift, END.lift + 20], [0, 1], { ...clamp, easing: ease.in });
  const words = ["Ask", "anything."];
  const brandIn = interpolate(frame, [END.brand, END.brand + 20], [0, 1], { ...clamp, easing: ease.out });
  const urlIn = interpolate(frame, [END.brand + 7, END.brand + 27], [0, 1], { ...clamp, easing: ease.out });
  const specIn = interpolate(frame, [END.spec, END.spec + 20], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(85% 75% at 50% 40%, #F8F7F3 0%, ${C.paper} 45%, #E7E5DE 100%)` }}>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 268, textAlign: "center", fontFamily: F.serif, fontSize: 184, lineHeight: 1, letterSpacing: "-0.025em", color: C.ink }}>
          {words.map((w, i) => {
            const t0 = END.headline + i * 6;
            const k = interpolate(frame, [t0, t0 + 28], [0, 1], { ...clamp, easing: ease.out });
            return (
              <span
                key={w}
                style={{
                  display: "inline-block",
                  marginRight: i === 0 ? "0.22em" : 0,
                  fontStyle: i === 1 ? "italic" : "normal",
                  opacity: k,
                  transform: `translateY(${(1 - k) * 46}px)`,
                  filter: `blur(${(1 - k) * 14}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 960, top: y, transform: `translate(-50%, -50%) scale(${scale})` }}>
          <Composer
            theme={theme}
            text=""
            caret={caretVisible(frame, -999)}
            placeholderStyle={{ opacity: 1 - lift, transform: `translateY(${-lift * 46}px)`, filter: `blur(${lift * 6}px)` }}
          />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 772, textAlign: "center", overflow: "hidden", height: 56 }}>
          <div style={{ transform: `translateY(${(1 - brandIn) * 56}px)`, fontFamily: F.sans, fontWeight: 500, fontSize: 40, letterSpacing: "-0.015em", color: C.ink }}>
            ChatGPT
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 834, textAlign: "center", opacity: urlIn, transform: `translateY(${(1 - urlIn) * 10}px)`, fontFamily: F.mono, fontSize: 19, letterSpacing: "0.04em", color: "#6E6B65" }}>
          chatgpt.com
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, bottom: 64, opacity: specIn * 0.9, fontFamily: F.mono, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: "#77746E" }}>
        Spec ad · Not affiliated with OpenAI
      </div>
      <Vignette amount={0.1} />
    </AbsoluteFill>
  );
};

// ---------- The frame ----------
const FilmFrame: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= END.start) return <EndCard frame={frame} />;
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
  { from: 198, text: "2:40 PM", dark: false, roll: true },
  { from: 400, text: "3:04 AM", dark: true },
  { from: 560, text: "11:20 AM", dark: false },
  { from: 580, text: "6:45 PM", dark: false },
  { from: 600, text: "9:58 PM", dark: true },
  { from: 620, text: "1:16 AM", dark: true },
  { from: 640, text: null, dark: false },
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
  [62, 100],
  [186, 250],
  [476, 512],
  [END.start + 4, END.start + 46],
];

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const blur = BLUR_RANGES.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      {blur ? (
        <CameraMotionBlur shutterAngle={180} samples={6}>
          <FilmFrame />
        </CameraMotionBlur>
      ) : (
        <FilmFrame />
      )}
      <TimeLabel />
    </AbsoluteFill>
  );
};
