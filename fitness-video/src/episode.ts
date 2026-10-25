import { FPS } from "./constants";

export type BackdropKind =
  | "smoke"
  | "spotlight"
  | "rain"
  | "speed"
  | "dust"
  | "void";
export type LineStyle = "solid" | "inverted" | "outline";

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
};

export type Line = { text: string; at: number; style?: LineStyle };

export type Card = {
  from: number;
  length: number;
  lines: Line[];
  instant?: boolean; // fully landed on its first frame (the hook)
  hold?: boolean; // no exit animation (the loop point)
};

export type Episode = {
  id: string;
  number: number;
  series: string;
  bpm: number;
  lengthBeats: number;
  cuts: Cut[];
  cards: Card[];
};

export type Hit = { frame: number; strength: number };

export const framesPerBeat = (ep: Episode) => (FPS * 60) / ep.bpm;
export const toFrames = (ep: Episode, beats: number) =>
  Math.round(beats * framesPerBeat(ep));
export const durationOf = (ep: Episode) => toFrames(ep, ep.lengthBeats);

// Frames where the camera shakes: text slams hit hard, cuts nudge. Frame 0 is
// excluded so the first frame stays identical to the loop's last frame.
export const hitsOf = (ep: Episode): Hit[] =>
  [
    ...ep.cuts.map((c) => ({ frame: toFrames(ep, c.from), strength: 0.5 })),
    ...ep.cards.flatMap((card) =>
      card.instant
        ? []
        : card.lines.map((l) => ({
            frame: toFrames(ep, card.from + l.at),
            strength: 1,
          })),
    ),
  ].filter((h) => h.frame > 0);
