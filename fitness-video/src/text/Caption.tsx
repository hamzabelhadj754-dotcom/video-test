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

// Small centred serif lines; each word fades up out of a soft blur.
export const Caption: React.FC<{
  card: Card;
  toFrames: (beats: number) => number;
}> = ({ card, toFrames }) => {
  const frame = useCurrentFrame();
  const total = toFrames(card.length);
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
        return (
          <div
            key={line.text}
            style={{
              position: "relative",
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 76,
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
