import { loadFont } from "@remotion/fonts";
import { DISPLAY_FONT, LABEL_FONT } from "./constants";
import { ANTON_WOFF2, OSWALD_500_WOFF2 } from "./fontData";

loadFont({ family: DISPLAY_FONT, url: ANTON_WOFF2, format: "woff2" });
loadFont({
  family: LABEL_FONT,
  url: OSWALD_500_WOFF2,
  format: "woff2",
  weight: "500",
});
