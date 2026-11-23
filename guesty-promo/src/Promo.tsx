import React, { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, Freeze, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { colors, ensureFont, fontFamily } from "./brand";
import { musicSrc, popSrc, whooshSrc } from "./assets";
import { Format, LayoutProvider } from "./layout";
import { FPS, SCENES, TOTAL, TRANSITION_OVERLAP } from "./timing";
import { Scene01 } from "./scenes/Scene01";
import { Scene02 } from "./scenes/Scene02";
import { Scene03 } from "./scenes/Scene03";
import { Scene04 } from "./scenes/Scene04";
import { Scene05 } from "./scenes/Scene05";
import { Scene06 } from "./scenes/Scene06";
import { Scene07 } from "./scenes/Scene07";
import { Scene08 } from "./scenes/Scene08";
import { Scene09 } from "./scenes/Scene09";
import { Scene10 } from "./scenes/Scene10";
import { Scene11 } from "./scenes/Scene11";
import { Scene12 } from "./scenes/Scene12";
import { Scene13 } from "./scenes/Scene13";
import { Scene14 } from "./scenes/Scene14";
import { Scene15 } from "./scenes/Scene15";
import { Scene16 } from "./scenes/Scene16";

const SCENE_COMPONENTS: React.FC[] = [
  Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08,
  Scene09, Scene10, Scene11, Scene12, Scene13, Scene14, Scene15, Scene16,
];

/** Scenes that open with a wipe (whoosh) vs. a pop. */
const WHOOSH_SCENES = [4, 6, 8, 9, 10, 11, 12, 15, 16];
const POP_SCENES = [1, 2, 5, 13, 14];

/** After its last frame, a scene stays frozen underneath the next scene's wipe. */
const FreezeAfter: React.FC<{ last: number; children: React.ReactNode }> = ({ last, children }) => {
  const frame = useCurrentFrame();
  return (
    <Freeze frame={last} active={frame > last}>
      {children}
    </Freeze>
  );
};

const Soundtrack: React.FC = () => {
  const music = musicSrc();
  const whoosh = whooshSrc();
  const pop = popSrc();
  return (
    <>
      {music ? (
        <Audio
          src={music}
          volume={(f) =>
            interpolate(f, [0, 0.5 * FPS, TOTAL - 1 * FPS, TOTAL], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      ) : null}
      {whoosh
        ? WHOOSH_SCENES.map((id) => (
            <Sequence key={`w${id}`} from={Math.max(0, SCENES[id - 1].start - 3)} durationInFrames={30}>
              <Audio src={whoosh} volume={0.45} />
            </Sequence>
          ))
        : null}
      {pop
        ? POP_SCENES.map((id) => (
            <Sequence key={`p${id}`} from={SCENES[id - 1].start} durationInFrames={20}>
              <Audio src={pop} volume={0.4} />
            </Sequence>
          ))
        : null}
    </>
  );
};

export type PromoProps = { format: Format };

const useBrandFont = () => {
  const [handle] = useState(() => delayRender("Loading Figtree"));
  useEffect(() => {
    ensureFont()
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [handle]);
};

export const Promo: React.FC<PromoProps> = ({ format }) => {
  useBrandFont();
  return (
  <LayoutProvider format={format}>
    <AbsoluteFill style={{ background: colors.forest, fontFamily }}>
      {SCENES.map((s, i) => {
        const Scene = SCENE_COMPONENTS[i];
        const isLast = i === SCENES.length - 1;
        return (
          <Sequence
            key={s.id}
            name={`Scene ${String(s.id).padStart(2, "0")}`}
            from={s.start}
            durationInFrames={s.duration + (isLast ? 0 : TRANSITION_OVERLAP)}
            premountFor={15}
          >
            <FreezeAfter last={s.duration - 1}>
              <Scene />
            </FreezeAfter>
          </Sequence>
        );
      })}
      <Soundtrack />
    </AbsoluteFill>
  </LayoutProvider>
  );
};
