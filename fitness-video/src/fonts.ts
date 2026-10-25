import { loadFont } from "@remotion/fonts";
import { SERIF } from "./constants";
import { SERIF_500, SERIF_500_ITALIC, SERIF_600 } from "./fontData";

loadFont({ family: SERIF, url: SERIF_500, format: "woff2", weight: "500" });
loadFont({
  family: SERIF,
  url: SERIF_500_ITALIC,
  format: "woff2",
  weight: "500",
  style: "italic",
});
loadFont({ family: SERIF, url: SERIF_600, format: "woff2", weight: "600" });
