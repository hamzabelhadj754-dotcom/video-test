import { AbsoluteFill, staticFile } from "remotion";
import { Video } from "@remotion/media";
import { CaptionOverlay } from "./CaptionOverlay";
import { GraphicOverlay } from "./GraphicOverlay";

export const AdvertComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Video src={staticFile("advert.mp4")} objectFit="cover" />
      <GraphicOverlay />
      <CaptionOverlay />
    </AbsoluteFill>
  );
};
