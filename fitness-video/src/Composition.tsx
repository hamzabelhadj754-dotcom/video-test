import "./fonts";
import React from "react";
import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import available from "./clips.json";
import {
  atFrame,
  beatFrames,
  Cut,
  Episode,
  hitsOf,
  spanFrames,
} from "./episode";
import { Backdrop } from "./fx/Backdrop";
import {
  AccentFlash,
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
          playbackRate={cut.rate ?? 1}
          trimBefore={Math.round((cut.trimSeconds ?? 0) * fps)}
          style={{
            width: "100%",
            height: "100%",
            filter: "grayscale(1) contrast(1.2) brightness(1.05)",
          }}
        />
      ) : (
        <Backdrop kind={cut.backdrop} />
      )}
      {cut.overlay && <Backdrop kind={cut.overlay} transparent />}
    </AbsoluteFill>
  );
};

export const GainsDomLoop: React.FC<{
  episode: Episode;
  withAudio?: boolean;
}> = ({ episode, withAudio }) => {
  const frame = useCurrentFrame();
  const hits = hitsOf(episode);
  const cutFrames = episode.cuts
    .filter((c) => c.length >= 1)
    .map((c) => atFrame(episode, c.from));
  const glitch = glitchProgress(frame, cutFrames);
  // Zoom punch on every hit, on top of the shake.
  const punch = interpolate(framesSinceHit(frame, hits), [0, 6], [1.05, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {withAudio && episode.audio && <Audio src={staticFile(episode.audio)} />}
      <GhostSplitFilter offset={glitch * 26} />
      <AbsoluteFill
        style={{
          transform: `${shakeAt(frame, hits, 24)} scale(${punch})`,
          filter: glitch > 0 ? "url(#ghostsplit)" : undefined,
        }}
      >
        {episode.cuts.map((cut) => {
          const length = spanFrames(episode, cut.from, cut.length);
          return length > 0 ? (
            <Sequence
              key={`${cut.clip}-${cut.from}`}
              from={atFrame(episode, cut.from)}
              durationInFrames={length}
            >
              <Shot cut={cut} length={length} />
            </Sequence>
          ) : null;
        })}
      </AbsoluteFill>
      <Vignette />
      <AbsoluteFill style={{ transform: shakeAt(frame, hits, 14) }}>
        {episode.cards.map((card) => (
          <Sequence
            key={card.from}
            from={atFrame(episode, card.from)}
            durationInFrames={spanFrames(episode, card.from, card.length)}
          >
            <WordSlam
              card={card}
              toFrames={(b: number) => beatFrames(episode, b)}
            />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Wordmark series={episode.series} number={episode.number} />
      <AccentFlash
        frames={(episode.accents ?? []).map((b) => atFrame(episode, b))}
      />
      <Flicker />
      <Grain />
      <GlitchBars progress={glitch} />
      <Letterbox />
    </AbsoluteFill>
  );
};
