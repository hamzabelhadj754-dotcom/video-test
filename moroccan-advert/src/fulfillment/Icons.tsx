import React from "react";
import type { StepIcon } from "./data";

export const Icon: React.FC<{ name: StepIcon; size: number; color: string }> = ({
  name,
  size,
  color,
}) => {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === "warehouse" && (
        <g {...common}>
          <path d="M3 21V9l9-5 9 5v12" />
          <path d="M7 21v-8h10v8" />
          <path d="M7 17h10" />
        </g>
      )}
      {name === "check" && (
        <g {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.8 2.8L16.5 9.5" />
        </g>
      )}
      {name === "box" && (
        <g {...common}>
          <path d="M21 8l-9-5-9 5 9 5 9-5z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </g>
      )}
      {name === "truck" && (
        <g {...common}>
          <path d="M2 6h12v10H2z" />
          <path d="M14 10h4l3 3v3h-7z" />
          <circle cx="6" cy="18" r="1.8" />
          <circle cx="17.5" cy="18" r="1.8" />
        </g>
      )}
      {name === "cash" && (
        <g {...common}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 12h.01M18 12h.01" />
        </g>
      )}
    </svg>
  );
};

export const CheckBadge: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#22C55E" stroke="#fff" strokeWidth="2" />
    <path
      d="M7 12.5l3.2 3.2L17 9"
      fill="none"
      stroke="#fff"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
