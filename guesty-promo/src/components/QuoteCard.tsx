import React from "react";
import { colors, fontFamily, radius, shadow } from "../brand";

/** Customer quote card — quote text verbatim from guesty.com, attribution underneath. */
export const QuoteCard: React.FC<{
  quote: string;
  author: string;
  place: string;
  width: number;
  fontSize: number;
  style?: React.CSSProperties;
}> = ({ quote, author, place, width, fontSize, style }) => (
  <div
    style={{
      position: "absolute",
      width,
      padding: `${fontSize * 0.9}px ${fontSize * 0.85}px ${fontSize * 0.8}px`,
      background: colors.white,
      borderRadius: radius.card,
      boxShadow: shadow.card,
      fontFamily,
      boxSizing: "border-box",
      ...style,
    }}
  >
    <svg width={fontSize * 1.1} height={fontSize * 0.85} viewBox="0 0 26 20" style={{ display: "block", marginBottom: fontSize * 0.35 }}>
      <path
        fill={colors.primary}
        d="M0 20V12.2C0 5.6 3.4 1.4 10.2 0l1.2 3C8 4.2 6.2 6.4 5.9 9.6H11V20H0zm14.6 0V12.2c0-6.6 3.4-10.8 10.2-12.2l1.2 3c-3.4 1.2-5.2 3.4-5.5 6.6H25.6V20H14.6z"
      />
    </svg>
    <div
      style={{
        fontSize,
        lineHeight: 1.12,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: colors.forest,
      }}
    >
      {quote}
    </div>
    <div style={{ height: 4, width: 90, background: colors.primary, borderRadius: 4, margin: `${fontSize * 0.55}px 0` }} />
    <div style={{ fontSize: fontSize * 0.62, fontWeight: 700, color: colors.forest }}>— {author}</div>
    <div style={{ fontSize: fontSize * 0.5, fontWeight: 500, color: colors.ink, opacity: 0.6, marginTop: 6 }}>{place}</div>
  </div>
);
