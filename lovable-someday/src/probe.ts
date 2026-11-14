import { getInputProps } from "remotion";

// Render-time probe: `--props='{"probe":"hl"}'` paints one element pure green so its
// on-screen position can be measured and transitions can be matched to the pixel.
export const PROBE = ((getInputProps() as { probe?: string }).probe ?? "") as string;
export const PG = "#00FF00";
