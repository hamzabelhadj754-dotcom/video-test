import { AbsoluteFill, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Video } from "@remotion/media";
import { CaptionOverlay } from "./CaptionOverlay";
import { GraphicOverlay } from "./GraphicOverlay";
import { SWEEP_FRAMES } from "./constants";

const VideoBg: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle zoom-punch on every sweep transition (1.5% scale spike)
  const zoomPulse = SWEEP_FRAMES.reduce((acc, sf) => {
    const lf = frame - sf;
    if (lf < 0 || lf > 8) return acc;
    return acc + interpolate(lf, [0, 3, 8], [0, 0.016, 0], { extrapolateRight: "clamp" });
  }, 0);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        transform: `scale(${1 + zoomPulse})`,
      }}
    >
      <Video src={staticFile("advert.mp4")} objectFit="cover" />
    </div>
  );
};

export const AdvertComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <VideoBg />
      <GraphicOverlay />
      <CaptionOverlay />
    </AbsoluteFill>
  );
};
