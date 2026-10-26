import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { SERIF, WHITE } from "../constants";
import { Card } from "../episode";

const WORD_STAGGER = 3;
const REVEAL = 12;
const EXIT_FRAMES = 8;
// Far enough along that every word has fully revealed.
const LANDED = 90;

// "*word*" renders in italic for quiet emphasis.
const parseWords = (text: string) =>
  text.split(" ").map((w) => ({
    word: w.replace(/\*/g, ""),
    italic: w.startsWith("*"),
  }));

const Word: React.FC<{ word: string; italic: boolean; frame: number }> = ({
  word,
  italic,
  frame,
}) => {
  const t = interpolate(frame, [0, REVEAL], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span
      style={{
        display: "inline-block",
        opacity: t,
        filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined,
        transform: `translateY(${(1 - t) * 14}px)`,
        fontStyle: italic ? "italic" : "normal",
        marginRight: "0.26em",
      }}
    >
      {word}
    </span>
  );
};

const HERO_REVEAL = 16;
// Fit long hero lines to the frame: Cormorant italic averages ~0.45em a glyph.
const heroSize = (text: string) =>
  Math.min(172, Math.floor(820 / (text.length * 0.45)));
const RULE_DELAY = 8;
const RULE_DRAW = 14;

// Large italic line rising out of a mask, letter-spacing settling as it lands,
// with a hairline rule drawing in underneath.
const Hero: React.FC<{ text: string; frame: number }> = ({ text, frame }) => {
  const t = interpolate(frame, [0, HERO_REVEAL], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });
  const rule = interpolate(
    frame,
    [RULE_DELAY, RULE_DELAY + RULE_DRAW],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          overflow: "hidden",
          padding: "0.05em 0.15em 0.28em",
          marginBottom: "-0.2em",
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: heroSize(text),
            lineHeight: 1.02,
            color: WHITE,
            whiteSpace: "nowrap",
            letterSpacing: `${interpolate(t, [0, 1], [0.12, -0.01])}em`,
            transform: `translateY(${(1 - t) * 105}%)`,
            textShadow: "0 4px 40px rgba(0,0,0,0.85)",
          }}
        >
          {text.replace(/\*/g, "")}
        </div>
      </div>
      <div
        style={{
          width: 260 * rule,
          height: 2,
          marginTop: 34,
          background: WHITE,
          opacity: 0.85,
        }}
      />
    </div>
  );
};

// Small centred serif lines; each word fades up out of a soft blur.
export const Caption: React.FC<{
  card: Card;
  toFrames: (beats: number) => number;
}> = ({ card, toFrames }) => {
  const frame = useCurrentFrame();
  const total = toFrames(card.length);
  const hasHero = card.lines.some((l) => l.hero);
  const out = card.hold
    ? 0
    : interpolate(frame, [total - EXIT_FRAMES, total], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 8}px)` : undefined,
      }}
    >
      {/* Soft dark pool behind the words so they read over bright shots. */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)",
        }}
      />
      {card.lines.map((line) => {
        const lineFrame =
          card.instant && line.at === 0
            ? frame + LANDED
            : frame - toFrames(line.at);
        if (line.hero) {
          return <Hero key={line.text} text={line.text} frame={lineFrame} />;
        }
        return (
          <div
            key={line.text}
            style={{
              position: "relative",
              fontFamily: SERIF,
              fontWeight: 500,
              // Next to a hero line the other lines become a small kicker.
              fontSize: hasHero ? 58 : 76,
              letterSpacing: hasHero ? "0.04em" : undefined,
              lineHeight: 1.25,
              color: WHITE,
              textAlign: "center",
              maxWidth: 860,
              marginRight: "-0.26em",
              textShadow: "0 2px 24px rgba(0,0,0,0.9)",
            }}
          >
            {parseWords(line.text).map((w, i) => (
              <Word
                key={i}
                word={w.word}
                italic={w.italic}
                frame={lineFrame - i * WORD_STAGGER}
              />
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
