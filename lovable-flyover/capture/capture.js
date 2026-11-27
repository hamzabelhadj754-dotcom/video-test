// capture.js: lock lovable.dev/home and split it into a flat page plus lifted pieces.
// Usage: node capture/capture.js   (writes into capture/out/)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://lovable.dev/home';
const OUT = path.join(__dirname, 'out');
const PAD = 28;
const PROMPT = 'Ask Lovable to create a landing page for my...'; // one of the page's own rotating placeholders

// Pieces: how to find each one in the DOM, and its role in the film.
// find(): runs in the page, returns an element. Lift/stand values are film defaults, tuned in film/scene.js.
const PIECES = [
  // hero
  { id: 'hero_prompt',  group: 'hero',  role: 'mockup', find: `composer(0)` },
  { id: 'nav_login',    group: 'hero',  role: 'chip',   find: `byText('a','Log in')` },
  { id: 'nav_start',    group: 'hero',  role: 'chip',   find: `byText('a','Get started',0)` },
  // one platform
  { id: 'p2_templates', group: 'p2',    role: 'button', find: `byText('a','View templates')` },
  { id: 'p2_start',     group: 'p2',    role: 'button', find: `byText('a','Get started',1)` },
  { id: 'p2_phone_l',   group: 'p2',    role: 'photo',  find: `cardNear(136,1248,157,328)` },
  { id: 'p2_revenue',   group: 'p2',    role: 'card',   find: `cardNear(317,1327,200,126)` },
  { id: 'p2_dark',      group: 'p2',    role: 'card',   find: `cardNear(317,1524,200,51)` },
  { id: 'p2_launch',    group: 'p2',    role: 'photo',  find: `cardNear(541,1364,358,211)` },
  { id: 'p2_filter',    group: 'p2',    role: 'card',   find: `cardNear(923,1327,200,51)` },
  { id: 'p2_habit',     group: 'p2',    role: 'card',   find: `cardNear(923,1449,200,126)` },
  { id: 'p2_phone_r',   group: 'p2',    role: 'photo',  find: `cardNear(1147,1248,157,328)` },
  { id: 'b_mobile',     group: 'p2',    role: 'chip',   find: `bubble('Build a mobile app.')` },
  { id: 'b_revenue',    group: 'p2',    role: 'chip',   find: `bubble('Show this month')` },
  { id: 'b_dark',       group: 'p2',    role: 'chip',   find: `bubble('Let customers switch')` },
  { id: 'b_launch',     group: 'p2',    role: 'chip',   find: `bubble('Make a landing page')` },
  { id: 'b_filter',     group: 'p2',    role: 'chip',   find: `bubble('Let shoppers')` },
  { id: 'b_habit',      group: 'p2',    role: 'chip',   find: `bubble('Build a habit')` },
  { id: 'b_story',      group: 'p2',    role: 'chip',   find: `bubble('Design a story')` },
  // logos
  ...[0, 1, 2, 3, 4].map(i => ({ id: 'logo_' + i, group: 'logos', role: 'card', find: `cardNear(${133 + 238 * i},1717,222,88)` })),
  // bento
  { id: 'bento_stack',  group: 'bento', role: 'photo',  find: `cardNear(133,2007,578,518)` },
  { id: 'bento_pay',    group: 'bento', role: 'photo',  find: `cardNear(729,2007,578,518)` },
  { id: 'bento_host',   group: 'bento', role: 'card',   find: `cardNear(133,2543,379,194)` },
  { id: 'bento_safe',   group: 'bento', role: 'card',   find: `cardNear(530,2543,379,194)` },
  { id: 'bento_works',  group: 'bento', role: 'card',   find: `cardNear(928,2543,379,194)` },
  { id: 'bento_start',  group: 'bento', role: 'button', find: `byText('a','Get started',2)` },
  // proof
  { id: 'testimonial',  group: 'proof', role: 'testimonial', find: `stripAt(133).parentElement` },
  { id: 'proof_all',    group: 'proof', role: 'button', find: `byText('a','See all customer stories')` },
  // millions
  { id: 'mil_start',    group: 'mil',   role: 'button', find: `byText('a','Get started',3)` },
  // footer cta
  { id: 'cta_prompt',   group: 'cta',   role: 'mockup', find: `composer(1)` },
];

const HELPERS = `
  const rectOf = e => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; };
  const all = () => [...document.querySelectorAll('body *')];
  const styled = e => { const cs = getComputedStyle(e); return cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none'; };
  const near = (e, x, y, w, h, tol) => { const r = rectOf(e); return Math.abs(r.x - x) < tol && Math.abs(r.y - y) < tol && Math.abs(r.w - w) < 6 && Math.abs(r.h - h) < 6; };
  // outermost styled rounded element matching the box (tolerant to the section's small vertical drift)
  window.cardNear = (x, y, w, h) => all().find(e => near(e, x, y, w, h, 40) && parseFloat(getComputedStyle(e).borderTopLeftRadius) > 4 && styled(e));
  window.cardAt = (x, y, w, h) => all().find(e => near(e, x, y, w, h, 12));
  window.byText = (tag, t, n = 0) => [...document.querySelectorAll(tag)].filter(e => e.textContent.trim() === t && rectOf(e).w > 0)[n];
  window.bubble = t => [...document.querySelectorAll('.text-prompt-bubble-lmk')].find(e => e.textContent.trim().startsWith(t));
  window.stripAt = x => [...document.querySelectorAll('.rounded-strip-lmk')].find(e => Math.abs(rectOf(e).x - x) < 6 && rectOf(e).h > 400);
  window.composer = n => [...document.querySelectorAll('[class*="rounded-7"][class*="bg-secondary-pulse"]')].filter(e => rectOf(e).w > 300)[n];
  window.rectOf = rectOf;
`;

