const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const f of process.argv.slice(3)){await p.goto('file://'+path.resolve(process.argv[2])+'?f='+f);await p.waitForSelector('body[data-ready]');
const ok=await p.evaluate(()=>[...document.fonts].filter(x=>x.status==='loaded').map(x=>x.family));console.log(f,ok.join(','));
await p.screenshot({path:`frames/${process.env.PFX||"sf_0"}${f}.png`});}await b.close();})();
