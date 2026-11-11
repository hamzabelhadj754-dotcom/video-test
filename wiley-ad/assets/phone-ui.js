// Wiley phone screen UI — drawn to a 2D canvas as a pure function of time (seconds, global).
// Canvas is 930 x 1990 (1 px = 0.001 scene units on the phone screen).

export const W = 930;
export const H = 1990;

const C = {
  bg: "#07090F",
  bg2: "#0C1328",
  card: "rgba(255,255,255,0.06)",
  cardLine: "rgba(255,255,255,0.10)",
  blue: "#2F6BFF",
  cyan: "#5AC8FA",
  ink: "#F5F7FA",
  slate: "#8A94A6",
  dim: "#4A5366",
  green: "#3DDC97",
};
const DISPLAY = "Sora, Inter, sans-serif";
const TEXT = "Inter, Sora, sans-serif";

// ---------- math helpers ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const cubicInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const backOut = (x) => {
  const c1 = 1.4, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const ein = (t, a, d = 0.6) => expoOut(lin(t, a, a + d));

// ---------- drawing helpers ----------
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function fillRR(ctx, x, y, w, h, r, fill, stroke) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
function text(ctx, s, x, y, size, color, weight = 500, font = TEXT, align = "left") {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y);
}
function wrap(ctx, s, maxW, size, weight = 500, font = TEXT) {
  ctx.font = `${weight} ${size}px ${font}`;
  const words = s.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function orb(ctx, x, y, r, t, glow = 1) {
  // glowing Wiley orb
  const g0 = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.4);
  g0.addColorStop(0, `rgba(47,107,255,${0.55 * glow})`);
  g0.addColorStop(1, "rgba(47,107,255,0)");
  ctx.fillStyle = g0;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  const a = t * 0.9;
  const g = ctx.createLinearGradient(x + Math.cos(a) * r, y + Math.sin(a) * r, x - Math.cos(a) * r, y - Math.sin(a) * r);
  g.addColorStop(0, C.cyan);
  g.addColorStop(0.55, C.blue);
  g.addColorStop(1, "#1B2C8F");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // highlight
  const h = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x - r * 0.35, y - r * 0.4, r * 0.9);
  h.addColorStop(0, "rgba(255,255,255,0.55)");
  h.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = h;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // the W waveform mark inside
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = Math.max(2, r * 0.13);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const s = r * 0.52;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s * 0.45);
  ctx.lineTo(x - s * 0.45, y + s * 0.55);
  ctx.lineTo(x, y - s * 0.15);
  ctx.lineTo(x + s * 0.45, y + s * 0.55);
  ctx.lineTo(x + s, y - s * 0.45);
  ctx.stroke();
  ctx.restore();
}
function check(ctx, x, y, r, p, color = C.blue) {
  // circle + animated tick; p 0..1
  if (p <= 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  const s = backOut(clamp(p * 1.6));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * s, 0, Math.PI * 2);
  ctx.fill();
  const tp = clamp((p - 0.3) / 0.7);
  if (tp > 0) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const pts = [
      [x - r * 0.42, y + r * 0.02],
      [x - r * 0.1, y + r * 0.34],
      [x + r * 0.46, y - r * 0.3],
    ];
    const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    const l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
    let d = tp * (l1 + l2);
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    if (d <= l1) {
      const k = d / l1;
      ctx.lineTo(pts[0][0] + (pts[1][0] - pts[0][0]) * k, pts[0][1] + (pts[1][1] - pts[0][1]) * k);
    } else {
      ctx.lineTo(...pts[1]);
      const k = (d - l1) / l2;
      ctx.lineTo(pts[1][0] + (pts[2][0] - pts[1][0]) * k, pts[1][1] + (pts[2][1] - pts[1][1]) * k);
    }
    ctx.stroke();
  }
}

