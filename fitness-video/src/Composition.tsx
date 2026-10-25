import "./fonts";
import React from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import available from "./clips.json";
import { Cut, Episode, hitsOf, toFrames } from "./episode";
import { Backdrop } from "./fx/Backdrop";
import {
  Flicker,
  GhostSplitFilter,
  glitchProgress,
  GlitchBars,
  Grain,
  Letterbox,
  Vignette,
  Wordmark,
} from "./fx/Overlays";
import { framesSinceHit, shakeAt } from "./shake";
import { WordSlam } from "./text/WordSlam";

const AVAILABLE = new Set<string>(available);

const Shot: React.FC<{ cut: Cut; length: number }> = ({ cut, length }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Slow push-in across the shot, like a dolly creeping toward the subject.
  const [pushFrom, pushTo] = cut.push ?? [1.04, 1.14];
  const push = interpolate(frame, [0, length], [pushFrom, pushTo]);
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      {AVAILABLE.has(cut.clip) ? (
        <Video
          src={staticFile(`clips/${cut.clip}.mp4`)}
          muted
          loop
          objectFit="cover"
          trimBefore={Math.round((cut.trimSeconds ?? 0) * fps)}
          style={{
            width: "100%",
            height: "100%",
            filter: "grayscale(1) contrast(1.3) brightness(0.75)",
          }}
        />
      ) : (
        <Backdrop kind={cut.backdrop} />
      )}
    </AbsoluteFill>
  );
};

export const GainsDomLoop: React.FC<{ episode: Episode }> = ({ episode }) => {
  const frame = useCurrentFrame();
  const beats = (b: number) => toFrames(episode, b);
  const hits = hitsOf(episode);
  const glitch = glitchProgress(
    frame,
    episode.cuts.map((c) => beats(c.from)),
  );
  // Small zoom punch on every hit, on top of the shake.
  const punch = interpolate(framesSinceHit(frame, hits), [0, 6], [1.04, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <GhostSplitFilter offset={glitch * 26} />
      <AbsoluteFill
        style={{
          transform: `${shakeAt(frame, hits, 22)} scale(${punch})`,
          filter: glitch > 0 ? "url(#ghostsplit)" : undefined,
        }}
      >
        {episode.cuts.map((cut) => (
          <Sequence
            key={`${cut.clip}-${cut.from}`}
            from={beats(cut.from)}
            durationInFrames={beats(cut.length)}
          >
            <Shot cut={cut} length={beats(cut.length)} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Vignette />
      <AbsoluteFill style={{ transform: shakeAt(frame, hits, 14) }}>
        {episode.cards.map((card) => (
          <Sequence
            key={card.from}
            from={beats(card.from)}
            durationInFrames={beats(card.length)}
          >
            <WordSlam card={card} toFrames={beats} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Wordmark series={episode.series} number={episode.number} />
      <Flicker />
      <Grain />
      <GlitchBars progress={glitch} />
      <Letterbox />
    </AbsoluteFill>
  );
};
