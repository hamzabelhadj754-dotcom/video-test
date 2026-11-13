// Canvas artwork for the fictional apps built in the ad (original designs, not real products).
export const SW = 1000, SH = 2172;
export function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
export function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function statusBar(x, col = '#1B1B1B') {
  x.fillStyle = col; x.font = '700 42px Hanken'; x.textAlign = 'left'; x.fillText('9:41', 80, 98);
  x.fillStyle = '#050608'; rr(x, SW / 2 - 130, 40, 260, 78, 39); x.fill();
  x.fillStyle = col; for (let i = 0; i < 4; i++) { rr(x, 790 + i * 22, 86 - i * 7, 14, 12 + i * 7, 3); x.fill(); }
  rr(x, 890, 70, 52, 28, 7); x.strokeStyle = col; x.lineWidth = 3; x.stroke(); rr(x, 894, 74, 36, 20, 4); x.fill();
}
function homeBar(x, col = '#1B1B1B') { x.fillStyle = col; rr(x, SW / 2 - 140, SH - 40, 280, 10, 5); x.fill(); }
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------------- Rosa's Bakery ----------------
const B = { cream: '#FBF6EE', terra: '#C65D3B', brown: '#3B2A20', muted: '#8A7765', butter: '#F3D9A4', line: '#EADFCF' };
export function drawCake(x, X, Y, w, h) {
  x.save(); rr(x, X, Y, w, h, Math.min(w, h) * .07); x.clip();
  const g = x.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, '#F8E3BE'); g.addColorStop(1, '#F1C9A5'); x.fillStyle = g; x.fillRect(X, Y, w, h);
  const k = Math.min(w / 880, h / 640); x.translate(X + w / 2, Y + h * .56); x.scale(k, k);
  // stand
  x.fillStyle = 'rgba(80,40,20,.15)'; x.beginPath(); x.ellipse(0, 230, 300, 40, 0, 0, 7); x.fill();
  x.fillStyle = '#FFFFFF'; rr(x, -26, 120, 52, 110, 10); x.fill(); x.beginPath(); x.ellipse(0, 228, 120, 22, 0, 0, 7); x.fill();
  x.beginPath(); x.ellipse(0, 122, 270, 34, 0, 0, 7); x.fill(); x.fillStyle = '#EDE7DF'; x.beginPath(); x.ellipse(0, 130, 262, 26, 0, 0, Math.PI); x.fill();
  // layers
  const layer = (y, hh, col) => { x.fillStyle = col; x.fillRect(-210, y, 420, hh); x.beginPath(); x.ellipse(0, y + hh, 210, 30, 0, 0, Math.PI); x.fill(); };
  layer(-30, 70, '#E3B47A'); layer(-50, 22, '#FFF4E6'); layer(-120, 70, '#E8BE86'); layer(-140, 22, '#FFF4E6');
  // top cream + drips
  x.fillStyle = '#FFF6EA'; x.beginPath(); x.ellipse(0, -140, 210, 34, 0, 0, 7); x.fill();
  for (let i = 0; i < 9; i++) { const dx = -190 + i * 47; const dl = 25 + (i * 37 % 40); rr(x, dx, -142, 22, dl, 11); x.fill(); }
  // strawberries
  seed = 3;
  for (let i = 0; i < 7; i++) {
    const sx = -150 + i * 50 + (rnd() - .5) * 14, sy = -165 + (rnd() - .5) * 10;
    x.fillStyle = '#D9304A'; x.beginPath(); x.moveTo(sx, sy - 26); x.bezierCurveTo(sx + 26, sy - 24, sx + 22, sy + 14, sx, sy + 26); x.bezierCurveTo(sx - 22, sy + 14, sx - 26, sy - 24, sx, sy - 26); x.fill();
    x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.ellipse(sx - 7, sy - 8, 5, 9, -.4, 0, 7); x.fill();
    x.fillStyle = '#4E8A3E'; x.beginPath(); x.ellipse(sx, sy - 28, 14, 6, 0, 0, 7); x.fill();
  }
  x.restore();
}
export function bakeryBase() {
  const c = cnv(SW, SH), x = c.getContext('2d'); x.fillStyle = B.cream; x.fillRect(0, 0, SW, SH); statusBar(x, B.brown);
  x.fillStyle = B.terra; x.beginPath(); x.arc(110, 175, 34, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.font = '700 38px Fraunces'; x.textAlign = 'center'; x.fillText('R', 110, 189);
  x.fillStyle = B.brown; x.font = '600 40px Fraunces'; x.textAlign = 'left'; x.fillText('Rosa’s', 162, 189);
  x.fillStyle = B.brown; [0, 1, 2].forEach(i => { rr(x, 860, 158 + i * 14, 44, 5, 3); x.fill(); });
  // tab bar
  x.fillStyle = '#FFFFFF'; rr(x, 40, 1940, 920, 140, 70); x.fill();
  ['Home', 'Menu', 'Book', 'Me'].forEach((l, i) => { x.fillStyle = i === 2 ? B.terra : B.muted; x.font = '600 30px Hanken'; x.textAlign = 'center'; x.fillText(l, 155 + i * 230, 2022); });
  homeBar(x, B.brown); return c;
}
// pieces: [name, rect, draw(ctx,w,h)]
export const BAKERY_PIECES = [
  ['photo', [60, 240, 880, 620], (x, w, h) => { drawCake(x, 0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.92)'; rr(x, 34, 34, 240, 64, 32); x.fill(); x.fillStyle = B.brown; x.font = '600 30px Hanken'; x.textAlign = 'center'; x.fillText('Since 1974', 154, 77); }],
  ['title', [60, 890, 880, 210], (x, w, h) => {
    x.fillStyle = B.brown; x.font = '600 96px Fraunces'; x.textAlign = 'left'; x.fillText('Rosa’s Bakery', 0, 92);
    x.fillStyle = B.muted; x.font = '500 36px Hanken'; x.fillText('Fresh bread & cakes · Via Roma 12', 0, 156);
    x.fillStyle = B.terra; x.font = '700 32px Hanken'; x.fillText('★ 4.9', 0, 206); x.fillStyle = B.muted; x.font = '500 32px Hanken'; x.fillText('· 212 neighbours love it', 96, 206);
  }],
  ['days', [60, 1125, 880, 250], (x, w, h) => {
    x.fillStyle = '#FFFFFF'; rr(x, 0, 0, w, h, 40); x.fill();
    x.fillStyle = B.brown; x.font = '700 34px Hanken'; x.textAlign = 'left'; x.fillText('Pick a day', 40, 62);
    const d = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    d.forEach((l, i) => {
      const cx = 40 + i * 118, sel = i === 3;
      x.fillStyle = sel ? B.terra : '#F6EFE4'; rr(x, cx, 90, 102, 132, 26); x.fill();
      x.fillStyle = sel ? '#fff' : B.muted; x.font = '600 26px Hanken'; x.textAlign = 'center'; x.fillText(l, cx + 51, 136);
      x.fillStyle = sel ? '#fff' : B.brown; x.font = '700 40px Hanken'; x.fillText(String(12 + i), cx + 51, 192);
    });
  }],
  ['slots', [60, 1400, 880, 200], (x, w, h) => {
    x.fillStyle = B.brown; x.font = '700 34px Hanken'; x.textAlign = 'left'; x.fillText('Time', 0, 46);
    ['8:30', '10:00', '11:30', '13:00'].forEach((l, i) => {
      const sel = i === 2; x.fillStyle = sel ? B.brown : '#FFFFFF'; rr(x, i * 222, 84, 200, 96, 48); x.fill();
      if (!sel) { x.strokeStyle = B.line; x.lineWidth = 3; x.stroke(); }
      x.fillStyle = sel ? '#fff' : B.brown; x.font = '600 36px Hanken'; x.textAlign = 'center'; x.fillText(l, i * 222 + 100, 145);
    });
  }],
  ['button', [60, 1660, 880, 160], (x, w, h) => {
    x.fillStyle = B.terra; rr(x, 0, 0, w, h, 80); x.fill();
    x.fillStyle = '#fff'; x.font = '700 52px Hanken'; x.textAlign = 'center'; x.fillText('Book a table  →', w / 2, 98);
  }],
];
export function pieceCanvas(p) { const [, r, f] = p; const c = cnv(r[2], r[3]), x = c.getContext('2d'); f(x, r[2], r[3]); return c; }

export function bakeryDesktop() {
  const W = 1600, H = 1000, c = cnv(W, H), x = c.getContext('2d');
  x.fillStyle = B.cream; x.fillRect(0, 0, W, H);
  x.fillStyle = '#EFE9E0'; x.fillRect(0, 0, W, 74);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { x.fillStyle = col; x.beginPath(); x.arc(40 + i * 34, 37, 11, 0, 7); x.fill(); });
  x.fillStyle = '#FFFFFF'; rr(x, 520, 16, 560, 42, 21); x.fill(); x.fillStyle = '#6B6158'; x.font = '500 22px "JetBrains Mono"'; x.textAlign = 'center'; x.fillText('rosasbakery.lovable.app', 800, 44);
  drawCake(x, 60, 120, 760, 820);
  x.textAlign = 'left'; x.fillStyle = B.brown; x.font = '600 96px Fraunces'; x.fillText('Rosa’s', 880, 250); x.fillText('Bakery', 880, 350);
  x.fillStyle = B.muted; x.font = '500 30px Hanken'; x.fillText('Fresh bread & cakes since 1974.', 884, 410); x.fillText('Book a table for coffee and cake.', 884, 452);
  ['Thu 15', 'Fri 16', 'Sat 17'].forEach((l, i) => { const sel = i === 0; x.fillStyle = sel ? B.terra : '#fff'; rr(x, 884 + i * 200, 520, 184, 84, 20); x.fill(); x.fillStyle = sel ? '#fff' : B.brown; x.font = '600 32px Hanken'; x.textAlign = 'center'; x.fillText(l, 976 + i * 200, 574); });
  ['10:00', '11:30', '13:00'].forEach((l, i) => { const sel = i === 1; x.fillStyle = sel ? B.brown : '#fff'; rr(x, 884 + i * 200, 630, 184, 76, 38); x.fill(); x.fillStyle = sel ? '#fff' : B.brown; x.font = '600 30px Hanken'; x.textAlign = 'center'; x.fillText(l, 976 + i * 200, 680); });
  x.fillStyle = B.terra; rr(x, 884, 750, 584, 110, 55); x.fill(); x.fillStyle = '#fff'; x.font = '700 40px Hanken'; x.fillText('Book a table  →', 1176, 818);
  return c;
}

// ---------------- Sunday League ----------------
export function leagueScreen() {
  const c = cnv(SW, SH), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#12503A'); g.addColorStop(1, '#0A2E22'); x.fillStyle = g; x.fillRect(0, 0, SW, SH);
  x.strokeStyle = 'rgba(255,255,255,.06)'; x.lineWidth = 4; x.beginPath(); x.arc(SW / 2, 2100, 260, 0, 7); x.stroke(); x.beginPath(); x.moveTo(0, 2100); x.lineTo(SW, 2100); x.stroke();
  statusBar(x, '#fff');
  x.fillStyle = '#fff'; x.font = '700 92px Hanken'; x.textAlign = 'left'; x.fillText('Sunday League', 70, 300);
  x.fillStyle = '#C9F27B'; rr(x, 70, 340, 200, 64, 32); x.fill(); x.fillStyle = '#0A2E22'; x.font = '700 30px Hanken'; x.textAlign = 'center'; x.fillText('Week 12', 170, 383);
  x.fillStyle = 'rgba(255,255,255,.55)'; x.font = '600 28px Hanken'; x.textAlign = 'left'; x.fillText('#', 90, 500); x.fillText('TEAM', 170, 500); x.textAlign = 'right'; x.fillText('P', 700, 500); x.fillText('W', 800, 500); x.fillText('PTS', 920, 500);
  const rows = [['Red Lions', '#E5484D', 11, 9, 27], ['Park Rangers', '#3E9BFF', 11, 8, 24], ['FC Bakehouse', '#F3B03A', 11, 7, 21], ['Dog & Duck', '#B07CFF', 11, 6, 18], ['Northside', '#2EC4B6', 11, 5, 15], ['Old Boys', '#E8E8E8', 11, 4, 12]];
  rows.forEach(([n, col, p, w, pts], i) => {
    const y = 540 + i * 150, hi = i === 2;
    x.fillStyle = hi ? 'rgba(201,242,123,.16)' : 'rgba(255,255,255,.06)'; rr(x, 60, y, 880, 130, 30); x.fill();
    x.fillStyle = '#fff'; x.font = '700 40px Hanken'; x.textAlign = 'left'; x.fillText(String(i + 1), 92, y + 80);
    x.fillStyle = col; x.beginPath(); x.arc(196, y + 66, 22, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.font = '600 40px Hanken'; x.fillText(n, 236, y + 80);
    x.font = '500 38px Hanken'; x.textAlign = 'right'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText(p, 700, y + 80); x.fillText(w, 800, y + 80);
    x.fillStyle = '#fff'; x.font = '800 42px Hanken'; x.fillText(pts, 920, y + 80);
  });
  x.fillStyle = '#C9F27B'; rr(x, 60, 1530, 880, 230, 44); x.fill();
  x.fillStyle = '#0A2E22'; x.textAlign = 'left'; x.font = '600 30px Hanken'; x.fillText('NEXT MATCH', 110, 1600);
  x.font = '800 54px Hanken'; x.fillText('Sun 10:00 vs Red Lions', 110, 1680); x.font = '600 32px Hanken'; x.fillText('Riverside Park · pitch 3', 110, 1730);
  homeBar(x, '#fff'); return c;
}
// ---------------- Plant Pals ----------------
function leaf(x, cx, cy, s, col, rot) { x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = col; x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(s * .6, -s * .3, s * .7, -s * .9, 0, -s * 1.2); x.bezierCurveTo(-s * .7, -s * .9, -s * .6, -s * .3, 0, 0); x.fill(); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -4); x.lineTo(0, -s * 1.05); x.stroke(); x.restore(); }
function pot(x, cx, cy, col) { x.fillStyle = col; x.beginPath(); x.moveTo(cx - 60, cy); x.lineTo(cx + 60, cy); x.lineTo(cx + 46, cy + 90); x.lineTo(cx - 46, cy + 90); x.closePath(); x.fill(); x.fillStyle = 'rgba(0,0,0,.1)'; x.fillRect(cx - 62, cy, 124, 16); }
export function plantsScreen() {
  const c = cnv(SW, SH), x = c.getContext('2d'); x.fillStyle = '#EEF3EA'; x.fillRect(0, 0, SW, SH); statusBar(x, '#21352A');
  x.fillStyle = '#21352A'; x.font = '600 100px Fraunces'; x.textAlign = 'left'; x.fillText('Plant pals', 70, 300);
  x.fillStyle = '#5E7566'; x.font = '500 36px Hanken'; x.fillText('3 friends, 1 needs you today', 74, 362);
  const cards = [['Monty', 'Monstera', 'Water today', '#3E9BFF', '#2F7D55', '#E7B48F', 1], ['Fernando', 'Boston fern', 'In 2 days', '#9BB0A2', '#4E9A5E', '#C9A27E', 0], ['Spike', 'Cactus', 'In 9 days', '#9BB0A2', '#6FA36B', '#D88C5A', 0]];
  cards.forEach(([n, sp, when, bc, lc, pc, urgent], i) => {
    const y = 440 + i * 400; x.fillStyle = '#FFFFFF'; rr(x, 60, y, 880, 360, 48); x.fill();
    x.fillStyle = '#F2F6EF'; rr(x, 90, y + 30, 300, 300, 36); x.fill();
    pot(x, 240, y + 200, pc);
    if (i === 2) { x.fillStyle = lc; rr(x, 205, y + 70, 70, 150, 35); x.fill(); rr(x, 160, y + 120, 40, 70, 20); x.fill(); rr(x, 280, y + 100, 40, 80, 20); x.fill(); }
    else for (let k = 0; k < 6; k++) leaf(x, 240, y + 205, i === 0 ? 120 : 95, lc, -1.1 + k * .44);
    x.fillStyle = '#21352A'; x.font = '600 60px Fraunces'; x.textAlign = 'left'; x.fillText(n, 430, y + 120);
    x.fillStyle = '#5E7566'; x.font = '500 34px Hanken'; x.fillText(sp, 432, y + 172);
    x.fillStyle = urgent ? '#3E9BFF' : '#EEF3EA'; rr(x, 430, y + 220, 300, 76, 38); x.fill();
    x.fillStyle = urgent ? '#fff' : '#5E7566'; x.font = '700 32px Hanken'; x.fillText(when, urgent ? 490 : 456, y + 270); if (urgent) { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(462, y + 238); x.quadraticCurveTo(478, y + 262, 462, y + 276); x.quadraticCurveTo(446, y + 262, 462, y + 238); x.fill(); }
  });
  x.fillStyle = '#21352A'; rr(x, 60, 1700, 880, 150, 75); x.fill(); x.fillStyle = '#fff'; x.font = '700 48px Hanken'; x.textAlign = 'center'; x.fillText('Mark Monty as watered', SW / 2, 1790);
  homeBar(x, '#21352A'); return c;
}
// ---------------- Velvet Static merch ----------------
function tee(x, cx, cy, s, col) { x.fillStyle = col; x.beginPath(); x.moveTo(cx - s * .35, cy - s * .5); x.lineTo(cx - s * .1, cy - s * .55); x.quadraticCurveTo(cx, cy - s * .45, cx + s * .1, cy - s * .55); x.lineTo(cx + s * .35, cy - s * .5); x.lineTo(cx + s * .55, cy - s * .25); x.lineTo(cx + s * .38, cy - s * .15); x.lineTo(cx + s * .35, cy + s * .5); x.lineTo(cx - s * .35, cy + s * .5); x.lineTo(cx - s * .38, cy - s * .15); x.lineTo(cx - s * .55, cy - s * .25); x.closePath(); x.fill(); }
export function merchScreen() {
  const c = cnv(SW, SH), x = c.getContext('2d'); x.fillStyle = '#0E0E10'; x.fillRect(0, 0, SW, SH); statusBar(x, '#fff');
  x.fillStyle = '#fff'; x.font = '900 112px Anybody'; x.fontStretch = 'ultra-expanded'; x.textAlign = 'left'; x.fillText('VELVET', 64, 300); x.fillText('STATIC', 64, 410); x.fontStretch = 'normal';
  x.fillStyle = '#FF3DA6'; x.font = '700 32px Hanken'; x.fillText('TOUR MERCH · LIMITED', 70, 470);
  const items = [['Tour tee', '$25'], ['Tote bag', '$15'], ['Debut LP', '$30'], ['Dad cap', '$20']];
  items.forEach(([n, p], i) => {
    const cx = 60 + (i % 2) * 450, cy = 530 + Math.floor(i / 2) * 560; x.fillStyle = '#1C1C20'; rr(x, cx, cy, 430, 520, 40); x.fill();
    const mx = cx + 215, my = cy + 210;
    if (i === 0) { tee(x, mx, my, 280, '#FF3DA6'); x.fillStyle = '#0E0E10'; x.font = '900 34px Anybody'; x.textAlign = 'center'; x.fillText('VS', mx, my + 20); }
    if (i === 1) { x.fillStyle = '#F2EDE4'; rr(x, mx - 100, my - 70, 200, 220, 10); x.fill(); x.strokeStyle = '#F2EDE4'; x.lineWidth = 14; x.beginPath(); x.arc(mx, my - 70, 60, Math.PI, 0); x.stroke(); x.fillStyle = '#0E0E10'; x.font = '900 40px Anybody'; x.textAlign = 'center'; x.fillText('VS', mx, my + 50); }
    if (i === 2) { x.fillStyle = '#000'; x.beginPath(); x.arc(mx, my, 140, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 2; for (let k = 50; k < 140; k += 12) { x.beginPath(); x.arc(mx, my, k, 0, 7); x.stroke(); } x.fillStyle = '#FF3DA6'; x.beginPath(); x.arc(mx, my, 46, 0, 7); x.fill(); x.fillStyle = '#000'; x.beginPath(); x.arc(mx, my, 6, 0, 7); x.fill(); }
    if (i === 3) { x.fillStyle = '#3A3AFF'; x.beginPath(); x.arc(mx, my + 30, 120, Math.PI, 0); x.fill(); x.fillRect(mx - 120, my + 26, 240, 10); x.beginPath(); x.ellipse(mx + 110, my + 36, 90, 20, 0, 0, 7); x.fill(); }
    x.fillStyle = '#fff'; x.font = '600 38px Hanken'; x.textAlign = 'left'; x.fillText(n, cx + 36, cy + 440); x.fillStyle = '#FF3DA6'; x.font = '800 38px Hanken'; x.textAlign = 'right'; x.fillText(p, cx + 396, cy + 440);
  });
  x.fillStyle = '#FF3DA6'; rr(x, 60, 1700, 880, 150, 75); x.fill(); x.fillStyle = '#0E0E10'; x.font = '800 48px Hanken'; x.textAlign = 'center'; x.fillText('Add to cart · 1 item', SW / 2, 1790);
  homeBar(x, '#fff'); return c;
}
