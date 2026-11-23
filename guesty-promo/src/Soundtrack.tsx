import React, { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, interpolate, Sequence } from "remotion";
import { Audio } from "@remotion/media";
import { ensureFont } from "./brand";
import { musicSrc, sfxSrc } from "./assets";
import { Cue, MUSIC_VOLUME } from "./sfx";
import { FPS, TOTAL } from "./timing";

/** Blocks rendering until the embedded Figtree font is ready. */
export const useBrandFont = () => {
  const [handle] = useState(() => delayRender("Loading Figtree"));
  useEffect(() => {
    ensureFont()
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [handle]);
};

/** Music bed (0.5 s fade-in, 1 s fade-out) + frame-accurate SFX cues. */
export const Soundtrack: React.FC<{ cues: readonly Cue[] }> = ({ cues }) => {
  const music = musicSrc();
  return (
    <>
      {music ? (
        <Audio
          src={music}
          volume={(f) =>
            MUSIC_VOLUME *
            interpolate(f, [0, 0.5 * FPS, TOTAL - 1 * FPS, TOTAL], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      ) : null}
      {cues.map((cue, i) => {
        const src = sfxSrc(cue.sound);
        return src ? (
          <Sequence key={i} from={cue.frame} durationInFrames={Math.min(75, TOTAL - cue.frame)} name={`sfx ${cue.sound}`}>
            <Audio src={src} volume={cue.volume} />
          </Sequence>
        ) : null;
      })}
    </>
  );
};
