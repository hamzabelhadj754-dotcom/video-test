import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled locally (OFL licensed) so renders are deterministic and offline-safe.
export const SERIF = "Instrument Serif";
export const SANS = "Geist";

export const fontsReady = Promise.all([
  loadFont({ family: SERIF, style: "italic", weight: "400", url: staticFile("fonts/instrument-serif-latin-400-italic.woff2") }),
  loadFont({ family: SERIF, style: "normal", weight: "400", url: staticFile("fonts/instrument-serif-latin-400-normal.woff2") }),
  loadFont({ family: SANS, style: "normal", weight: "100 900", url: staticFile("fonts/geist-latin-wght-normal.woff2") }),
]);
