import React from "react";
import { colors, fontFamily, radius } from "../brand";
import { Icon } from "./Icon";

/** Primary call-to-action pill with arrow. `pulse` is a 0..1 value driven by the scene. */
export const CTAButton: React.FC<{ label: string; fontSize: number; pulse?: number }> = ({
  label,
  fontSize,
  pulse = 0,
}) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    {/* expanding ring behind the button */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius.pill,
        border: `3px solid ${colors.lime}`,
        transform: `scale(${1 + pulse * 0.18}, ${1 + pulse * 0.5})`,
        opacity: (1 - pulse) * 0.7,
      }}
    />
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: fontSize * 0.45,
        padding: `${fontSize * 0.55}px ${fontSize * 1.05}px`,
        borderRadius: radius.pill,
        background: colors.lime,
        color: colors.forest,
        fontFamily,
        fontWeight: 800,
        fontSize,
        letterSpacing: "-0.01em",
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <Icon name="arrowRight" size={fontSize * 0.9} strokeWidth={2.6} />
    </div>
  </div>
);
