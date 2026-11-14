// Deterministic muscle cross-section: fibers packed by sunflower spiral, with size-principle thresholds
// (smaller fibers are recruited first, larger ones only as the set gets hard).
export type Fiber = { x: number; y: number; r: number; th: number; z: number };

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const makeBundle = (n = 1150, R = 1.5): Fiber[] => {
  const out: Fiber[] = [];
  for (let i = 0; i < n; i++) {
    const rr = R * Math.sqrt((i + 0.5) / n);
    const a = i * 2.399963;
    const j = 0.01;
    const r = 0.031 + rand(i) * 0.01;
    out.push({
      x: rr * Math.cos(a) + (rand(i + 7) - 0.5) * j,
      y: rr * Math.sin(a) + (rand(i + 13) - 0.5) * j,
      r,
      // threshold mostly by size, plus noise so recruitment looks organic
      th: Math.min(0.999, Math.max(0.001, ((r - 0.031) / 0.01) * 0.7 + rand(i + 29) * 0.3)),
      z: (rand(i + 41) - 0.5) * 0.03,
    });
  }
  return out;
};