// simple line icons (24-unit box scaled)
function icon(ctx, kind, x, y, size, color) {
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  const k = size / 24;
  ctx.scale(k, k);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === "cal") {
    ctx.roundRect(3, 5, 18, 16, 3);
    ctx.moveTo(3, 10); ctx.lineTo(21, 10);
    ctx.moveTo(8, 3); ctx.lineTo(8, 7);
    ctx.moveTo(16, 3); ctx.lineTo(16, 7);
  } else if (kind === "mail") {
    ctx.roundRect(3, 5, 18, 14, 3);
    ctx.moveTo(4, 7); ctx.lineTo(12, 13); ctx.lineTo(20, 7);
  } else if (kind === "plane") {
    ctx.moveTo(2, 13); ctx.lineTo(22, 4); ctx.lineTo(15, 21); ctx.lineTo(11, 14); ctx.closePath();
    ctx.moveTo(11, 14); ctx.lineTo(22, 4);
  } else if (kind === "pen") {
    ctx.moveTo(4, 20); ctx.lineTo(5, 15); ctx.lineTo(16, 4); ctx.lineTo(20, 8); ctx.lineTo(9, 19); ctx.closePath();
  } else if (kind === "mic") {
    ctx.roundRect(9, 3, 6, 11, 3);
    ctx.moveTo(5, 11); ctx.quadraticCurveTo(5, 18, 12, 18); ctx.quadraticCurveTo(19, 18, 19, 11);
    ctx.moveTo(12, 18); ctx.lineTo(12, 21);
  } else if (kind === "arrow") {
    ctx.moveTo(12, 19); ctx.lineTo(12, 5);
    ctx.moveTo(6, 11); ctx.lineTo(12, 5); ctx.lineTo(18, 11);
  } else if (kind === "spark") {
    ctx.moveTo(12, 2); ctx.lineTo(14, 10); ctx.lineTo(22, 12); ctx.lineTo(14, 14);
    ctx.lineTo(12, 22); ctx.lineTo(10, 14); ctx.lineTo(2, 12); ctx.lineTo(10, 10); ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- chrome shared by every screen ----------
function background(ctx, t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.75, -120, 40, W * 0.75, -120, 1300);
  g.addColorStop(0, "rgba(47,107,255,0.38)");
  g.addColorStop(0.45, "rgba(30,60,170,0.12)");
  g.addColorStop(1, "rgba(7,9,15,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(W * 0.1, H * 1.05, 20, W * 0.1, H * 1.05, 1000);
  g2.addColorStop(0, "rgba(90,200,250,0.14)");
  g2.addColorStop(1, "rgba(7,9,15,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);
}
function statusBar(ctx) {
  text(ctx, "9:41", 96, 92, 38, C.ink, 600, DISPLAY);
  // dynamic island
  fillRR(ctx, W / 2 - 130, 34, 260, 76, 38, "#000");
  // signal bars
  for (let i = 0; i < 4; i++) fillRR(ctx, 690 + i * 14, 86 - (i + 1) * 9, 9, (i + 1) * 9, 2, C.ink);
  // battery
  rr(ctx, 760, 62, 66, 32, 9);
  ctx.strokeStyle = "rgba(245,247,250,0.6)";
  ctx.lineWidth = 3;
  ctx.stroke();
  fillRR(ctx, 765, 67, 50, 22, 5, C.ink);
  fillRR(ctx, 829, 72, 5, 12, 2, "rgba(245,247,250,0.6)");
}
function homeIndicator(ctx) {
  fillRR(ctx, W / 2 - 140, H - 34, 280, 10, 5, "rgba(245,247,250,0.85)");
}
function inputBar(ctx, t, label = "Ask Wiley anything…") {
  const y = H - 190;
  fillRR(ctx, 48, y, W - 96, 112, 56, "rgba(255,255,255,0.07)", "rgba(255,255,255,0.12)");
  icon(ctx, "spark", 112, y + 56, 34, C.cyan);
  text(ctx, label, 150, y + 68, 32, C.slate, 400);
  icon(ctx, "mic", W - 210, y + 56, 34, C.slate);
  const pulse = 1;
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(W - 118, y + 56, 38 * pulse, 0, Math.PI * 2);
  ctx.fill();
  icon(ctx, "arrow", W - 118, y + 56, 34, "#fff");
}
function header(ctx, t, title, sub) {
  orb(ctx, 120, 210, 40, t, 0.6);
  text(ctx, title, 186, 204, 42, C.ink, 700, DISPLAY);
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.arc(194, 240, 7, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, sub, 212, 250, 27, C.slate, 500);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(48, 296, W - 96, 2);
}

// ---------- screens ----------
function screenChat(ctx, t) {
  header(ctx, t, "Wiley", "Your agent · working");
  // user message
  const u = ein(t, 7.9, 0.7);
  const msg = "Plan my week, clear my inbox and book my flight to Paris.";
  const lines = wrap(ctx, msg, 560, 34, 500);
  const bh = 54 + lines.length * 46;
  const bw = 640;
  ctx.save();
  ctx.globalAlpha = u;
  ctx.translate(0, (1 - u) * 40);
  const g = ctx.createLinearGradient(W - 48 - bw, 0, W - 48, 0);
  g.addColorStop(0, C.blue);
  g.addColorStop(1, "#4D86FF");
  fillRR(ctx, W - 48 - bw, 350, bw, bh, 40, g);
  lines.forEach((l, i) => text(ctx, l, W - 48 - bw + 36, 350 + 66 + i * 46, 34, "#fff", 500));
  ctx.restore();

  let y = 350 + bh + 34;
  // typing dots
  const typing = lin(t, 8.55, 8.75) * (1 - lin(t, 9.3, 9.45));
  if (typing > 0) {
    ctx.save();
    ctx.globalAlpha = typing;
    fillRR(ctx, 48, y, 150, 80, 40, C.card, C.cardLine);
    for (let i = 0; i < 3; i++) {
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 9 - i * 0.9));
      ctx.fillStyle = `rgba(245,247,250,${a})`;
      ctx.beginPath();
      ctx.arc(90 + i * 34, y + 40, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // wiley reply
  const r = ein(t, 9.35, 0.6);
  if (r > 0) {
    ctx.save();
    ctx.globalAlpha = r;
    ctx.translate(0, (1 - r) * 30);
    fillRR(ctx, 48, y, 560, 96, 40, C.card, C.cardLine);
    text(ctx, "Done. Here’s what I handled:", 84, y + 60, 32, C.ink, 500);
    ctx.restore();
  }
  y += 128;
  const rows = [
    ["cal", "Week planned", "5 focus blocks added"],
    ["mail", "Inbox cleared", "48 emails sorted"],
    ["plane", "Flight booked", "Paris · Fri 09:20"],
    ["pen", "Replies drafted", "6 ready to send"],
  ];
  rows.forEach((row, i) => {
    const s = 9.85 + i * 0.5;
    const p = ein(t, s, 0.55);
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate((1 - p) * -40, 0);
    const ry = y + i * 150;
    fillRR(ctx, 48, ry, W - 96, 128, 32, "rgba(255,255,255,0.05)", "rgba(255,255,255,0.09)");
    fillRR(ctx, 76, ry + 26, 76, 76, 22, "rgba(47,107,255,0.18)");
    icon(ctx, row[0], 114, ry + 64, 38, C.cyan);
    text(ctx, row[1], 180, ry + 58, 34, C.ink, 600);
    text(ctx, row[2], 180, ry + 100, 28, C.slate, 400);
    check(ctx, W - 110, ry + 64, 26, lin(t, s + 0.25, s + 0.7), C.blue);
    ctx.restore();
  });
  inputBar(ctx, t);
}

function screenCalendar(ctx, t, t0) {
  text(ctx, "Today", 72, 220, 64, C.ink, 700, DISPLAY);
  text(ctx, "Tuesday · planned by Wiley", 72, 272, 29, C.slate, 500);
  icon(ctx, "spark", W - 100, 200, 44, C.cyan);
  const top = 340;
  const hourH = 150;
  for (let h = 0; h < 9; h++) {
    const yy = top + h * hourH;
    text(ctx, `${(9 + h) % 12 || 12}${9 + h < 12 ? "am" : "pm"}`, 72, yy + 10, 24, C.dim, 500);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(170, yy, W - 220, 2);
  }
  const blocks = [
    [0.2, 1.6, "Deep work", "Focus mode on", C.blue],
    [2.0, 0.6, "Team sync", "Moved to fit your focus", "#3B4A6B"],
    [3.0, 0.9, "Lunch with Maya", "Table booked", "#2A7F9E"],
    [4.2, 1.5, "Q4 deck", "Draft ready for review", C.blue],
    [6.1, 0.9, "Gym", "Protected time", "#3B4A6B"],
  ];
  blocks.forEach((b, i) => {
    const p = ein(t, t0 + 0.25 + i * 0.22, 0.6);
    if (p <= 0) return;
    const yy = top + b[0] * hourH;
    const hh = b[1] * hourH - 12;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate((1 - p) * 60, 0);
    const g = ctx.createLinearGradient(190, 0, W - 50, 0);
    g.addColorStop(0, b[4]);
    g.addColorStop(1, "rgba(47,107,255,0.25)");
    fillRR(ctx, 190, yy, W - 240, hh, 26, g);
    fillRR(ctx, 190, yy, 10, hh, 5, "rgba(255,255,255,0.7)");
    text(ctx, b[2], 226, yy + 52, 32, "#fff", 600);
    if (hh > 95) text(ctx, b[3], 226, yy + 92, 26, "rgba(255,255,255,0.72)", 400);
    ctx.restore();
  });
}

function screenInbox(ctx, t, t0) {
  const total = 48;
  const k = cubicInOut(lin(t, t0 + 0.3, t0 + 1.4));
  const count = Math.round(total * (1 - k));
  text(ctx, "Inbox", 72, 220, 64, C.ink, 700, DISPLAY);
  text(ctx, count > 0 ? `${count} unread` : "All caught up", 72, 272, 29, count > 0 ? C.slate : C.green, 500);
  const mails = [
    ["Sarah Chen", "Re: Contract review", "Replied"],
    ["Stripe", "Your invoice is ready", "Filed"],
    ["Marco", "Can we move Friday?", "Rescheduled"],
    ["Newsletter", "This week in design", "Archived"],
    ["Ops Team", "Q4 budget approval", "Replied"],
    ["Airline", "Your booking PAR", "Saved"],
    ["Lena", "Quick question", "Replied"],
  ];
  mails.forEach((m, i) => {
    const yy = 330 + i * 190;
    const out = cubicInOut(lin(t, t0 + 0.4 + i * 0.13, t0 + 0.8 + i * 0.13));
    const chip = lin(t, t0 + 0.25 + i * 0.13, t0 + 0.4 + i * 0.13);
    ctx.save();
    ctx.globalAlpha = 1 - out;
    ctx.translate(out * 520, 0);
    fillRR(ctx, 48, yy, W - 96, 166, 30, "rgba(255,255,255,0.05)", "rgba(255,255,255,0.08)");
    ctx.fillStyle = ["#2F6BFF", "#5AC8FA", "#3B4A6B", "#2A7F9E"][i % 4];
    ctx.beginPath();
    ctx.arc(120, yy + 83, 38, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, m[0][0], 120, yy + 96, 34, "#fff", 700, DISPLAY, "center");
    text(ctx, m[0], 184, yy + 70, 32, C.ink, 600);
    text(ctx, m[1], 184, yy + 114, 27, C.slate, 400);
    if (chip > 0) {
      ctx.globalAlpha *= chip;
      ctx.font = `600 24px ${TEXT}`;
      const cw = ctx.measureText(m[2]).width + 44;
      fillRR(ctx, W - 80 - cw, yy + 44, cw, 46, 23, "rgba(61,220,151,0.16)");
      text(ctx, m[2], W - 80 - cw / 2, yy + 75, 24, C.green, 600, TEXT, "center");
    }
    ctx.restore();
  });
  const z = ein(t, t0 + 1.35, 0.7);
  if (z > 0) {
    ctx.save();
    ctx.globalAlpha = z;
    const cy = 980;
    const s = 0.8 + 0.2 * backOut(z);
    ctx.translate(W / 2, cy);
    ctx.scale(s, s);
    check(ctx, 0, 0, 110, lin(t, t0 + 1.35, t0 + 1.8), C.green);
    text(ctx, "Inbox zero", 0, 210, 56, C.ink, 700, DISPLAY, "center");
    ctx.restore();
  }
}

function screenDone(ctx, t, t0) {
  text(ctx, "Today’s progress", 72, 220, 50, C.ink, 700, DISPLAY);
  const p = cubicInOut(lin(t, t0 + 0.3, t0 + 1.9));
  const cx = W / 2, cy = 640, R = 220;
  ctx.lineCap = "round";
  ctx.lineWidth = 34;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  if (p > 0) {
    const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    g.addColorStop(0, C.cyan);
    g.addColorStop(1, C.blue);
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
  }
  text(ctx, `${Math.round(p * 100)}%`, cx, cy + 30, 104, C.ink, 700, DISPLAY, "center");
  text(ctx, p >= 1 ? "All done" : "Working…", cx, cy + 92, 30, p >= 1 ? C.green : C.slate, 500, TEXT, "center");
  const items = ["Week planned", "Inbox cleared", "Flight booked", "Replies sent", "Deck drafted"];
  items.forEach((it, i) => {
    const s = t0 + 0.45 + i * 0.32;
    const yy = 980 + i * 128;
    const a = ein(t, s - 0.2, 0.5);
    ctx.save();
    ctx.globalAlpha = a;
    fillRR(ctx, 48, yy, W - 96, 108, 28, "rgba(255,255,255,0.05)", "rgba(255,255,255,0.08)");
    check(ctx, 112, yy + 54, 26, lin(t, s, s + 0.45), C.blue);
    text(ctx, it, 168, yy + 66, 33, C.ink, 600);
    ctx.restore();
  });
}

function screenHome(ctx, t, t0) {
  const a = ein(t, t0, 0.8);
  ctx.save();
  ctx.globalAlpha = a;
  orb(ctx, W / 2, 760, 150 + 6 * Math.sin(t * 2.2), t, 1.2);
  text(ctx, "Good evening.", W / 2, 1100, 60, C.ink, 700, DISPLAY, "center");
  text(ctx, "Everything’s handled.", W / 2, 1170, 38, C.slate, 500, TEXT, "center");
  ctx.restore();
  inputBar(ctx, t);
}

// screen schedule (global seconds)
const SCREENS = [
  { at: 0, draw: (c, t) => screenChat(c, t) },
  { at: 13.15, draw: (c, t) => screenCalendar(c, t, 13.15) },
  { at: 15.55, draw: (c, t) => screenInbox(c, t, 15.55) },
  { at: 17.95, draw: (c, t) => screenDone(c, t, 17.95) },
  { at: 24.6, draw: (c, t) => screenHome(c, t, 24.6) },
];
const SLIDE = 0.45;

export function drawUI(ctx, t) {
  background(ctx, t);
  let idx = 0;
  for (let i = 0; i < SCREENS.length; i++) if (t >= SCREENS[i].at) idx = i;
  const cur = SCREENS[idx];
  const k = idx > 0 ? cubicInOut(lin(t, cur.at, cur.at + SLIDE)) : 1;
  if (k < 1 && idx > 0) {
    const prev = SCREENS[idx - 1];
    ctx.save();
    ctx.translate(-k * W * 0.35, 0);
    ctx.globalAlpha = 1 - k;
    prev.draw(ctx, t);
    ctx.restore();
    ctx.save();
    ctx.translate((1 - k) * W, 0);
    // incoming screen gets its own backdrop so it reads as a card sliding in
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    cur.draw(ctx, t);
    ctx.restore();
  } else {
    cur.draw(ctx, t);
  }
  statusBar(ctx);
  homeIndicator(ctx);
}
