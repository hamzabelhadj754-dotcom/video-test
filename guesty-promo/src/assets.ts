import { getStaticFiles, staticFile } from "remotion";

/**
 * Optional files in public/ are detected at render time, so you can drop them in later
 * without touching code:
 *   public/guesty-logo.svg              -> used by <Logo /> (else a text wordmark)
 *   public/music.mp3                    -> soundtrack with 0.5 s fade-in / 1 s fade-out
 *   public/sfx/*whoosh*.(mp3|wav)       -> played on wipes
 *   public/sfx/*pop*.(mp3|wav)          -> played on pops
 *   public/channels/<slug>.(svg|png)    -> replaces a channel text chip (airbnb, booking, vrbo, ...)
 */
const files = () => {
  try {
    return getStaticFiles();
  } catch {
    return [];
  }
};

const find = (test: (name: string) => boolean) => {
  const f = files().find((file) => test(file.name.replace(/\\/g, "/")));
  return f ? staticFile(f.name.replace(/\\/g, "/")) : null;
};

export const logoSrc = () => find((n) => n === "guesty-logo.svg");
export const musicSrc = () => find((n) => n === "music.mp3");
export const whooshSrc = () => find((n) => /^sfx\/.*whoosh.*\.(mp3|wav|m4a)$/i.test(n));
export const popSrc = () => find((n) => /^sfx\/.*pop.*\.(mp3|wav|m4a)$/i.test(n));

export const channelSlug = (name: string) => name.toLowerCase().replace(/\.com$/, "").replace(/[^a-z0-9]+/g, "-");

export const channelLogoSrc = (name: string) => {
  const slug = channelSlug(name);
  return find((n) => n === `channels/${slug}.svg` || n === `channels/${slug}.png`);
};
