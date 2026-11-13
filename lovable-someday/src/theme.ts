// Design system for "Someday". Brand values come from the official Lovable brand hub.
export const C = {
  creme: "#F7F4ED",
  ink: "#1B1B1B",
  paper: "#FCFAF5",
  desk: "#E9E4D8",
  ink60: "rgba(27,27,27,0.6)",
  ink30: "rgba(27,27,27,0.3)",
  ink10: "rgba(27,27,27,0.08)",
  creme60: "rgba(247,244,237,0.6)",
  creme30: "rgba(247,244,237,0.3)",
  blue: "#4B73FF",
  violet: "#BBC1FF",
  pink: "#FF0178",
  orange: "#FF6D1B",
};

// Official "Horizontal Full" gradient stops.
export const GRADIENT_STOPS =
  "#4F88FF 0%, #5885FF 10%, #7491FF 19%, #B0ACFE 29%, #E2A5F2 38%, #FB65C2 48%, #FD2980 57%, #FA1F41 67%, #FB3D26 76%, #FE6A1E 86%, #FF8F1B 100%";
export const GRADIENT = `linear-gradient(to right, ${GRADIENT_STOPS})`;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  snap: [0.9, 0, 0.1, 1] as const,
};

export const W = 1920;
export const H = 1080;
export const FPS = 30;
