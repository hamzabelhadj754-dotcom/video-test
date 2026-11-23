import React, { createContext, useContext } from "react";
import { Img } from "remotion";
import { channelColor, colors, fontFamily, radius, shadow } from "../brand";
import { channelLogoSrc } from "../assets";

/** "solid" = classic white cards; "glass" = frosted cards for the soft version. */
export type UiTheme = "solid" | "glass";
export const UiThemeContext = createContext<UiTheme>("solid");
export const useUiTheme = () => useContext(UiThemeContext);

export const GLASS_FILL = "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.66) 100%)";
export const glassSurface = (radius: number): React.CSSProperties => ({
  background: GLASS_FILL,
  border: "2px solid rgba(255,255,255,0.9)",
  boxShadow: "0 40px 90px rgba(7,44,35,0.20), 0 8px 24px rgba(7,44,35,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  borderRadius: radius,
  boxSizing: "border-box",
});

/** Rounded white card (radius 24, soft shadow) — base of every UI mockup. */
export const UICard: React.FC<{
  style?: React.CSSProperties;
  children?: React.ReactNode;
  dark?: boolean;
}> = ({ style, children, dark }) => {
  const glass = useUiTheme() === "glass";
  return (
    <div
      style={{
        position: "absolute",
        background: colors.white,
        borderRadius: radius.card,
        boxShadow: dark ? shadow.dark : shadow.card,
        overflow: "hidden",
        fontFamily,
        color: colors.ink,
        ...(glass ? glassSurface(32) : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const CHIP_SIZES = {
  lg: { h: 120, font: 50, pad: 46, dot: 22, badge: 66, badgeFont: 32 },
  md: { h: 84, font: 36, pad: 32, dot: 16, badge: 48, badgeFont: 24 },
  sm: { h: 44, font: 20, pad: 16, dot: 10, badge: 30, badgeFont: 16 },
} as const;

/**
 * Channel chip — a rounded pill with the channel name. If an official logo is dropped in
 * public/channels/<slug>.svg|png it is used instead of the text.
 */
export const Chip: React.FC<{
  label: string;
  size?: keyof typeof CHIP_SIZES;
  badge?: number;
  tone?: "light" | "dark" | "tint";
  style?: React.CSSProperties;
  showDot?: boolean;
}> = ({ label, size = "md", badge, tone = "light", style, showDot = true }) => {
  const s = CHIP_SIZES[size];
  const glass = useUiTheme() === "glass";
  const logo = channelLogoSrc(label);
  const dot = channelColor[label] ?? colors.primary;
  const bg = tone === "dark" ? colors.teal : tone === "tint" ? colors.mintSoft : colors.white;
  const fg = tone === "dark" ? colors.white : colors.forest;
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: s.dot * 0.8,
        height: s.h,
        padding: `0 ${s.pad}px`,
        borderRadius: radius.pill,
        background: bg,
        color: fg,
        fontFamily,
        fontWeight: 700,
        fontSize: s.font,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        boxShadow: tone === "tint" ? "none" : shadow.soft,
        ...(glass && tone === "light"
          ? { background: GLASS_FILL, border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 18px 40px rgba(7,44,35,0.16)" }
          : {}),
        ...style,
      }}
    >
      {logo ? (
        <Img src={logo} style={{ height: s.h * 0.5, width: "auto" }} />
      ) : (
        <>
          {showDot ? (
            <span style={{ width: s.dot, height: s.dot, borderRadius: 99, background: dot, flexShrink: 0 }} />
          ) : null}
          {label}
        </>
      )}
      {badge !== undefined ? (
        <span
          style={{
            position: "absolute",
            top: -s.badge * 0.32,
            right: -s.badge * 0.28,
            minWidth: s.badge,
            height: s.badge,
            padding: "0 10px",
            borderRadius: radius.pill,
            background: colors.alert,
            color: colors.white,
            fontSize: s.badgeFont,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 6px rgba(250,87,103,0.25)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
};

/** Grey placeholder text line used inside mock UI. */
export const Skeleton: React.FC<{ w: number | string; h?: number; color?: string; style?: React.CSSProperties }> = ({
  w,
  h = 14,
  color = colors.line,
  style,
}) => <div style={{ width: w, height: h, borderRadius: 99, background: color, ...style }} />;

export const Avatar: React.FC<{ initials: string; color: string; size?: number }> = ({ initials, color, size = 56 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 99,
      background: color,
      color: colors.white,
      fontFamily,
      fontWeight: 700,
      fontSize: size * 0.38,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {initials}
  </div>
);
