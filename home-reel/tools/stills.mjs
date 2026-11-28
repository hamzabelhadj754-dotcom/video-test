import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [, , outDir, ...frames] = process.argv;
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const inputProps = { audio: false };
const composition = await selectComposition({ serveUrl, id: "HomeReel", inputProps, browserExecutable });
for (const fr of frames) {
  await renderStill({ composition, serveUrl, frame: Number(fr), output: `${outDir}/f${String(fr).padStart(3, "0")}.png`, inputProps, browserExecutable, scale: Number(process.env.SCALE || 0.5) });
  console.log("frame", fr);
}
