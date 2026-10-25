// Downloads free stock b-roll for each slot into clips/ (then run prep-clips).
// Uses the Pexels API when PEXELS_API_KEY is set, otherwise scrapes Mixkit.
// Existing files are kept, so you can replace any clip by hand.
// Usage: npm run fetch-clips
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const RAW = path.join(ROOT, "clips");
const CREDITS = path.join(RAW, "credits.json");

// Slot -> search terms, best first. Faceless shots only (brand rule).
const SLOTS = {
  "01-dark-gym": ["empty gym dark", "dark gym"],
  "02-chalk": ["chalk hands", "gym chalk slow motion"],
  "03-barbell": ["barbell close up", "weight plates"],
  "04-deadlift": ["deadlift", "weightlifting dark"],
  "05-boxing": ["punching bag", "boxing training"],
  "06-rain-run": ["running at night", "running in the rain"],
  "07-sweat": ["sweat", "tired athlete"],
  "08-silhouette": ["silhouette gym", "man silhouette dark"],
};

const UA = { "User-Agent": "Mozilla/5.0 (gains-dom clip fetcher)" };

const pexels = async (query) => {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=15`;
  const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY } });
  if (!res.ok) {
    throw new Error(`Pexels ${res.status}`);
  }
  const { videos } = await res.json();
  for (const v of videos) {
    // Prefer an HD file close to 1080 wide, never a 4K monster.
    const files = v.video_files
      .filter((f) => f.file_type === "video/mp4" && f.width >= 720 && f.width <= 2160)
      .sort((a, b) => Math.abs(a.width - 1080) - Math.abs(b.width - 1080));
    if (files.length) {
      return { url: files[0].link, source: v.url, author: v.user?.name };
    }
  }
  return null;
};

const mixkit = async (query) => {
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const page = `https://mixkit.co/free-stock-video/${slug}/`;
  const res = await fetch(page, { headers: UA });
  if (!res.ok) {
    throw new Error(`Mixkit ${res.status}`);
  }
  const html = await res.text();
  const links = [...new Set(html.match(/https:\/\/assets\.mixkit\.co\/videos\/[^"'\s]+?\.mp4/g) ?? [])];
  for (const link of links) {
    // Previews are small; try the 1080p/720p rendition of the same clip first.
    for (const candidate of [link.replace(/-\d+\.mp4$/, "-1080.mp4"), link.replace(/-\d+\.mp4$/, "-720.mp4"), link]) {
      const head = await fetch(candidate, { method: "HEAD", headers: UA });
      if (head.ok) {
        return { url: candidate, source: page, author: "Mixkit" };
      }
    }
  }
  return null;
};

const download = async (url, target) => {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) {
    throw new Error(`download ${res.status}`);
  }
  fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
};

fs.mkdirSync(RAW, { recursive: true });
const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, "utf8")) : {};
const provider = process.env.PEXELS_API_KEY ? pexels : mixkit;
console.log(`Using ${process.env.PEXELS_API_KEY ? "Pexels" : "Mixkit"}\n`);

for (const [slot, queries] of Object.entries(SLOTS)) {
  const target = path.join(RAW, `${slot}.mp4`);
  if (fs.existsSync(target)) {
    console.log(`= ${slot} (already there)`);
    continue;
  }
  let found = null;
  for (const q of queries) {
    try {
      found = await provider(q);
    } catch (e) {
      console.warn(`  ${slot} "${q}": ${e.message}`);
    }
    if (found) {
      break;
    }
  }
  if (!found) {
    console.log(`x ${slot}: nothing found, add one by hand`);
    continue;
  }
  await download(found.url, target);
  credits[slot] = found;
  console.log(`+ ${slot} <- ${found.source}`);
}

fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + "\n");
console.log("\nNow run: npm run prep-clips");
