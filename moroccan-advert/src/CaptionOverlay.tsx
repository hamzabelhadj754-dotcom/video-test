import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { ARABIC_FONT } from "./arabicFont";

type Token = { text: string; fromMs: number; toMs: number };
type Group = { tokens: Token[]; startMs: number; endMs: number };

// Correct Moroccan Darija transcript — no guessed CTA
const GROUPS: Group[] = [
  {
    startMs: 0,
    endMs: 2000,
    tokens: [
      { text: "الراحة",   fromMs: 0,    toMs: 450  },
      { text: "والأناقة", fromMs: 450,  toMs: 950  },
      { text: "في",       fromMs: 950,  toMs: 1100 },
      { text: "قلب",      fromMs: 1100, toMs: 1450 },
      { text: "دارك",     fromMs: 1450, toMs: 2000 },
    ],
  },
  {
    startMs: 2100,
    endMs: 4400,
    tokens: [
      { text: "صالون",   fromMs: 2100, toMs: 2460 },
      { text: "مخدوم",   fromMs: 2460, toMs: 2820 },
      { text: "باش",     fromMs: 2820, toMs: 3020 },
      { text: "يعطيك",   fromMs: 3020, toMs: 3400 },
      { text: "لمسة",    fromMs: 3400, toMs: 3700 },
      { text: "عصرية",   fromMs: 3700, toMs: 4000 },
      { text: "وراقية",  fromMs: 4000, toMs: 4400 },
    ],
  },
  {
    startMs: 4500,
    endMs: 5220,
    tokens: [
      { text: "كتحمر", fromMs: 4500, toMs: 4860 },
      { text: "لوجه",  fromMs: 4860, toMs: 5220 },
    ],
  },
  {
    startMs: 5340,
    endMs: 6820,
    tokens: [
      { text: "و",          fromMs: 5340, toMs: 5500 },
      { text: "بالجودة",    fromMs: 5500, toMs: 5900 },
      { text: "لي",         fromMs: 5900, toMs: 6100 },
      { text: "كتستاهله",   fromMs: 6100, toMs: 6820 },
    ],
  },
];

const ACTIVE_BG = "#FFD000";
const ACTIVE_FG = "#140C00";

const Word: React.FC<{ token: Token; absoluteTimeMs: number }> = ({ token, absoluteTimeMs }) => {
  const isActive = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
  return (
    <span
      style={{
        fontFamily: ARABIC_FONT,
        fontSize: 64,
        fontWeight: 900,
        lineHeight: 1.5,
        display: "inline-block",
        background: isActive ? ACTIVE_BG : "transparent",
        color: isActive ? ACTIVE_FG : "#FFFFFF",
        borderRadius: isActive ? 12 : 0,
        paddingLeft: isActive ? 14 : 0,
        paddingRight: isActive ? 14 : 0,
        paddingTop: isActive ? 4 : 0,
        paddingBottom: isActive ? 4 : 0,
        textShadow: isActive
          ? "none"
          : "0 2px 12px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,0.95)",
      }}
    >
      {token.text}
    </span>
  );
};

const CaptionPage: React.FC<{ group: Group }> = ({ group }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const absoluteTimeMs = group.startMs + (frame / fps) * 1000;

  const s = spring({ fps, frame, config: { damping: 22, stiffness: 270, mass: 0.5 }, from: 0, to: 1 });
  const translateY = interpolate(s, [0, 1], [38, 0]);
  const scale = interpolate(s, [0, 1], [0.91, 1]);

  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${translateY}px) scale(${scale})`,
        direction: "rtl",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        paddingLeft: 32,
        paddingRight: 32,
      }}
    >
      {group.tokens.map((t, i) => (
        <Word key={i} token={t} absoluteTimeMs={absoluteTimeMs} />
      ))}
    </div>
  );
};

export const CaptionOverlay: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Anchor caption block to 52% height (below face, center of frame) */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
        }}
      >
        {GROUPS.map((group, i) => {
          const startFrame = Math.floor((group.startMs / 1000) * fps);
          const endFrame = Math.ceil((group.endMs / 1000) * fps);
          return (
            <Sequence
              key={i}
              from={startFrame}
              durationInFrames={endFrame - startFrame}
              layout="none"
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CaptionPage group={group} />
              </div>
            </Sequence>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
