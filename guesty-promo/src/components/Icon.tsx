import React from "react";

const P = (d: string) => <path d={d} />;

const ICONS: Record<string, React.ReactNode> = {
  bell: (
    <>
      {P("M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9")}
      {P("M10.3 21a1.94 1.94 0 0 0 3.4 0")}
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      {P("M16 2v4M8 2v4M3 10h18")}
    </>
  ),
  message: P("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"),
  trend: (
    <>
      {P("M22 7 13.5 15.5 8.5 10.5 2 17")}
      {P("M16 7h6v6")}
    </>
  ),
  check: P("M20 6 9 17l-5-5"),
  alert: (
    <>
      {P("M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z")}
      {P("M12 9v4M12 17h.01")}
    </>
  ),
  home: P("M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"),
  users: (
    <>
      {P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2")}
      <circle cx="9" cy="7" r="4" />
      {P("M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75")}
    </>
  ),
  sparkle: P("M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"),
  arrowRight: P("M5 12h14m-7-7 7 7-7 7"),
  headset: (
    <>
      {P("M3 18v-6a9 9 0 0 1 18 0v6")}
      {P("M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z")}
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      {P("m21 21-4.3-4.3")}
    </>
  ),
  tag: (
    <>
      {P("M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8.59-8.59a1 1 0 0 0 0-1.41z")}
      <circle cx="7" cy="7" r="1.2" />
    </>
  ),
  file: (
    <>
      {P("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z")}
      {P("M14 2v6h6M8 13h8M8 17h5")}
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      {P("M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z")}
    </>
  ),
  tasks: P("M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      {P("M12 6v6l4 2")}
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export const Icon: React.FC<{
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}> = ({ name, size = 24, color = "currentColor", strokeWidth = 2, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...style }}
  >
    {ICONS[name]}
  </svg>
);
