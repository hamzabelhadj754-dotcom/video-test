import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const ARABIC_FONT = "NotoArabicBlack";

loadFont({
  family: ARABIC_FONT,
  url: staticFile("arabic-black.ttf"),
  weight: "900",
});
