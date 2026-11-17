// Render style frames: node tools/stills.js [scale]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const scale = Number(process.argv[2] || 1);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  const url = 'file://' + path.resolve(__dirname, '../src/stills2.html');
  for (const f of ['a','b','c','d']) {
    await page.goto(url + '?f=' + f);
    await page.waitForSelector('body[data-ready="1"]');
    const fonts = await page.evaluate(() => [...document.fonts].filter(x => x.status === 'loaded').map(x => x.family));
    await page.screenshot({ path: path.resolve(__dirname, `../out/stills2/${f}.png`) });
    console.log(f, 'fonts:', [...new Set(fonts)].join(','));
  }
  await browser.close();
})();
