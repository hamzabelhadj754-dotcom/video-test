import { FIGTREE_WOFF2 } from "./fonts/figtree";

/**
 * Brand tokens — REAL values extracted from https://www.guesty.com
 * (homepage + its Next.js CSS bundles, fetched 2026-11-23).
 *
 *  - Body / UI font on the site: Figtree  (font-family: var(--font-figtree) — 548 rules)
 *    The site also uses two commercial display faces for a few headings
 *    (PP Right Grotesk, Copernicus). They are not on Google Fonts, so Figtree is used everywhere.
 *  - Colors are the most-used values in the site CSS (counts in brackets).
 *
 * The brief's placeholder roles map onto the real palette like this:
 *   navy  #0B1B3F -> forest   #072C23  (dark sections)
 *   blue  #2D6BFF -> primary  #007A67  (primary button background)
 *   sky   #E8F0FF -> mint     #D5F2F2
 *   white #FFFFFF -> white / cream #F7F5F2 (page background)
 *   success       -> success  #0D9E88
 *   alert         -> alert    #FA5767
 */
export const fontFamily = "Figtree";

// Figtree (SIL Open Font License) is embedded (src/fonts/figtree.ts, from public/fonts) so renders
// work offline and never wait on Google Fonts. <Promo> blocks rendering until it is loaded.
let fontPromise: Promise<void> | null = null;
export const ensureFont = (): Promise<void> => {
  if (!fontPromise) {
    const face = new FontFace(fontFamily, `url(${FIGTREE_WOFF2}) format("woff2")`, {
      weight: "300 900",
      display: "block",
    });
    (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
    fontPromise = face.load().then(() => undefined);
  }
  return fontPromise;
};

export const colors = {
  forest: "#072C23", // [49] dark green — hero/footer/dark panels
  forestDeep: "#04201A",
  teal: "#0B3638", // [7] dark teal panels
  primary: "#007A67", // [32] primary button background
  primaryDeep: "#14665F", // [34]
  primaryBright: "#0D9E88", // [7]
  mint: "#D5F2F2", // [43] light mint surface
  mintSoft: "#ECF9F9", // [13]
  cream: "#F7F5F2", // [31] page background
  sand: "#E9E2D5", // [21]
  ink: "#101010", // [214] body text
  white: "#FFFFFF",
  lime: "#EEFAD0", // [14] highlight surface
  coral: "#FA5767", // [7] alert
  coralSoft: "#FFE3E3", // [5]
  peach: "#FA877D", // [7]
  periwinkle: "#5071E6", // [5]
  periwinkleSoft: "#EBF0FF", // [7]
  plum: "#5F1632", // [18]
  gray: "#6B7280", // [5]
  grayLight: "#D1D5DB", // [9]
  line: "#ECEAE6",
  success: "#0D9E88",
  alert: "#FA5767",
} as const;

/** Channel accent colors used in the stylised UI (from Guesty's palette, not the OTAs' brand colors). */
export const channelColor: Record<string, string> = {
  Airbnb: colors.coral,
  "Booking.com": colors.periwinkle,
  Vrbo: colors.primaryBright,
  Direct: colors.plum,
  Expedia: colors.peach,
  "Google Travel": colors.primaryDeep,
  Hopper: colors.plum,
};

export const radius = { card: 24, pill: 999 } as const;

export const shadow = {
  card: "0 30px 70px rgba(7,44,35,0.14), 0 6px 18px rgba(7,44,35,0.08)",
  soft: "0 14px 36px rgba(7,44,35,0.12)",
  dark: "0 30px 70px rgba(0,0,0,0.35), 0 6px 18px rgba(0,0,0,0.25)",
} as const;
