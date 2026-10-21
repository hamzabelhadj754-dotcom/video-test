// Render the 3D kit to transparent PNG stills under assets/img/.
// Usage: node scripts/render-stills.mjs [name...]   (needs `python3 -m http.server 8765` from project root)
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Resolve the globally installed playwright (ESM ignores NODE_PATH).
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const STILLS = {
  "bottle-hero": "bottle=1&led=0.0&ry=-0.35&rx=0.06&w=900&h=1600&pad=1.02",
  "bottle-led": "bottle=1&led=1.0&ry=-0.35&rx=0.06&w=900&h=1600&pad=1.02",
  "bottle-tilt": "bottle=1&led=0.6&ry=0.4&rx=0.1&rz=-0.18&w=900&h=1600&pad=1.04",
  "pet-1": "icon=pet&rx=0.2&ry=0.3&rz=0.5",
  "pet-2": "icon=pet&rx=-0.3&ry=1.2&rz=-0.9",
  "pet-3": "icon=pet&rx=0.5&ry=2.2&rz=1.6",
  drop: "icon=drop&rx=0.1&ry=0.3",
  gradcap: "icon=gradcap&rx=0.45&ry=-0.25",
  dumbbell: "icon=dumbbell&rx=0.35&ry=-0.55&rz=0.25",
  briefcase: "icon=briefcase&rx=0.25&ry=-0.5",
  factory: "icon=factory&rx=0.3&ry=-0.55",
  parcel: "icon=parcel&rx=0.4&ry=-0.65",
  globe: "icon=globe&rx=0.2&ry=-0.4",
  store: "icon=store&rx=0.25&ry=-0.5",
  person: "icon=person&rx=0.1&ry=-0.3",
  heart: "icon=heart&rx=0.2&ry=-0.45&rz=0.12",
  megaphone: "icon=megaphone&rx=0.25&ry=-0.6&rz=0.25",
  target: "icon=target&rx=0.15&ry=-0.5",
  tag: "icon=tag&rx=0.3&ry=-0.5&rz=0.35",
  ice: "icon=ice&rx=0&ry=0",
};
const only = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("pageerror", e.message));
for (const [name, query] of Object.entries(STILLS)) {
  if (only.length && !only.includes(name)) continue;
  await page.goto(`http://127.0.0.1:8765/scripts/studio.html?${query}`);
  await page.waitForFunction(() => window.__png, null, { timeout: 120000 });
  const data = await page.evaluate(() => window.__png);
  fs.writeFileSync(path.join(ROOT, "assets/img", `${name}.png`), Buffer.from(data.split(",")[1], "base64"));
  console.log("rendered", name);
}
await browser.close();
