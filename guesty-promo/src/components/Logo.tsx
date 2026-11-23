import React, { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { fontFamily } from "../brand";
import { logoSrc } from "../assets";

const SVG_RATIO = 443.5 / 116.39; // viewBox of the guesty.com header logo

let cached: string | null = null;
let pending: Promise<string> | null = null;

const loadSvg = (src: string) => {
  if (!pending) {
    pending = fetch(src)
      .then((r) => r.text())
      .then((t) => {
        // Inline the SVG so `currentColor` follows the `color` prop.
        cached = t
          .replace(/<\?xml[^>]*>/, "")
          .replace(/<svg([^>]*?)\sstyle="[^"]*"/, "<svg$1")
          .replace("<svg", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
        return cached;
      });
  }
  return pending;
};

/**
 * Logo — renders public/guesty-logo.svg in any color. If the file is missing it falls back
 * to a plain text wordmark "guesty" in the brand font (no invented logo mark).
 */
export const Logo: React.FC<{ width: number; color: string; style?: React.CSSProperties }> = ({
  width,
  color,
  style,
}) => {
  const src = logoSrc();
  const [svg, setSvg] = useState<string | null>(cached);
  const [handle] = useState(() => (src && !cached ? delayRender("Loading guesty-logo.svg") : null));

  useEffect(() => {
    if (!src || cached) return;
    loadSvg(src)
      .then((t) => {
        setSvg(t);
        if (handle !== null) continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [src, handle]);

  if (src) {
    return (
      <div
        style={{ width, height: width / SVG_RATIO, color, ...style }}
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
    );
  }

  return (
    <div
      style={{
        fontFamily,
        fontWeight: 800,
        fontSize: width * 0.3,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color,
        width,
        textAlign: "center",
        ...style,
      }}
    >
      guesty
    </div>
  );
};
