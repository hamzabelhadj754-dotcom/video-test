import { FPS } from "./constants";

export type BackdropKind =
  | "smoke"
  | "spotlight"
  | "rain"
  | "speed"
  | "dust"
  | "void";

// Everything in an episode is written in beats so cuts land on the song's tempo.
export type Cut = {
  // File in public/clips/ without .mp4. When it hasn't been added yet, the
  // procedural `backdrop` renders instead so the edit still plays.
  clip: string;
  backdrop: BackdropKind;
  from: number;
  length: number;
  trimSeconds?: number;
  push?: [number, number];
  rate?: number; // playback speed, e.g. 0.6 for slow motion
  overlay?: BackdropKind; // procedural layer over the footage (dust, rain…)
  // How the shot arrives: hard cut (default), zoom-through with motion blur,
  // or "inset": starts as a small framed window on black, expands on a beat.
  entry?: "cut" | "zoom" | "inset";
  insetBeats?: number; // beats the inset stays small before expanding
  // Split screen: vertical panels of other clips slide in on the beat.
  panels?: { clip: string; trimSeconds?: number }[];
};

// `text` may wrap words in *asterisks* to set them in italic. A `hero` line
// is set large in italic and revealed from behind a mask.
export type Line = {
  text: string;
  at: number;
  hero?: boolean;
  // Per-word start times (beats, relative to `at`) so each word appears as it
  // is spoken in a speech edit; otherwise words stagger by a few frames.
  words?: number[];
};

export type Card = {
  from: number;
  length: number;
  lines: Line[];
  instant?: boolean; // lines at beat 0 are fully shown on the first frame (the hook)
  hold?: boolean; // no exit animation (the loop point)
  numeral?: string; // huge outline number behind the text (educational lists)
};

export type Episode = {
  id: string;
  number: number;
  series: string;
  bpm: number;
  offsetSeconds?: number; // where beat 0 falls in the song
  lengthBeats: number;
  durationSeconds?: number; // fixed length, e.g. to match the song exactly
  audio?: string; // song in public/, only played by the "-Music" composition
  accents?: number[]; // bass hits (beats): flash + shake + zoom punch
  streaks?: boolean; // anamorphic light streak on every accent
  burns?: number[]; // film-burn light sweeps (beats), e.g. at section changes
  clock?: { at: number; label: string }[]; // small timestamp that ticks on
  cuts: Cut[];
  cards: Card[];
};

export type Hit = { frame: number; strength: number };

export const framesPerBeat = (ep: Pick<Episode, "bpm">) => (FPS * 60) / ep.bpm;
// Relative length in frames (no song offset).
export const beatFrames = (ep: Episode, beats: number) =>
  Math.round(beats * framesPerBeat(ep));
// Absolute frame of a beat on the song's timeline.
export const atFrame = (ep: Episode, beat: number) =>
  Math.max(
    0,
    Math.round((ep.offsetSeconds ?? 0) * FPS + beat * framesPerBeat(ep)),
  );
export const spanFrames = (ep: Episode, from: number, length: number) =>
  atFrame(ep, from + length) - atFrame(ep, from);
export const durationOf = (ep: Episode) =>
  ep.durationSeconds
    ? Math.round(ep.durationSeconds * FPS)
    : atFrame(ep, ep.lengthBeats);

// Rapid-fire cuts (default 2 frames each) cycling through clips, for drum rolls.
export const strobe = (
  ep: Pick<Episode, "bpm">,
  clips: Pick<Cut, "clip" | "backdrop" | "trimSeconds">[],
  from: number,
  to: number,
  frames = 2,
): Cut[] => {
  const step = frames / framesPerBeat(ep);
  const cuts: Cut[] = [];
  for (let b = from, i = 0; b < to - 1e-6; b += step, i++) {
    cuts.push({
      ...clips[i % clips.length],
      from: b,
      length: Math.min(step, to - b),
      push: [1.1, 1.12],
    });
  }
  return cuts;
};

// Frames where the camera nudges: bass accents hit hardest, full cuts lightly.
// Frame 0 is excluded so the first frame stays identical to the loop's last.
export const hitsOf = (ep: Episode): Hit[] =>
  [
    ...ep.cuts
      .filter((c) => c.length >= 1)
      .map((c) => ({ frame: atFrame(ep, c.from), strength: 0.4 })),
    ...(ep.accents ?? []).map((b) => ({ frame: atFrame(ep, b), strength: 1 })),
  ].filter((h) => h.frame > 0);
