import { random } from "remotion";
import { Hit } from "./episode";

const SHAKE_FRAMES = 8;

// Decaying random camera offset after every hit on the beat grid.
export const shakeAt = (frame: number, hits: Hit[], amplitude: number) => {
  let x = 0;
  let y = 0;
  let rot = 0;
  for (const hit of hits) {
    const d = frame - hit.frame;
    if (d < 0 || d >= SHAKE_FRAMES) {
      continue;
    }
    const decay = hit.strength * (1 - d / SHAKE_FRAMES) ** 2;
    x += (random(`x-${hit.frame}-${frame}`) * 2 - 1) * amplitude * decay;
    y += (random(`y-${hit.frame}-${frame}`) * 2 - 1) * amplitude * decay;
    rot += (random(`r-${hit.frame}-${frame}`) * 2 - 1) * 0.6 * decay;
  }
  return `translate(${x}px, ${y}px) rotate(${rot}deg)`;
};

// Frames since the most recent hit, for effects that react to the beat.
export const framesSinceHit = (frame: number, hits: Hit[]) => {
  let best = Infinity;
  for (const hit of hits) {
    const d = frame - hit.frame;
    if (d >= 0 && d < best) {
      best = d;
    }
  }
  return best;
};
