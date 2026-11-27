import React from "react";
import { interpolate, interpolateColors } from "remotion";
import { PANEL } from "./ui";
import { ease } from "./theme";

// ---------- The light of the world: every scene's palette comes from its light ----------
export type Look = {
  wall: string;
  wallFar: string;
  light: string;
  lightOp: number; // window light on the wall
  skew: number; // sun angle
  paneX: number;
  paneY: number;
  paneBlur: number;
  shadow: string; // window-frame shadow falling on the screen
  shadowOp: number;
  glow: string; // screen glow (night)
  glowOp: number;
  vignette: number;
  tint: string; // the light's colour on the screen itself
  tintOp: number;
};

export const LOOKS: Record<string, Look> = {
  morning: {
    wall: "#E9DCC8", wallFar: "#C7B49A", light: "#FFE3BC", lightOp: 0.9, skew: -24, paneX: 40, paneY: -40, paneBlur: 22,
    shadow: "#6E4A26", shadowOp: 0.075, glow: "#000000", glowOp: 0, vignette: 0.26, tint: "#FFDDB0", tintOp: 0.34,
  },
  afternoon: {
    wall: "#E6E5E0", wallFar: "#C9C8C2", light: "#FBFAF6", lightOp: 0.75, skew: -9, paneX: 1180, paneY: -120, paneBlur: 12,
    shadow: "#3C4250", shadowOp: 0.05, glow: "#000000", glowOp: 0, vignette: 0.2, tint: "#FFFFFF", tintOp: 0.0,
  },
  dim: {
    wall: "#A39D95", wallFar: "#6E6962", light: "#E9C9A6", lightOp: 0.12, skew: -30, paneX: 1300, paneY: 40, paneBlur: 30,
    shadow: "#3C4250", shadowOp: 0.0, glow: "#000000", glowOp: 0, vignette: 0.34, tint: "#E8D2BC", tintOp: 0.18,
  },
  night: {
    wall: "#0D1017", wallFar: "#05070A", light: "#000000", lightOp: 0, skew: 0, paneX: 0, paneY: 0, paneBlur: 0,
    shadow: "#000000", shadowOp: 0, glow: "#5A76B8", glowOp: 0.32, vignette: 0.5, tint: "#FFFFFF", tintOp: 0.0,
  },
  noon: {
    wall: "#EAE5DA", wallFar: "#CBC3B4", light: "#FFF6E6", lightOp: 0.8, skew: -4, paneX: 900, paneY: -260, paneBlur: 14,
    shadow: "#4A3D2E", shadowOp: 0.06, glow: "#000000", glowOp: 0, vignette: 0.2, tint: "#FFEBCC", tintOp: 0.18,
  },
  dusk: {
    wall: "#D5B49A", wallFar: "#9A7461", light: "#FFC293", lightOp: 0.85, skew: -34, paneX: -80, paneY: 120, paneBlur: 26,
    shadow: "#5A2E18", shadowOp: 0.09, glow: "#000000", glowOp: 0, vignette: 0.3, tint: "#FFC9A0", tintOp: 0.4,
  },
  evening: {
    wall: "#1A1511", wallFar: "#0B0907", light: "#000000", lightOp: 0, skew: 0, paneX: 0, paneY: 0, paneBlur: 0,
    shadow: "#000000", shadowOp: 0, glow: "#FFB070", glowOp: 0.16, vignette: 0.5, tint: "#FFFFFF", tintOp: 0.0,
  },
};

export const lerpLook = (a: Look, b: Look, t: number): Look => {
  const c = (x: string, y: string) => interpolateColors(t, [0, 1], [x, y]);
  const n = (x: number, y: number) => x + (y - x) * t;
  return {
    wall: c(a.wall, b.wall), wallFar: c(a.wallFar, b.wallFar), light: c(a.light, b.light), lightOp: n(a.lightOp, b.lightOp),
    skew: n(a.skew, b.skew), paneX: n(a.paneX, b.paneX), paneY: n(a.paneY, b.paneY), paneBlur: n(a.paneBlur, b.paneBlur),
    shadow: c(a.shadow, b.shadow), shadowOp: n(a.shadowOp, b.shadowOp), glow: c(a.glow, b.glow), glowOp: n(a.glowOp, b.glowOp),
    vignette: n(a.vignette, b.vignette),
    tint: c(a.tint, b.tint), tintOp: n(a.tintOp, b.tintOp),
  };
};

// ---------- Camera ----------
export type Cam = { s: number; fx: number; fy: number; rx: number; ry: number };
export type CamKey = Cam & { f: number };

