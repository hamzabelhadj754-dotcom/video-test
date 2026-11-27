// Usage: node scripts/stills.mjs <outDir> <scale> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [out, scale, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "ChatGPTSpec" });
for (const f of frames) {
  const file = path.join(out, `f${String(f).padStart(3, "0")}.png`);
  await renderStill({ serveUrl, composition, frame: Number(f), output: file, scale: Number(scale), imageFormat: "png" });
  console.log("wrote", file);
}
