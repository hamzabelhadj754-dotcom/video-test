import fs from "fs";

// Use a pre-installed headless Chromium when one exists (CI / cloud containers).
// On a normal machine this is null and Remotion downloads its own browser.
const CANDIDATES = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
].filter(Boolean) as string[];

export const BROWSER_EXECUTABLE: string | null =
  CANDIDATES.find((p) => fs.existsSync(p)) ?? null;
