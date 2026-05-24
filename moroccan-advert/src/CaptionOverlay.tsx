import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AbsoluteFill,
  staticFile,
  delayRender,
  continueRender,
  cancelRender,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  interpolate,
  Easing,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { ARABIC_FONT_FAMILY } from "./arabicFont";

const SWITCH_EVERY_MS = 1200;
const HIGHLIGHT = "#FFD700";

const CaptionPage: React.FC<{
  page: ReturnType<typeof createTikTokStyleCaptions>["pages"][number];
}> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = page.startMs + currentTimeMs;

  const progress = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const translateY = interpolate(progress, [0, 1], [18, 0]);

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${translateY}px)`,
        direction: "rtl",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.55)",
          borderRadius: 20,
          paddingLeft: 28,
          paddingRight: 28,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: ARABIC_FONT_FAMILY,
            fontSize: 46,
            fontWeight: 700,
            lineHeight: 1.3,
            whiteSpace: "pre",
          }}
        >
          {page.tokens.map((token) => {
            const isActive =
              token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
            return (
              <span
                key={token.fromMs}
                style={{
                  color: isActive ? HIGHLIGHT : "#FFFFFF",
                  textShadow: isActive
                    ? "0 0 16px rgba(255,215,0,0.6)"
                    : "0 2px 8px rgba(0,0,0,0.8)",
                }}
              >
                {token.text}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
};

export const CaptionOverlay: React.FC = () => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [handle] = useState(() => delayRender("Loading captions"));
  const { fps } = useVideoConfig();

  const fetchCaptions = useCallback(async () => {
    try {
      const res = await fetch(staticFile("captions.json"));
      const data = await res.json();
      setCaptions(data);
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [handle]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  const { pages } = useMemo(() => {
    if (!captions) return { pages: [] };
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: SWITCH_EVERY_MS,
    });
  }, [captions]);

  if (!captions) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 140,
      }}
    >
      {pages.map((page, i) => {
        const nextPage = pages[i + 1] ?? null;
        const startFrame = (page.startMs / 1000) * fps;
        const endFrame = Math.min(
          nextPage ? (nextPage.startMs / 1000) * fps : Infinity,
          startFrame + (SWITCH_EVERY_MS / 1000) * fps
        );
        const durationInFrames = Math.ceil(endFrame - startFrame);
        if (durationInFrames <= 0) return null;

        return (
          <Sequence
            key={i}
            from={Math.floor(startFrame)}
            durationInFrames={durationInFrames}
            layout="none"
          >
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
