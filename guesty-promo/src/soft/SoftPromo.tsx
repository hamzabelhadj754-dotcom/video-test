import React from "react";
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame } from "remotion";
import { fontFamily } from "../brand";
import { ease } from "../anim";
import { UiThemeContext } from "../components/UI";
import { Format, LayoutProvider } from "../layout";
import { buildCues } from "../sfx";
import { Soundtrack, useBrandFont } from "../Soundtrack";
import { SCENES, TRANSITION_OVERLAP } from "../timing";
import { MeshBackground } from "./kit";
import * as S from "./scenes";

const SCENE_COMPONENTS: React.FC[] = [
  S.Soft01, S.Soft02, S.Soft03, S.Soft04, S.Soft05, S.Soft06, S.Soft07, S.Soft08,
  S.Soft09, S.Soft10, S.Soft11, S.Soft12, S.Soft13, S.Soft14, S.Soft15, S.Soft16,
];

/**
 * How each scene leaves. "blur": after its hold it stays frozen and blurs out while the next
 * scene blurs in (a 6-frame blur dissolve). "cut": removed instantly because the next scene
 * continues the same visual (2 → 3 re-renders it blurred, 5 → 6 → 7 share the hub).
 */
const EXIT: Record<number, "blur" | "cut"> = { 2: "cut", 5: "cut", 6: "cut" };
const EXIT_FRAMES = 6;

const SoftCues = buildCues("soft");

const SceneExit: React.FC<{ last: number; children: React.ReactNode }> = ({ last, children }) => {
  const frame = useCurrentFrame();
  const active = frame > last;
  const p = active ? ease(frame - last - 1, 0, EXIT_FRAMES) : 0;
  return (
    <AbsoluteFill
      style={active ? { opacity: 1 - p, filter: `blur(${p * 24}px)`, transform: `scale(${1 + p * 0.04})` } : undefined}
    >
      <Freeze frame={last} active={active}>
        {children}
      </Freeze>
    </AbsoluteFill>
  );
};

export const SoftPromo: React.FC<{ format: Format }> = ({ format }) => {
  useBrandFont();
  return (
    <LayoutProvider format={format}>
      <UiThemeContext.Provider value="glass">
        <AbsoluteFill style={{ fontFamily }}>
          <MeshBackground />
          {SCENES.map((s, i) => {
            const Scene = SCENE_COMPONENTS[i];
            const isLast = i === SCENES.length - 1;
            const overlap = isLast || EXIT[s.id] === "cut" ? 0 : TRANSITION_OVERLAP;
            return (
              <Sequence key={s.id} name={`Soft ${String(s.id).padStart(2, "0")}`} from={s.start} durationInFrames={s.duration + overlap} premountFor={15}>
                <SceneExit last={s.duration - 1}>
                  <Scene />
                </SceneExit>
              </Sequence>
            );
          })}
          <Soundtrack cues={SoftCues} />
        </AbsoluteFill>
      </UiThemeContext.Provider>
    </LayoutProvider>
  );
};
