/* Renders one still from the middle of every scene's hold, for both formats, to out/stills/.
 * Usage: npm run stills [-- 9x16|1x1] [-- --frames=12,40] (extra absolute frames) */
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { SCENES, MID_HOLD } from "../src/timing";
import { BROWSER_EXECUTABLE } from "./browser";

const args = process.argv.slice(2);
const formats = args.filter((a) => a === "9x16" || a === "1x1");
const extra = (args.find((a) => a.startsWith("--frames=")) ?? "").replace("--frames=", "").split(",").filter(Boolean).map(Number);
const onlyExtra = args.includes("--only-extra");
const soft = args.includes("--soft");

const main = async () => {
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  const browser = await openBrowser("chrome", { browserExecutable: BROWSER_EXECUTABLE });
  for (const f of formats.length ? formats : ["9x16", "1x1"]) {
    const id = `${soft ? "Soft" : "Promo"}${f}`;
    const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable: BROWSER_EXECUTABLE });
    const frames = onlyExtra
      ? extra.map((fr) => ({ fr, name: `f${String(fr).padStart(3, "0")}` }))
      : [
          ...SCENES.map((s) => ({
            fr: s.start + (s.id === SCENES.length ? MID_HOLD + 15 : MID_HOLD),
            name: `scene${String(s.id).padStart(2, "0")}`,
          })),
          ...extra.map((fr) => ({ fr, name: `f${String(fr).padStart(3, "0")}` })),
        ];
    for (const { fr, name } of frames) {
      const output = path.resolve(`out/stills/${soft ? "soft-" : ""}${f}/${name}.png`);
      await renderStill({ composition, serveUrl, frame: fr, output, puppeteerInstance: browser, browserExecutable: BROWSER_EXECUTABLE, overwrite: true });
      console.log(`${f} ${name} (frame ${fr}) -> ${path.relative(process.cwd(), output)}`);
    }
  }
  await browser.close({ silent: true });
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