export const camAt = (keys: CamKey[], frame: number, drift = 1): Cam => {
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (frame >= keys[i].f && frame <= keys[i + 1].f) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
  }
  const t = frame <= keys[0].f ? 0 : frame >= keys[keys.length - 1].f ? 1 : interpolate(frame, [a.f, b.f], [0, 1], { easing: ease.cam });
  const lerp = (k: keyof Cam) => (frame <= keys[0].f ? keys[0][k] : frame >= keys[keys.length - 1].f ? keys[keys.length - 1][k] : a[k] + (b[k] - a[k]) * t);
  // The camera is never fully still: a slow handheld-free drift on top of every move.
  return {
    s: lerp("s") * (1 + 0.004 * Math.sin(frame / 53) * drift),
    fx: lerp("fx") + 5 * Math.sin(frame / 41) * drift,
    fy: lerp("fy") + 3.5 * Math.cos(frame / 59) * drift,
    rx: lerp("rx") + 0.35 * Math.sin(frame / 71) * drift,
    ry: lerp("ry") + 0.45 * Math.cos(frame / 67) * drift,
  };
};

// ---------- Background: the wall, with window light ----------
export const Wall: React.FC<{ look: Look; cam: Cam }> = ({ look, cam }) => {
  // Parallax: the wall moves at a fraction of the camera.
  const px = -(cam.fx - PANEL.w / 2) * 0.32;
  const py = -(cam.fy - PANEL.h / 2) * 0.32;
  const sc = 1 + (cam.s - 1) * 0.1;
  const panes = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: look.wallFar }}>
      <div
        style={{
          position: "absolute",
          left: -240,
          top: -160,
          width: 2400,
          height: 1400,
          transform: `translate(${px}px, ${py}px) scale(${sc})`,
          background: `radial-gradient(110% 95% at 32% 30%, ${look.wall} 0%, ${look.wall} 30%, ${look.wallFar} 100%)`,
        }}
      >
        {look.lightOp > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: look.paneX + 240,
              top: look.paneY + 160,
              width: 760,
              height: 900,
              transform: `skewX(${look.skew}deg)`,
              filter: `blur(${look.paneBlur}px)`,
              opacity: look.lightOp,
              mixBlendMode: "screen",
            }}
          >
            {panes.map(([cx, cy], i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx * 392,
                  top: cy * 462,
                  width: 368,
                  height: 438,
                  background: `radial-gradient(120% 120% at 30% 20%, ${look.light} 0%, ${look.light}cc 55%, ${look.light}55 100%)`,
                }}
              />
            ))}
          </div>
        ) : null}
        {look.glowOp > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: 240 + 960 - 1100,
              top: 160 + 540 - 760,
              width: 2200,
              height: 1520,
              background: `radial-gradient(50% 50% at 50% 50%, ${look.glow} 0%, transparent 70%)`,
              opacity: look.glowOp,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

// Window-frame shadow and warm cast falling across the screen itself.
export const PanelLight: React.FC<{ look: Look; frame: number }> = ({ look, frame }) => {
  if (look.shadowOp < 0.002 && look.tintOp < 0.002) return null;
  const drift = frame * 0.12; // the sun moves
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 26 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(130% 110% at 10% 0%, ${look.tint} 0%, ${look.tint} 35%, transparent 100%)`,
          opacity: look.tintOp,
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 760 + drift + look.skew * 6,
          top: -200,
          width: 30,
          height: 1400,
          background: look.shadow,
          opacity: look.shadowOp * 1.4,
          transform: `skewX(${look.skew}deg)`,
          filter: "blur(14px)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -200,
          top: 250 + drift * 0.3,
          width: 1800,
          height: 26,
          background: look.shadow,
          opacity: look.shadowOp * 1.2,
          transform: `skewY(${-look.skew * 0.25}deg)`,
          filter: "blur(14px)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(118deg, transparent 0%, transparent 52%, ${look.shadow} 100%)`,
          opacity: look.shadowOp * 1.1,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
};

// ---------- Camera rig: UI lives on a plane in 3D space ----------
export const CameraRig: React.FC<{ cam: Cam; children: React.ReactNode; look: Look; dark: boolean }> = ({ cam, children, look, dark }) => (
  <div style={{ position: "absolute", inset: 0, perspective: 2600, perspectiveOrigin: "50% 50%" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: PANEL.w,
        height: PANEL.h,
        transformOrigin: "0 0",
        transform: `translate(960px, 540px) scale(${cam.s}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) translate(${-cam.fx}px, ${-cam.fy}px)`,
        borderRadius: 26,
        boxShadow: dark
          ? `0 0 0 1px rgba(255,255,255,0.05), 0 0 140px 30px ${look.glow}${Math.round(look.glowOp * 120)
              .toString(16)
              .padStart(2, "0")}, 0 40px 120px rgba(0,0,0,0.6)`
          : "0 0 0 1px rgba(30,22,12,0.06), 0 2px 6px rgba(30,22,12,0.06), 0 40px 110px rgba(50,34,18,0.20)",
      }}
    >
      {children}
    </div>
  </div>
);

export const Vignette: React.FC<{ amount: number }> = ({ amount }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: `radial-gradient(120% 100% at 50% 48%, transparent 52%, rgba(10,8,6,${amount}) 100%)`,
    }}
  />
);
