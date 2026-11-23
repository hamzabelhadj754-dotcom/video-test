/**
 * All on-screen text in one place.
 *
 * Proof points (scenes 12–15) are copied from https://www.guesty.com (homepage, 2026-11-23).
 * Source wording is kept next to each one — do not change numbers, names or quotes.
 */

export type Line = string | { text: string; accent?: boolean };

export const lineText = (l: Line): string => (typeof l === "string" ? l : l.text);

export const COPY = {
  s01: { headline: ["3 booking sites."] as Line[] },
  s02: { headline: ["1 calendar mess."] as Line[], alert: "Double booking" },
  s03: { headline: ["Sound", { text: "familiar?", accent: true }] as Line[] },
  s04: { logo: true },
  s05: { headline: ["One platform.", { text: "Every tool.", accent: true }] as Line[] },
  // "Sync your properties in real-time on Airbnb, Booking.com, Vrbo, and 60+ channels"
  s06: {
    headline: [{ text: "60+ booking", accent: true }, "channels"] as Line[],
    count: { match: "60", to: 60 },
  },
  s07: { headline: ["Synced in", { text: "real time.", accent: true }] as Line[] },
  s08: { headline: ["Every", "reservation.", { text: "One calendar.", accent: true }] as Line[] },
  s09: { headline: ["All guest", "messages.", { text: "One inbox.", accent: true }] as Line[] },
  s10: { headline: [{ text: "AI-powered", accent: true }, "dynamic pricing"] as Line[] },
  s11: { headline: ["Direct bookings", { text: "+ owner portal", accent: true }] as Line[] },
  // "500K+ listings managed across our platform"
  s12: {
    value: { to: 500, decimals: 0, suffix: "K+" },
    label: "listings",
    sub: ["managed across the platform"],
  },
  // "2.5x revenue growth in 2 years" — card with the Zen Vacation Rentals logo
  s13: {
    value: { to: 2.5, decimals: 1, suffix: "x" },
    label: "revenue growth",
    sub: ["in 2 years", "Zen Vacation Rentals"],
  },
  // "50+ hours on average saved per month" — card with the Tiny Away logo
  s14: {
    value: { to: 50, decimals: 0, suffix: "+" },
    label: "hours saved",
    sub: ["per month, on average", "Tiny Away"],
  },
  // Matt Marrs, Texas | United States:
  // "We've had zero double bookings since using Guesty and I think that ties directly to the Multi-Calendar."
  s15: {
    quote: "…zero double bookings since using Guesty…",
    author: "Matt Marrs",
    place: "Texas, United States",
    alertBefore: "Double booking",
    alertAfter: "No double bookings",
  },
  // "Uptime backed by 24/7 support"
  s16: { cta: "Book a demo", url: "guesty.com", support: "24/7 support" },
} as const;

/** The main line of each scene — used by scripts/check-timing.ts for the 6-words-per-hold rule. */
export const HOLD_TEXT: Record<number, string> = {
  1: COPY.s01.headline.map(lineText).join(" "),
  2: COPY.s02.headline.map(lineText).join(" "),
  3: COPY.s03.headline.map(lineText).join(" "),
  4: "guesty",
  5: COPY.s05.headline.map(lineText).join(" "),
  6: COPY.s06.headline.map(lineText).join(" "),
  7: COPY.s07.headline.map(lineText).join(" "),
  8: COPY.s08.headline.map(lineText).join(" "),
  9: COPY.s09.headline.map(lineText).join(" "),
  10: COPY.s10.headline.map(lineText).join(" "),
  11: COPY.s11.headline.map(lineText).join(" "),
  12: `500K+ ${COPY.s12.label}`,
  13: `2.5x ${COPY.s13.label}`,
  14: `50+ ${COPY.s14.label}`,
  15: COPY.s15.quote,
  16: COPY.s16.cta,
};
