import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const SANS = "Geist";
export const DISPLAY = "Archivo";
export const fontsReady = Promise.all([
  loadFont({ family: SANS, weight: "100 900", url: staticFile("fonts/geist-latin-wght-normal.woff2") }),
  loadFont({ family: DISPLAY, weight: "100 900", url: staticFile("fonts/archivo.woff2") }),
]);
export const ff = (wght: number): React.CSSProperties => ({ fontFamily: SANS, fontWeight: Math.round(wght) });
export const disp = (wght = 800, wdth = 74): React.CSSProperties => ({
  fontFamily: DISPLAY,
  fontWeight: wght,
  fontVariationSettings: `'wght' ${wght}, 'wdth' ${wdth}`,
  fontStretch: `${wdth}%`,
  textTransform: "uppercase",
});
