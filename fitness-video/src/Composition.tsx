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
  Vignette,
  Wordmark,
} from "./fx/Overlays";
import { Shot } from "./fx/Shot";
import { framesSinceHit, shakeAt } from "./shake";
import { Caption } from "./text/Caption";

export const GainsDomLoop: React.FC<{
  episode: Episode;
  withAudio?: boolean;
}> = ({ episode, withAudio }) => {
  const frame = useCurrentFrame();
  const hits = hitsOf(episode);
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
          const length = spanFrames(episode, cut.from, cut.length);
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
      <AccentFlash
        frames={(episode.accents ?? []).map((b) => atFrame(episode, b))}
      />
      <Flicker />
      <Grain />
      <Letterbox />
    </AbsoluteFill>
  );
};
