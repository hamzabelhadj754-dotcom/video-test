import React from "react";
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame } from "remotion";
import { colors, fontFamily } from "./brand";
import { buildCues } from "./sfx";
import { Soundtrack, useBrandFont } from "./Soundtrack";
import { Format, LayoutProvider } from "./layout";
import { SCENES, TRANSITION_OVERLAP } from "./timing";
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

const CLASSIC_CUES = buildCues("classic");

const SCENE_COMPONENTS: React.FC[] = [
  Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08,
  Scene09, Scene10, Scene11, Scene12, Scene13, Scene14, Scene15, Scene16,
];

/** After its last frame, a scene stays frozen underneath the next scene's wipe. */
const FreezeAfter: React.FC<{ last: number; children: React.ReactNode }> = ({ last, children }) => {
  const frame = useCurrentFrame();
  return (
    <Freeze frame={last} active={frame > last}>
      {children}
    </Freeze>
  );
};

export type PromoProps = { format: Format };

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
      <Soundtrack cues={CLASSIC_CUES} />
    </AbsoluteFill>
  </LayoutProvider>
  );
};
