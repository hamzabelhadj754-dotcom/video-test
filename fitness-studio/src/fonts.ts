import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const SANS = "Geist";
export const fontsReady = loadFont({ family: SANS, weight: "100 900", url: staticFile("fonts/geist-latin-wght-normal.woff2") });
export const ff = (wght: number): React.CSSProperties => ({ fontFamily: SANS, fontWeight: Math.round(wght) });
