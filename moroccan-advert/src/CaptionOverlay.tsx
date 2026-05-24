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
  spring,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { ARABIC_FONT } from "./arabicFont";

const SWITCH_EVERY_MS = 1800;
const ACTIVE_BG = "#FFD000";
const ACTIVE_FG = "#1A1000";

const CaptionPage: React.FC<{
  page: ReturnType<typeof createTikTokStyleCaptions>["pages"][number];
}> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = page.startMs + currentTimeMs;

  const enterSpring = spring({
    fps,
    frame,
    config: { damping: 26, stiffness: 280, mass: 0.55 },
    from: 0,
    to: 1,
  });

  const translateY = interpolate(enterSpring, [0, 1], [28, 0]);
  const scale = interpolate(enterSpring, [0, 1], [0.93, 1]);

  return (
    <div
      style={{
        opacity: enterSpring,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.52)",
          borderRadius: 20,
          paddingLeft: 22,
          paddingRight: 22,
          paddingTop: 14,
          paddingBottom: 14,
          maxWidth: 640,
        }}
      >
        <div
          style={{
            direction: "rtl",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 5,
            lineHeight: 1.55,
          }}
        >
          {page.tokens.map((token, i) => {
            const isActive =
              token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
            const word = token.text.trim();

            return (
              <span
                key={i}
                style={{
                  fontFamily: ARABIC_FONT,
                  fontSize: 54,
                  fontWeight: 900,
                  lineHeight: 1.55,
                  background: isActive ? ACTIVE_BG : "transparent",
                  color: isActive ? ACTIVE_FG : "#FFFFFF",
                  borderRadius: isActive ? 10 : 0,
                  paddingLeft: isActive ? 12 : 0,
                  paddingRight: isActive ? 12 : 0,
                  paddingTop: isActive ? 2 : 0,
                  paddingBottom: isActive ? 2 : 0,
                  textShadow: isActive
                    ? "none"
                    : "0 1px 8px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.7)",
                  display: "inline-block",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
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
        paddingBottom: 130,
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
