import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { DISPLAY_FONT, LABEL_FONT } from "./constants";

// Fonts are bundled locally so rendering never depends on Google Fonts being reachable.
loadFont({ family: DISPLAY_FONT, url: staticFile("fonts/anton.woff2") });
loadFont({
  family: LABEL_FONT,
  url: staticFile("fonts/oswald-500.woff2"),
  weight: "500",
});
