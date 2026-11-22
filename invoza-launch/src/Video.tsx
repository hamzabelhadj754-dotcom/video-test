import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { S1Hook, S2Pain } from "./scenes/Problem";
import { S3Turn } from "./scenes/Turn";
import { S4Invoice, S5Reminders, S6Dashboard } from "./scenes/Features";
import { S7Payoff, S8Cta } from "./scenes/Ending";
import { Background, Grain, Subtitles, Vignette } from "./Overlays";
import T from "./timeline.json";

const OUT = 12; // frames each scene lingers for its exit transition

const SCENES: { key: keyof typeof T.scenes; C: React.FC<{ dur: number }> }[] = [
  { key: "hook", C: S1Hook },
  { key: "pain", C: S2Pain },
  { key: "turn", C: S3Turn },
  { key: "f1", C: S4Invoice },
  { key: "f2", C: S5Reminders },
  { key: "f3", C: S6Dashboard },
  { key: "payoff", C: S7Payoff },
  { key: "cta", C: S8Cta },
];

export const InvozaLaunch: React.FC = () => (
  <AbsoluteFill style={{ background: "#0A0A0A" }}>
    <Background />
    {SCENES.map(({ key, C }) => {
      const [a, b] = T.scenes[key];
      return (
        <Sequence key={key} from={a} durationInFrames={b - a + OUT} name={key}>
          <C dur={b - a} />
        </Sequence>
      );
    })}
    <Vignette />
    <Grain />
    <Subtitles />
    <Audio src={staticFile("audio/mix.wav")} />
  </AbsoluteFill>
);
