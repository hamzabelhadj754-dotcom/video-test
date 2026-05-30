import "./index.css";
import { Composition } from "remotion";
import { AdvertComposition } from "./Composition";
import { CouchPromo } from "./CouchPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AdvertComp"
        component={AdvertComposition}
        durationInFrames={192}
        fps={24}
        width={720}
        height={1280}
      />
      <Composition
        id="CouchPromo"
        component={CouchPromo}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
