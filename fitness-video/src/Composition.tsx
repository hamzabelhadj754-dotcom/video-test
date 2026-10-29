import "./fonts";
import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { atFrame, beatFrames, Episode, hitsOf, spanFrames } from "./episode";
import { Clock, FilmBurns, LightStreaks } from "./fx/Light";
import {
  AccentFlash,
  Flicker,
  Grain,
  Letterbox,
  ProgressLine,
  Vignette,
  Wordmark,
} from "./fx/Overlays";
import { DISSOLVE_FRAMES, Shot } from "./fx/Shot";
import { framesSinceHit, shakeAt } from "./shake";
import { Caption } from "./text/Caption";

export const GainsDomLoop: React.FC<{
  episode: Episode;
  withAudio?: boolean;
}> = ({ episode, withAudio }) => {
  const frame = useCurrentFrame();
  // Calm episodes drop the camera shake and punch for a quieter, premium feel.
  const hits = episode.calm ? [] : hitsOf(episode);
  // Subtle zoom punch on every hit, on top of a light camera nudge.
  const punch = interpolate(framesSinceHit(frame, hits), [0, 8], [1.025, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {withAudio && episode.audio && <Audio src={staticFile(episode.audio)} />}
      <AbsoluteFill
        style={{
          transform: `${shakeAt(frame, hits, 9)} scale(${punch})`,
        }}
      >
        {episode.cuts.map((cut, i) => {
          const next = episode.cuts[i + 1];
          // Keep playing under the next shot while it dissolves in.
          const tail =
            next?.entry === "dissolve" || next?.entry === "light"
              ? DISSOLVE_FRAMES
              : 0;
          const length = spanFrames(episode, cut.from, cut.length) + tail;
          return length > 0 ? (
            <Sequence
              key={`${cut.clip}-${cut.from}`}
              from={atFrame(episode, cut.from)}
              durationInFrames={length}
            >
              <Shot
                cut={cut}
                length={length}
                beatFrames={(b: number) => beatFrames(episode, b)}
                exitZoom={episode.cuts[i + 1]?.entry === "zoom"}
              />
            </Sequence>
          ) : null;
        })}
      </AbsoluteFill>
      <Vignette />
      <AbsoluteFill>
        {episode.cards.map((card) => (
          <Sequence
            key={card.from}
            from={atFrame(episode, card.from)}
            durationInFrames={spanFrames(episode, card.from, card.length)}
          >
            <Caption
              card={card}
              toFrames={(b: number) => beatFrames(episode, b)}
            />
          </Sequence>
        ))}
      </AbsoluteFill>
      {episode.clock && (
        <Clock
          times={episode.clock.map((c) => ({
            frame: atFrame(episode, c.at),
            label: c.label,
          }))}
        />
      )}
      <Wordmark series={episode.series} number={episode.number} />
      {episode.streaks && (
        <LightStreaks
          frames={(episode.accents ?? []).map((b) => atFrame(episode, b))}
        />
      )}
      {episode.burns && (
        <FilmBurns frames={episode.burns.map((b) => atFrame(episode, b))} />
      )}
      {!episode.calm && (
        <AccentFlash
          frames={(episode.accents ?? []).map((b) => atFrame(episode, b))}
        />
      )}
      {!episode.calm && <Flicker />}
      <Grain />
      <Letterbox />
      {episode.progress && <ProgressLine />}
    </AbsoluteFill>
  );
};
