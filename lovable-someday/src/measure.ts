// Positions measured from probe renders (tools/probe.py).
// Container coords (the prompt layer, before its 1.3x push):
export const HL_RECT = { x: 495, y: 455, w: 593, h: 64, r: 7 };
// Screen coords:
export const LINE_AT_LIFT = { x: 800, y: 746 };
export const BUBBLE = { x: 171, y: 323, w: 412, h: 111 };
export const CARD_ICON = { x: 1355, y: 741, w: 49, h: 48 };
export const NOTE_CHECK = { x: 259, y: 796, w: 47, h: 48 };

// ---- Send transition: one camera pull-back from the prompt box to the chat bubble in the editor ----
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const PUSH = 1.4; // prompt layer scale at the moment of send
const kb = BUBBLE.h / 127; // bubble's on-screen scale vs its CSS size
// anchor = top-left of the first text line
export const BUB_ANCHOR = { x: BUBBLE.x + 31 * kb, y: BUBBLE.y + 26 * kb };
const BOX_TEXT = { x: HL_RECT.x + 10, y: HL_RECT.y + 6 }; // container coords
export const BOX_ANCHOR = { x: 960 + (BOX_TEXT.x - 960) * PUSH, y: 540 + (BOX_TEXT.y - 540) * PUSH };
// zoom at which the bubble's text is the same size as the prompt's text
export const S0 = (42 * PUSH) / (29 * kb);
const toCont = (x: number, y: number) => ({ x: 960 + (x - 960) / PUSH, y: 540 + (y - 540) / PUSH });
const tl = toCont(BOX_ANCHOR.x + (BUBBLE.x - BUB_ANCHOR.x) * S0, BOX_ANCHOR.y + (BUBBLE.y - BUB_ANCHOR.y) * S0);
// the bubble's shape, expressed in the prompt box's own coordinates at the start of the move
export const BOX_TARGET = { x: tl.x, y: tl.y, w: (BUBBLE.w * S0) / PUSH, h: (BUBBLE.h * S0) / PUSH, r: (28 * kb * S0) / PUSH };

export const pullback = (e: number) => {
  const S = Math.pow(S0, 1 - e);
  const ax = lerp(BOX_ANCHOR.x, BUB_ANCHOR.x, e);
  const ay = lerp(BOX_ANCHOR.y, BUB_ANCHOR.y, e);
  const r = S / S0;
  return {
    world: `translate(${ax - BUB_ANCHOR.x * S}px, ${ay - BUB_ANCHOR.y * S}px) scale(${S})`,
    box: `translate(${ax - BOX_ANCHOR.x * r}px, ${ay - BOX_ANCHOR.y * r}px) scale(${r})`,
  };
};
