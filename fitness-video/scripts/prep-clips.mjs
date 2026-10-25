// Turns raw clips dropped in clips/ (any subfolder) into graded 9:16 b-roll in
// public/clips/, and records which ones exist in src/clips.json.
// Usage: npm run prep-clips   (needs ffmpeg on PATH, or set FFMPEG=/path/to/ffmpeg)
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const RAW = path.join(ROOT, "clips");
const OUT = path.join(ROOT, "public", "clips");
const MANIFEST = path.join(ROOT, "src", "clips.json");
const MAX_SECONDS = 16;

const VIDEO = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv"]);
const IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Crop to 9:16, 30 fps, monochrome with crushed blacks, no audio.
const GRADE =
  "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30," +
  "hue=s=0,eq=contrast=1.15:gamma=1.15,format=yuv420p";

const ffmpegCommand = () => {
  const bin = process.env.FFMPEG || "ffmpeg";
  if (spawnSync(bin, ["-version"], { stdio: "ignore" }).status === 0) {
    return [bin];
  }
  // Remotion bundles its own ffmpeg.
  return ["npx", "remotion", "ffmpeg"];
};

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
      })
    : [];

fs.mkdirSync(OUT, { recursive: true });
const [bin, ...pre] = ffmpegCommand();
const seen = new Map();

for (const file of walk(RAW)) {
  const ext = path.extname(file).toLowerCase();
  if (!VIDEO.has(ext) && !IMAGE.has(ext)) {
    continue;
  }
  const name = path.basename(file, path.extname(file));
  if (seen.has(name)) {
    console.warn(`! ${file}: name "${name}" already used by ${seen.get(name)}, skipping`);
    continue;
  }
  seen.set(name, file);
  const target = path.join(OUT, `${name}.mp4`);
  if (fs.existsSync(target) && fs.statSync(target).mtimeMs > fs.statSync(file).mtimeMs) {
    console.log(`= ${name} (up to date)`);
    continue;
  }
  const input = IMAGE.has(ext) ? ["-loop", "1", "-t", "6", "-i", file] : ["-i", file, "-t", String(MAX_SECONDS)];
  const args = [...pre, "-y", "-loglevel", "error", ...input, "-vf", GRADE, "-an",
    "-c:v", "libx264", "-crf", "21", "-preset", "medium", "-movflags", "+faststart", target];
  const res = spawnSync(bin, args, { stdio: "inherit", shell: process.platform === "win32" });
  console.log(res.status === 0 ? `+ ${name}` : `x ${name} failed`);
}

const available = fs
  .readdirSync(OUT)
  .filter((f) => f.endsWith(".mp4"))
  .map((f) => path.basename(f, ".mp4"))
  .sort();
fs.writeFileSync(MANIFEST, JSON.stringify(available, null, 2) + "\n");
console.log(`\n${available.length} clips ready: ${available.join(", ") || "(none, backdrops will be used)"}`);
