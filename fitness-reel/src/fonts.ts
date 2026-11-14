import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const DISPLAY = "Archivo";
export const MONO = "JetBrains Mono";
export const fontsReady = Promise.all([
  loadFont({ family: DISPLAY, weight: "100 900", url: staticFile("fonts/archivo.woff2") }),
  loadFont({ family: MONO, weight: "400", url: staticFile("fonts/jetbrains-mono-latin-400-normal.woff2") }),
  loadFont({ family: MONO, weight: "500", url: staticFile("fonts/jetbrains-mono-latin-500-normal.woff2") }),
]);
// variable-axis style helper: weight 100..900, width 62..125
export const vf = (wght: number, wdth: number): React.CSSProperties => ({
  fontFamily: DISPLAY,
  fontWeight: Math.round(wght),
  fontVariationSettings: `'wght' ${wght}, 'wdth' ${wdth}`,
  fontStretch: `${wdth}%`,
});