(async () => {
  fs.mkdirSync(path.join(OUT, 'pieces'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  if ((await page.title()).includes('Just a moment')) throw new Error('blocked by the site challenge');

  // 1. scroll to the bottom once so lazy images and scroll animations finish
  for (let y = 0; y <= 7000; y += 300) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(180); }
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);

  // 2. lock: remove cookie banner, pause every animation, freeze the typed placeholder, kill transitions
  await page.evaluate(({ PROMPT }) => {
    const banner = [...document.querySelectorAll('section')].find(s => /We use cookies/.test(s.textContent) && s.getBoundingClientRect().width < 400);
    if (banner) banner.remove();
    // pause clock-driven animations only; scroll-linked ones (hero gradient, footer glow) must keep their timeline
    document.getAnimations().forEach(a => { try { if (a.timeline instanceof DocumentTimeline) a.pause(); } catch (e) {} });
    const st = document.createElement('style');
    st.textContent = `*,*::before,*::after{transition:none!important;caret-color:transparent!important}`;
    document.head.appendChild(st);
    // the hero placeholder types itself: hide the live span, show a static clone with a full line
    const live = [...document.querySelectorAll('span')].find(e => e.children.length === 0 && /^Ask Lovable/.test(e.textContent) && e.getBoundingClientRect().y < 900);
    if (live) { const c = live.cloneNode(false); c.textContent = PROMPT; live.after(c); live.style.display = 'none'; }
    const foot = [...document.querySelectorAll('span')].filter(e => e.children.length === 0 && /^Ask Lovable/.test(e.textContent) && e.getBoundingClientRect().y > 4000);
    foot.forEach(live => { const c = live.cloneNode(false); c.textContent = 'Ask Lovable to create an internal tool that...'; live.after(c); live.style.display = 'none'; });
  }, { PROMPT });
  await page.addScriptTag({ content: HELPERS });
  await page.waitForTimeout(500);

  // 3. mark the pieces and record positions
  const layers = await page.evaluate(PIECES => PIECES.map(p => {
    const e = eval(p.find);
    if (!e) return { ...p, missing: true };
    e.setAttribute('data-film-layer', p.id);
    // the composer draws its shadow on a separate sibling: hide it with the piece (the film draws its own shadow)
    const sib = e.previousElementSibling;
    if (sib && /shadow-2xl/.test(sib.className) && /inset-0/.test(sib.className)) sib.setAttribute('data-film-ghost', p.id);
    const r = rectOf(e), cs = getComputedStyle(e);
    return { id: p.id, group: p.group, role: p.role, x: r.x, y: r.y, w: r.w, h: r.h, radius: Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.h / 2) };
  }), PIECES);
  const missing = layers.filter(l => l.missing).map(l => l.id);
  if (missing.length) console.warn('missing pieces:', missing.join(', '));
  const found = layers.filter(l => !l.missing && l.x >= 0 && l.x + l.w <= 1440);
  const docH = await page.evaluate(() => document.documentElement.scrollHeight);

  // 4. full page with the pieces hidden (a throwaway shot first: the scroll-linked gradients only paint after one full-page pass)
  await page.screenshot({ path: path.join(OUT, 'warmup.png'), fullPage: true });
  fs.unlinkSync(path.join(OUT, 'warmup.png'));
  await page.addStyleTag({ content: `[data-film-layer],[data-film-ghost]{opacity:0!important}` });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'page.png'), fullPage: true });
  // also an unhidden reference, for checking the split
  await page.evaluate(() => document.querySelectorAll('style').forEach(s => { if (s.textContent.startsWith('[data-film-layer],[data-film-ghost]{opacity:0')) s.remove(); }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'page_reference.png'), fullPage: true });

  // 5. each piece alone on transparent, 28px padding
  const solo = await page.addStyleTag({ content: `
    html,body{background:transparent!important}
    body *{visibility:hidden!important}
    body.solo-on [data-solo], body.solo-on [data-solo] *{visibility:visible!important}` });
  for (const l of found) {
    await page.evaluate(id => {
      document.querySelectorAll('[data-solo]').forEach(e => e.removeAttribute('data-solo'));
      document.querySelector(`[data-film-layer="${id}"]`).setAttribute('data-solo', '');
      document.body.classList.add('solo-on');
    }, l.id);
    const clip = { x: Math.max(0, l.x - PAD), y: Math.max(0, l.y - PAD), width: l.w + 2 * PAD, height: l.h + 2 * PAD };
    clip.width = Math.min(clip.width, 1440 - clip.x);
    l.clip = clip;
    await page.screenshot({ path: path.join(OUT, 'pieces', l.id + '.png'), fullPage: true, clip, omitBackground: true });
  }
  fs.writeFileSync(path.join(OUT, 'layers.json'), JSON.stringify({ url: URL, width: 1440, height: docH, scale: 2, pad: PAD, prompt: PROMPT, capturedAt: new Date().toISOString(), layers: found }, null, 1));
  console.log('page height', docH, '| pieces', found.length, '| skipped (off page or missing):', layers.length - found.length);
  await browser.close();
})();
