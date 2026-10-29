import React from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import available from "../clips.json";
import { Cut } from "../episode";
import { Backdrop } from "./Backdrop";

const AVAILABLE = new Set<string>(available);
const GRADE = "grayscale(1) contrast(1.2) brightness(1.05)";
const ZOOM_IN = 7;
const ZOOM_OUT = 4;
const INSET_SCALE = 0.56;
const INSET_EXPAND = 12;
const PANEL_GAP = 12;
const PANEL_STAGGER = 2;
const PANEL_SLIDE = 9;
// Frames the previous shot keeps playing underneath a dissolve.
export const DISSOLVE_FRAMES = 10;

const Clip: React.FC<{ clip: string; trimSeconds?: number; rate?: number }> = ({
  clip,
  trimSeconds,
  rate,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Video
      src={staticFile(`clips/${clip}.mp4`)}
      muted
      loop
      objectFit="cover"
      playbackRate={rate ?? 1}
      trimBefore={Math.round((trimSeconds ?? 0) * fps)}
      style={{ width: "100%", height: "100%", filter: GRADE }}
    />
  );
};

// Three vertical strips of different clips sliding in, alternating up/down.
const Panels: React.FC<{ panels: NonNullable<Cut["panels"]> }> = ({
  panels,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const w = (width - PANEL_GAP * (panels.length - 1)) / panels.length;
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {panels.map((p, i) => {
        const t = interpolate(
          frame - i * PANEL_STAGGER,
          [0, PANEL_SLIDE],
          [1, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.exp),
          },
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: i * (w + PANEL_GAP),
              width: w,
              height,
              overflow: "hidden",
              transform: `translateY(${(i % 2 ? -1 : 1) * t * height}px)`,
            }}
          >
            {AVAILABLE.has(p.clip) ? (
              <Clip clip={p.clip} trimSeconds={p.trimSeconds} />
            ) : (
              <Backdrop kind="speed" />
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Shot: React.FC<{
  cut: Cut;
  length: number;
  beatFrames: (beats: number) => number;
  exitZoom?: boolean; // the next shot zooms in, so this one zooms out
}> = ({ cut, length, beatFrames, exitZoom }) => {
  const frame = useCurrentFrame();
  // Slow push-in across the shot, like a dolly creeping toward the subject.
  const [pushFrom, pushTo] = cut.push ?? [1.04, 1.14];
  let scale = interpolate(frame, [0, length], [pushFrom, pushTo]);
  let blur = 0;

  if (cut.entry === "zoom") {
    const t = interpolate(frame, [0, ZOOM_IN], [1, 0], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    scale *= 1 + 0.35 * t;
    blur += 16 * t;
  }
  if (exitZoom) {
    const t = interpolate(frame, [length - ZOOM_OUT, length], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
    scale *= 1 + 0.25 * t;
    blur += 14 * t;
  }

  // Crossfades: this shot fades in over the previous one (which the
  // composition extends underneath), sharpening out of a soft blur.
  const dissolving = cut.entry === "dissolve" || cut.entry === "light";
  const fadeIn = dissolving
    ? interpolate(frame, [0, DISSOLVE_FRAMES], [0, 1], {
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      })
    : 1;
  if (dissolving) {
    blur += 12 * (1 - fadeIn);
    scale *= 1 + 0.04 * (1 - fadeIn);
  }
  const glow =
    cut.entry === "light"
      ? interpolate(frame, [0, 4, 16], [0.35, 0.7, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  let frameOpacity = 0;
  if (cut.entry === "inset") {
    const hold = beatFrames(cut.insetBeats ?? 2);
    const e = interpolate(frame, [hold, hold + INSET_EXPAND], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const appear = interpolate(frame, [0, 8], [0.92, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    scale *= interpolate(e, [0, 1], [INSET_SCALE * appear, 1]);
    frameOpacity = 1 - e;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dissolving ? undefined : "black",
        opacity: fadeIn,
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
          overflow: "hidden",
        }}
      >
        {cut.panels ? (
          <Panels panels={cut.panels} />
        ) : AVAILABLE.has(cut.clip) ? (
          <Clip clip={cut.clip} trimSeconds={cut.trimSeconds} rate={cut.rate} />
        ) : (
          <Backdrop kind={cut.backdrop} />
        )}
        {cut.overlay && <Backdrop kind={cut.overlay} transparent />}
        {frameOpacity > 0 && (
          <AbsoluteFill
            style={{
              border: `${3 / scale}px solid rgba(255,255,255,${0.85 * frameOpacity})`,
            }}
          />
        )}
      </AbsoluteFill>
      {glow > 0 && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(255,250,240,1), rgba(255,250,240,0.6) 45%, rgba(255,250,240,0.2) 80%)",
            opacity: glow,
            mixBlendMode: "screen",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
