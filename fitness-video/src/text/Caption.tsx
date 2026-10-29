import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ROMAN, SANS, SERIF, WHITE } from "../constants";
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
            textShadow:
              "0 4px 40px rgba(0,0,0,0.85), 0 0 28px rgba(255,255,255,0.18)",
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

const READ_FADE = 8;
const READ_LIGHT = 5;
const READ_DIM = 0.3;

// Read-along line: the whole sentence sits faintly in light sans caps and each
// word lights up the moment it is spoken, so the eye follows the voice.
const ReadLine: React.FC<{ text: string; frame: number; starts: number[] }> = ({
  text,
  frame,
  starts,
}) => {
  const appear = interpolate(frame, [-READ_FADE, 0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "relative",
        fontFamily: SANS,
        fontWeight: 300,
        fontSize: 42,
        letterSpacing: "0.28em",
        lineHeight: 1.7,
        textTransform: "uppercase",
        color: WHITE,
        textAlign: "center",
        maxWidth: 900,
        marginRight: "-0.28em",
        opacity: appear,
        margin: "10px 0",
      }}
    >
      {parseWords(text).map((w, i) => {
        const lit = interpolate(
          frame - (starts[i] ?? 0),
          [0, READ_LIGHT],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.5em",
              opacity: READ_DIM + (1 - READ_DIM) * lit,
              textShadow:
                lit > 0
                  ? `0 2px 20px rgba(0,0,0,0.9), 0 0 ${18 * lit}px rgba(255,255,255,${0.35 * lit})`
                  : "0 2px 20px rgba(0,0,0,0.9)",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

const POWER_LETTER_STAGGER = 1.5;
const POWER_LETTER_IN = 9;
const POWER_TRACK = 22;
const POWER_LINE_DELAY = 6;
const POWER_LINE_DRAW = 16;
// Cinzel capitals with tracking run about 0.95em a glyph once settled.
const powerSize = (text: string) =>
  Math.min(150, Math.floor(900 / (text.length * 0.95)));

// Huge Roman capitals revealed letter by letter, tracking closing in, with
// hairlines drawing out above and below.
const PowerWord: React.FC<{ text: string; frame: number }> = ({
  text,
  frame,
}) => {
  const track = interpolate(frame, [0, POWER_TRACK], [0.7, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const line = interpolate(
    frame,
    [POWER_LINE_DELAY, POWER_LINE_DELAY + POWER_LINE_DRAW],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const hairline: React.CSSProperties = {
    width: 420 * line,
    height: 1.5,
    background: WHITE,
    opacity: 0.7,
  };
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 26,
      }}
    >
      <div style={hairline} />
      <div
        style={{
          fontFamily: ROMAN,
          fontWeight: 500,
          fontSize: powerSize(text),
          lineHeight: 1,
          letterSpacing: `${track}em`,
          marginRight: `-${track}em`,
          color: WHITE,
          whiteSpace: "nowrap",
          textShadow:
            "0 4px 40px rgba(0,0,0,0.85), 0 0 30px rgba(255,255,255,0.2)",
        }}
      >
        {text.split("").map((ch, i) => {
          const t = interpolate(
            frame - i * POWER_LETTER_STAGGER,
            [0, POWER_LETTER_IN],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            },
          );
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: t,
                filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined,
                whiteSpace: "pre",
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={hairline} />
    </div>
  );
};

const NUMERAL_IN = 18;

// Giant hairline-outline number drifting behind a list point.
const Numeral: React.FC<{ value: string; frame: number }> = ({
  value,
  frame,
}) => {
  const t = interpolate(frame, [0, NUMERAL_IN], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 180,
        fontFamily: SERIF,
        fontStyle: "italic",
        fontWeight: 500,
        fontSize: 760,
        lineHeight: 1,
        color: "transparent",
        WebkitTextStroke: "2px rgba(255,255,255,0.3)",
        opacity: t,
        transform: `translateY(${(1 - t) * 60 - frame * 0.4}px) scale(${1.12 - 0.12 * t})`,
      }}
    >
      {value}
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
            "radial-gradient(ellipse, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.4) 45%, transparent 72%)",
        }}
      />
      {card.numeral && <Numeral value={card.numeral} frame={frame} />}
      {card.lines.map((line) => {
        const lineFrame =
          card.instant && line.at === 0
            ? frame + LANDED
            : frame - toFrames(line.at);
        if (line.hero) {
          return <Hero key={line.text} text={line.text} frame={lineFrame} />;
        }
        if (line.style === "power") {
          return (
            <PowerWord key={line.text} text={line.text} frame={lineFrame} />
          );
        }
        if (line.style === "read") {
          const starts = parseWords(line.text).map((_, i) =>
            line.words ? toFrames(line.words[i] ?? 0) : i * WORD_STAGGER,
          );
          return (
            <ReadLine
              key={line.text}
              text={line.text}
              frame={lineFrame}
              starts={starts}
            />
          );
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
                frame={
                  lineFrame -
                  (line.words ? toFrames(line.words[i] ?? 0) : i * WORD_STAGGER)
                }
              />
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
