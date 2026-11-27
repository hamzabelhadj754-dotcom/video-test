import React from "react";
import { interpolate } from "remotion";
import { F, Theme, clamp, ease } from "./theme";

// ---------- Panel geometry (all UI lives in panel space, 1320 x 880) ----------
export const PANEL = { w: 1320, h: 880 };
export const COMPOSER = { w: 760, h: 112, attach: 78 };
export const COL = { x: 300, w: 720 }; // content column
export const composerCenterY = 440;
export const composerBottomY = (h: number) => PANEL.h - 30 - h / 2;

// ---------- Icons (drawn for this film, simple strokes) ----------
const Plus: React.FC<{ c: string }> = ({ c }) => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <path d="M10 4.2v11.6M4.2 10h11.6" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const Mic: React.FC<{ c: string }> = ({ c }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="7.2" y="2.6" width="5.6" height="9.4" rx="2.8" stroke={c} strokeWidth="1.5" />
    <path d="M4.6 9.6a5.4 5.4 0 0 0 10.8 0M10 15v2.6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
export const Wave: React.FC<{ c: string }> = ({ c }) => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    {[
      [4, 7, 11],
      [7.3, 4.5, 13.5],
      [10.6, 6, 12],
      [13.9, 7.5, 10.5],
    ].map(([x, y1, y2], i) => (
      <path key={i} d={`M${x} ${y1}V${y2}`} stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    ))}
  </svg>
);
const Arrow: React.FC<{ c: string }> = ({ c }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 14.2V4.2M4.8 8.2 9 4l4.2 4.2" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------- Caret ----------
export const Caret: React.FC<{ theme: Theme; on: boolean; h?: number }> = ({ theme, on, h = 24 }) => (
  <span
    style={{
      display: "inline-block",
      width: 2,
      height: h,
      marginLeft: 1,
      marginRight: -3,
      verticalAlign: -5,
      borderRadius: 1,
      background: theme.text,
      opacity: on ? 1 : 0,
    }}
  />
);

export const caretVisible = (frame: number, lastKey: number) => {
  if (frame - lastKey < 10) return true; // solid while typing
  return Math.floor(frame / 15) % 2 === 0;
};

// ---------- Composer ----------
export const Composer: React.FC<{
  theme: Theme;
  text: string;
  caret: boolean;
  placeholder?: string;
  attachment?: React.ReactNode;
  press?: number; // 0..1 send-button press
  hover?: number; // 0..1 drag-over highlight
  placeholderStyle?: React.CSSProperties;
  showCaret?: boolean;
  attachH?: number;
  buttonOpacity?: number;
}> = ({ theme, text, caret, placeholder = "Ask anything", attachment, press = 0, hover = 0, placeholderStyle, showCaret = true, attachH = COMPOSER.attach, buttonOpacity = 1 }) => {
  const has = text.length > 0;
  const pressScale = 1 - 0.1 * press;
  return (
    <div
      style={{
        width: COMPOSER.w,
        borderRadius: 28,
        background: theme.composer,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.dark
          ? "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.35)"
          : `0 1px 2px rgba(20,16,10,0.05), 0 10px 32px rgba(20,16,10,${0.07 + hover * 0.06})`,
        outline: hover > 0 ? `2px solid rgba(13,13,13,${0.18 * hover})` : "none",
        outlineOffset: 3,
        padding: "16px 14px 12px 14px",
        boxSizing: "border-box",
        fontFamily: F.sans,
      }}
    >
      {attachment && attachH > 0.5 ? <div style={{ height: attachH, paddingLeft: 6, overflow: "hidden" }}>{attachment}</div> : null}
      <div
        style={{
          minHeight: 30,
          padding: "0 10px",
          fontSize: 19,
          lineHeight: "30px",
          letterSpacing: "-0.005em",
          color: has ? theme.text : theme.sub,
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }}
      >
        {has ? (
          <>
            {text}
            {showCaret ? <Caret theme={theme} on={caret} /> : null}
          </>
        ) : (
          <>
            {showCaret ? <Caret theme={theme} on={caret} /> : null}
            <span style={{ display: "inline-block", marginLeft: 4, ...placeholderStyle }}>{placeholder}</span>
          </>
        )}
      </div>
      <div style={{ height: 40, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Plus c={theme.text} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mic c={theme.text} />
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: theme.btn,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${pressScale})`,
              opacity: buttonOpacity,
            }}
          >
            {has ? <Arrow c={theme.btnIcon} /> : <Wave c={theme.btnIcon} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Top bar ----------
export const TopBar: React.FC<{ theme: Theme }> = ({ theme }) => (
  <div
    style={{
      position: "absolute",
      left: 26,
      top: 20,
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: F.sans,
      fontWeight: 500,
      fontSize: 18,
      letterSpacing: "-0.01em",
      color: theme.text,
    }}
  >
    ChatGPT
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.55 }}>
      <path d="M3.5 5.5 7 9l3.5-3.5" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// ---------- Messages ----------
export const UserBubble: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => (
  <div
    style={{
      maxWidth: 520,
      marginLeft: "auto",
      background: theme.bubble,
      color: theme.text,
      borderRadius: 22,
      padding: "11px 20px",
      fontFamily: F.sans,
      fontSize: 18,
      lineHeight: "28px",
      letterSpacing: "-0.005em",
    }}
  >
    {children}
  </div>
);

// Streams words in with a short opacity ramp. Layout is fixed from frame 0, so nothing reflows.
export const streamWords = (
  text: string,
  first: number, // index of first word in the global stream
  start: number,
  frame: number,
  rate: number,
  style?: React.CSSProperties,
) => {
  const words = text.split(" ");
  const nodes = words.map((w, i) => {
    const t = start + (first + i) * rate;
    const o = interpolate(frame, [t, t + 5], [0, 1], { ...clamp, easing: ease.out });
    return (
      <span key={i} style={{ opacity: o, ...style }}>
        {w}
        {i < words.length - 1 ? " " : ""}
      </span>
    );
  });
  return { nodes, count: words.length };
};

export const answerStyle = (theme: Theme): React.CSSProperties => ({
  fontFamily: F.sans,
  fontSize: 18,
  lineHeight: "30px",
  letterSpacing: "-0.005em",
  color: theme.text,
});
