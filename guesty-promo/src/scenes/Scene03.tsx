import React from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import { colors } from "../brand";
import { ease, lerp } from "../anim";
import { COPY } from "../copy";
import { Headline } from "../components/Headline";
import { SceneShell } from "../components/Stage";
import { useLayout } from "../layout";
import { SCENE, TRANSITION } from "../timing";
import { Scene02 } from "./Scene02";

/** The chaos freezes, desaturates and blurs behind the question. */
export const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const p = ease(frame, 0, TRANSITION);
  return (
    <SceneShell bg={colors.forest}>
      <AbsoluteFill
        style={{
          filter: `blur(${p * 18}px) grayscale(${p * 0.9}) brightness(${lerp(p, 1, 0.55)})`,
          transform: `scale(${1 + p * 0.05})`,
        }}
      >
        <Freeze frame={SCENE - 1}>
          <Scene02 />
        </Freeze>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(4,32,26,${p * 0.45})` }} />
      <Headline
        lines={COPY.s03.headline}
        tone="onDark"
        align="center"
        position="center"
        size={L.format === "9x16" ? 132 : 112}
        delay={2}
      />
    </SceneShell>
  );
};
