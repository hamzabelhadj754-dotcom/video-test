import { Still } from "remotion";
import { H, W } from "./theme";
import { Note } from "./scenes/Note";
import { Build } from "./scenes/Build";
import { EndCard } from "./scenes/EndCard";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Still id="frame-note" component={Note} width={W} height={H} />
      <Still id="frame-build" component={Build} width={W} height={H} />
      <Still id="frame-end" component={EndCard} width={W} height={H} />
    </>
  );
};
