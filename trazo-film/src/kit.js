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

  // One icon family: 24-unit grid, 1.8 stroke, round caps (Apple SF-symbol feel, drawn from scratch)
  const ICONS = {
    campus: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 2.2 12 2.2 12 0v-5"/><path d="M22 9v5"/>',
    social: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 15.5s-3-2-3-4a1.5 1.5 0 0 1 3-.8 1.5 1.5 0 0 1 3 .8c0 2-3 4-3 4z"/>',
    handshake: '<path d="M10 13.5a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10.5a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14.5h3"/>',
    app: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M9.5 6h5"/><circle cx="12" cy="17.5" r=".9"/>',
    survey: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V3h6v1"/><path d="M9 13l2 2 4-4"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M3 20h18"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14c2.8.2 4.5 2.3 4.5 5"/>',
    box: '<path d="M3 7.5l9-4.5 9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
    customer: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    kpi: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    oneone: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 20c0-3 2.5-5.5 5.5-5.5S13.5 17 13.5 20M10.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5"/>',
    medal: '<circle cx="12" cy="15" r="5"/><path d="M8.5 3l3.5 7 3.5-7"/><path d="M12 13v4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    battery: '<rect x="2.5" y="7" width="17" height="10" rx="2.5"/><path d="M22 10.5v3"/><path d="M6 10.5v3M9.5 10.5v3"/>',
    speed: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.2"/>',
    flag: '<path d="M5 21V3"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    euro: '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5"/><path d="M4 10.5h9M4 13.5h9"/>',
    percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  };
  const icon = (name, color = '#FF5A1F', size = 26, sw = 1.8) =>
    `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;

  window.KIT = { rng, bike, dust, barcode, cursor, icon };
})();
