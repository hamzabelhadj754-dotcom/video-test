// TRAZO project toolkit: reusable drawn elements (seeded, deterministic)
(function () {
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  // Line-art e-bike, side view. Origin = rear axle. Returns SVG inner markup.
  function bike({ stroke = '#F2EFE8', accent = '#FF5A1F', sw = 6, spokes = true } = {}) {
    const R = 150, F = 560;
    const wheel = (cx, hub) => {
      let s = `<circle cx="${cx}" cy="0" r="${R}" stroke-width="${sw * 2.2}"/>` +
              `<circle cx="${cx}" cy="0" r="${R - 22}" stroke-width="${sw * .5}" opacity=".7"/>` +
              `<circle cx="${cx}" cy="0" r="${hub}" stroke-width="${sw}"/>`;
      if (spokes) for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8, b = a + 0.5;
        s += `<line x1="${cx + Math.cos(a) * hub}" y1="${Math.sin(a) * hub}" x2="${cx + Math.cos(b) * (R - 22)}" y2="${Math.sin(b) * (R - 22)}" stroke-width="${sw * .28}" opacity=".55"/>`;
      }
      return s;
    };
    return `<g fill="none" stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      ${wheel(0, 40)}${wheel(F, 16)}
      <path class="bk-frame" d="M 0 0 L 238 12 L 205 -232 M 0 0 L 196 -214 M 238 12 C 300 -40, 420 -150, 468 -205 M 468 -205 L 486 -268 M 470 -205 L ${F} 0" stroke-width="${sw * 1.6}"/>
      <path d="M 486 -268 L 470 -318 L 400 -326 M 470 -318 L 508 -322" stroke-width="${sw * 1.3}"/>
      <path d="M 205 -232 L 198 -262 M 160 -268 C 180 -282, 240 -282, 252 -268 Z" stroke-width="${sw * 1.4}" fill="${stroke}"/>
      <path d="M -30 -150 L 150 -160 M 0 0 L -10 -150 M 150 -160 L 175 -190" stroke-width="${sw * .8}" opacity=".8"/>
      <path d="M 288 -46 C 330 -84, 392 -142, 430 -178" stroke="${accent}" stroke-width="${sw * 4.2}"/>
      <circle cx="238" cy="12" r="34" stroke-width="${sw}"/>
      <path d="M 238 12 L 262 72 M 238 12 L 214 -48" stroke-width="${sw * 1.2}"/>
      <path d="M 0 0 L 238 12" stroke="${accent}" stroke-width="${sw * .7}" stroke-dasharray="3 9"/>
      <circle cx="0" cy="0" r="40" stroke="${accent}" stroke-width="${sw * 1.4}"/>
      <circle cx="490" cy="-252" r="9" fill="${accent}" stroke="none"/>
    </g>`;
  }

  // Film dust / specks layer (seeded)
  function dust(seed = 7, n = 70, color = '#F2EFE8') {
    const r = rng(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const x = r() * 1920, y = r() * 1080, k = r();
      if (k < .75) s += `<circle cx="${x}" cy="${y}" r="${.6 + r() * 1.6}" fill="${color}" opacity="${.15 + r() * .35}"/>`;
      else { const a = r() * 6.28, l = 6 + r() * 26; s += `<path d="M ${x} ${y} q ${Math.cos(a) * l / 2 + 4} ${Math.sin(a) * l / 2 - 3} ${Math.cos(a) * l} ${Math.sin(a) * l}" stroke="${color}" stroke-width=".9" fill="none" opacity="${.12 + r() * .25}"/>`; }
    }
    return `<svg class="dust" viewBox="0 0 1920 1080">${s}</svg>`;
  }

  function barcode(seed = 3, w = 180, h = 34, color = '#0C0D0F') {
    const r = rng(seed); let x = 0, s = '';
    while (x < w) { const bw = [1, 1, 2, 3][Math.floor(r() * 4)]; if (r() > .4) s += `<rect x="${x}" y="0" width="${bw}" height="${h}"/>`; x += bw + 1 + Math.floor(r() * 2); }
    return `<svg width="${w}" height="${h}" fill="${color}">${s}</svg>`;
  }

  const cursor = (c = '#0C0D0F') => `<svg width="46" height="46" viewBox="0 0 46 46"><path d="M4 3 L42 18 L25 24 L19 42 Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/></svg>`;

  window.KIT = { rng, bike, dust, barcode, cursor };
})();
