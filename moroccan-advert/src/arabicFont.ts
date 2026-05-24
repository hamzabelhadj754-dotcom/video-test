import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const ARABIC_FONT_FAMILY = "ArabicBold";

loadFont({
  family: ARABIC_FONT_FAMILY,
  url: staticFile("arabic-bold.ttf"),
  weight: "700",
});
