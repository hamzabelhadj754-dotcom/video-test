import React, { createContext, useContext } from "react";

export type Format = "9x16" | "1x1";

export type Layout = {
  format: Format;
  width: number;
  height: number;
  /** Safe zone: all text & key UI stays inside. */
  safe: { x0: number; x1: number; y0: number; y1: number };
  /** Headline zone (top-anchored template). Always the same place so the eye doesn't hunt. */
  headline: { top: number; size: number };
  /** Visual zone below the headline, holds the 900x740 UI artboard. */
  visual: { top: number; bottom: number };
  /** Vertical centre of the safe zone (centred template: logo, stats, quote, CTA). */
  centerY: number;
  stat: { number: number; label: number; sub: number };
  sub: number;
};

export const STAGE_W = 900;
export const STAGE_H = 740;

const LAYOUTS: Record<Format, Layout> = {
  "9x16": {
    format: "9x16",
    width: 1080,
    height: 1920,
    safe: { x0: 90, x1: 990, y0: 260, y1: 1500 },
    headline: { top: 300, size: 104 },
    visual: { top: 670, bottom: 1470 },
    centerY: 880,
    stat: { number: 260, label: 104, sub: 48 },
    sub: 48,
  },
  "1x1": {
    format: "1x1",
    width: 1080,
    height: 1080,
    safe: { x0: 90, x1: 990, y0: 70, y1: 1010 },
    headline: { top: 76, size: 84 },
    visual: { top: 360, bottom: 1010 },
    centerY: 540,
    stat: { number: 220, label: 96, sub: 44 },
    sub: 44,
  },
};

const LayoutContext = createContext<Layout>(LAYOUTS["9x16"]);

export const LayoutProvider: React.FC<{ format: Format; children: React.ReactNode }> = ({
  format,
  children,
}) => <LayoutContext.Provider value={LAYOUTS[format]}>{children}</LayoutContext.Provider>;

export const useLayout = () => useContext(LayoutContext);

export const getLayout = (format: Format) => LAYOUTS[format];
