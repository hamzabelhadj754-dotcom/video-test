import React from "react";
import { C, font } from "./lib";

export const SCREEN_W = 406;

/** Sleek, unbranded black smartphone. Children are laid out on a 406px-wide canonical screen. */
export const Phone: React.FC<{
  width?: number;
  children?: React.ReactNode;
  screenBg?: string;
  glare?: number; // 0..100 position of glass reflection band
  shadow?: string;
}> = ({ width = 440, children, screenBg = "#0D0D0F", glare = 30, shadow }) => {
  const h = width * 2.05;
  const r = width * 0.155;
  const bezel = width * 0.03;
  const screenW = width - 6 - bezel * 2;
  const screenH = h - 6 - bezel * 2;
  const k = screenW / SCREEN_W;
  return (
    <div
      style={{
        position: "relative",
        width,
        height: h,
        borderRadius: r,
        background:
          "linear-gradient(140deg, #4a4a50 0%, #17171a 14%, #070708 45%, #111113 80%, #3c3c42 100%)",
        boxShadow:
          shadow ??
          "0 90px 160px -40px rgba(0,0,0,0.9), 0 40px 80px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {/* side buttons */}
      <div style={{ position: "absolute", left: -3, top: h * 0.2, width: 4, height: h * 0.05, borderRadius: 2, background: "#2a2a2e" }} />
      <div style={{ position: "absolute", left: -3, top: h * 0.28, width: 4, height: h * 0.08, borderRadius: 2, background: "#2a2a2e" }} />
      <div style={{ position: "absolute", right: -3, top: h * 0.26, width: 4, height: h * 0.11, borderRadius: 2, background: "#2a2a2e" }} />
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: r - 3,
          background: "#020202",
          padding: bezel,
        }}
      >
        <div
          style={{
            position: "relative",
            width: screenW,
            height: screenH,
            borderRadius: r - 3 - bezel,
            overflow: "hidden",
            background: screenBg,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SCREEN_W,
              height: screenH / k,
              transform: `scale(${k})`,
              transformOrigin: "0 0",
            }}
          >
            {children}
          </div>
          {/* dynamic island */}
          <div
            style={{
              position: "absolute",
              top: screenW * 0.028,
              left: "50%",
              width: screenW * 0.29,
              height: screenW * 0.082,
              marginLeft: -screenW * 0.145,
              borderRadius: 999,
              background: "#000",
            }}
          />
          {/* glass reflection */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(118deg, rgba(255,255,255,0) ${glare - 22}%, rgba(255,255,255,0.075) ${glare}%, rgba(255,255,255,0) ${glare + 22}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const StatusBar: React.FC<{ time?: string; hideTime?: boolean }> = ({ time = "11:47", hideTime }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 52,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 34px 0 40px",
    }}
  >
    <div style={{ ...font(17, 700), opacity: hideTime ? 0 : 1 }}>{time}</div>
    <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
      <svg width="19" height="12" viewBox="0 0 19 12">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 5} y={9 - i * 3} width="3.4" height={3 + i * 3} rx="1" fill="#fff" />
        ))}
      </svg>
      <svg width="25" height="12" viewBox="0 0 25 12">
        <rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="rgba(255,255,255,0.5)" />
        <rect x="2" y="2" width="16" height="8" rx="1.8" fill="#fff" />
        <rect x="22.5" y="4" width="2" height="4" rx="1" fill="rgba(255,255,255,0.5)" />
      </svg>
    </div>
  </div>
);

/** In-app top nav bar */
export const AppHeader: React.FC<{ title: string; right?: React.ReactNode; back?: boolean }> = ({
  title,
  right,
  back = true,
}) => (
  <div
    style={{
      position: "absolute",
      top: 62,
      left: 22,
      right: 22,
      height: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {back && (
        <svg width="14" height="22" viewBox="0 0 14 22">
          <path d="M11 3L3 11l8 8" fill="none" stroke={C.grey} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <div style={{ ...font(26, 700) }}>{title}</div>
    </div>
    {right}
  </div>
);
