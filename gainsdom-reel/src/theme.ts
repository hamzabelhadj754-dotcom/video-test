// gainsdom identity: black and charcoal, white beveled forms, hexagon geometry, no colour accents.
export const C = {
  bg: "#0B0B0C",
  bgHi: "#2B2E33",
  ink: "#F2F2F0",
  ink60: "rgba(242,242,240,0.6)",
  ink35: "rgba(242,242,240,0.36)",
  ink10: "rgba(242,242,240,0.08)",
  accent: "#FFFFFF",
  // card / chip "tints" all resolve to dark glass in this identity
  mint: "glass",
  mintInk: "#FFFFFF",
  peach: "glass",
  peachInk: "#FFFFFF",
  lilac: "glass",
  lilacInk: "#FFFFFF",
  rose: "glass",
  roseInk: "#FFFFFF",
  dark: "#000000",
};
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const SAFE = { left: 96, right: 900, top: 250, bottom: 1420 };
export const SILVER = "linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 47%, #AEB2B9 50%, #FFFFFF 53.5%, #E2E4E8 100%)";
// chamfered corners, like the cuts in the GD monogram
export const chamfer = (c: number) =>
  `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;
