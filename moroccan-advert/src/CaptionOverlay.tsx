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

// Timestamps derived from actual audio silence analysis
const GROUPS: Group[] = [
  {
    startMs: 0,
    endMs: 1796,
    tokens: [
      { text: "الراحة",   fromMs: 0,    toMs: 450  },
      { text: "والأناقة", fromMs: 450,  toMs: 960  },
      { text: "في",       fromMs: 1041, toMs: 1243 },
      { text: "قلب",      fromMs: 1311, toMs: 1570 },
      { text: "دارك",     fromMs: 1570, toMs: 1796 },
    ],
  },
  {
    startMs: 2148,
    endMs: 4782,
    tokens: [
      { text: "صالون",  fromMs: 2148, toMs: 2900 },
      { text: "مخدوم",  fromMs: 2900, toMs: 3325 },
      { text: "باش",    fromMs: 3507, toMs: 3757 },
      { text: "يعطيك",  fromMs: 3808, toMs: 4782 },
    ],
  },
  {
    startMs: 4846,
    endMs: 6072,
    tokens: [
      { text: "لمسة",   fromMs: 4846, toMs: 5233 },
      { text: "عصرية",  fromMs: 5300, toMs: 5550 },
      { text: "وراقية", fromMs: 5550, toMs: 5820 },
      { text: "كتحمر",  fromMs: 5820, toMs: 5960 },
      { text: "لوجه",   fromMs: 5960, toMs: 6072 },
    ],
  },
  {
    startMs: 6441,
    endMs: 7790,
    tokens: [
      { text: "و",          fromMs: 6441, toMs: 6580 },
      { text: "بالجودة",    fromMs: 6580, toMs: 7064 },
      { text: "لي",         fromMs: 7116, toMs: 7337 },
      { text: "كتستاهله",   fromMs: 7391, toMs: 7790 },
    ],
  },
];

const ACTIVE_BG = "#FFD000";
const ACTIVE_FG = "#140C00";

const Word: React.FC<{ token: Token; absoluteTimeMs: number }> = ({
  token,
  absoluteTimeMs,
}) => {
  const isActive =
    token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;

  return (
    <span
      style={{
        fontFamily: ARABIC_FONT,
        fontSize: 62,
        fontWeight: 900,
        lineHeight: 1.6,
        display: "inline-block",
        background: isActive ? ACTIVE_BG : "transparent",
        color: isActive ? ACTIVE_FG : "#FFFFFF",
        borderRadius: isActive ? 12 : 0,
        paddingLeft: isActive ? 14 : 2,
        paddingRight: isActive ? 14 : 2,
        paddingTop: isActive ? 4 : 0,
        paddingBottom: isActive ? 4 : 0,
        // Strong outline so text is readable over any video frame
        textShadow: isActive
          ? "none"
          : "0 0 8px rgba(0,0,0,1), 0 0 16px rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.8), -2px -2px 0 rgba(0,0,0,0.8)",
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

  const s = spring({
    fps,
    frame,
    config: { damping: 20, stiffness: 260, mass: 0.5 },
    from: 0,
    to: 1,
  });

  const translateY = interpolate(s, [0, 1], [30, 0]);
  const scale = interpolate(s, [0, 1], [0.93, 1]);

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
        paddingLeft: 28,
        paddingRight: 28,
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
      <div
        style={{
          position: "absolute",
          top: "50%",
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
