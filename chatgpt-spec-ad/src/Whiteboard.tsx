import React from "react";
import { F } from "./theme";

// A phone photo of a real-looking office whiteboard, drawn for this film.
// The content matches the Monday plan ChatGPT returns in scene 2.
export const Whiteboard: React.FC<{ w: number; h: number; radius?: number }> = ({ w, h, radius = 14 }) => {
  const blue = "#2A4FA8";
  const black = "#1E1E22";
  const red = "#C2412F";
  return (
    <div style={{ width: w, height: h, borderRadius: radius, overflow: "hidden", position: "relative", background: "#9B958C" }}>
      <svg width={w} height={h} viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
        <defs>
          <linearGradient id="wbg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6F5F0" />
            <stop offset="0.6" stopColor="#ECEAE3" />
            <stop offset="1" stopColor="#DCD9D0" />
          </linearGradient>
          <linearGradient id="refl" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="vig" cx="0.45" cy="0.4" r="0.8">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#2a2016" stopOpacity="0.38" />
          </radialGradient>
          <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="0.35" />
          </filter>
          <filter id="smudge">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {/* wall behind the board */}
        <rect width="600" height="400" fill="#A9A298" />
        <g transform="rotate(-2.4 300 200)">
          {/* aluminium frame */}
          <rect x="18" y="12" width="572" height="380" rx="6" fill="#C9C8C4" />
          <rect x="26" y="20" width="556" height="364" rx="3" fill="url(#wbg)" />
          {/* old erased text */}
          <g filter="url(#smudge)" opacity="0.16" fill="#5a6070">
            <rect x="330" y="230" width="190" height="16" rx="8" />
            <rect x="350" y="262" width="140" height="14" rx="7" />
          </g>
          <g filter="url(#ink)" fontFamily={F.hand} fontWeight={700}>
            <text x="56" y="82" fontSize="50" fill={blue} transform="rotate(-1.5 56 82)">
              MONDAY
            </text>
            <path d="M54 94 C 120 90, 180 96, 236 90 M60 102 C 130 99, 170 104, 222 99" stroke={blue} strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <text x="62" y="150" fontSize="34" fill={black}>
              • launch copy!!
            </text>
            <text x="62" y="200" fontSize="34" fill={blue}>
              • pricing page
            </text>
            <path d="M252 190 h 46 m -12 -10 l 12 10 l -12 10" stroke={blue} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="308" y="200" fontSize="34" fill={blue}>
              Sam?
            </text>
            <text x="62" y="252" fontSize="34" fill={black}>
              • QA checkout
            </text>
            <ellipse cx="148" cy="240" rx="104" ry="28" stroke={red} strokeWidth="3" fill="none" transform="rotate(-3 148 240)" />
            <text x="62" y="304" fontSize="34" fill={black}>
              • update team (3pm?)
            </text>
            <rect x="420" y="70" width="120" height="76" rx="6" stroke={black} strokeWidth="2.6" fill="none" transform="rotate(2 480 108)" />
            <text x="452" y="120" fontSize="34" fill={black}>
              v2
            </text>
            <path d="M478 150 C 470 190, 430 205, 392 196" stroke={black} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M400 186 l -10 10 l 13 5" stroke={black} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {/* marker tray */}
          <rect x="120" y="384" width="360" height="10" rx="3" fill="#B8B7B2" />
          <rect x="170" y="377" width="64" height="9" rx="4.5" fill={blue} />
          <rect x="246" y="378" width="58" height="8" rx="4" fill={black} />
          {/* reflection of the ceiling light */}
          <rect x="-40" y="0" width="160" height="400" fill="url(#refl)" transform="translate(330 0) skewX(-22)" opacity="0.7" />
        </g>
        <rect width="600" height="400" fill="url(#vig)" />
        <rect width="600" height="400" fill="#f3d9b0" opacity="0.08" />
      </svg>
    </div>
  );
};
