const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
for(const f of process.argv.slice(2)){await p.goto('http://127.0.0.1:8766/styleframes.html?f='+f);await p.waitForSelector('body[data-ready]',{timeout:60000});
await p.screenshot({path:`frames/sf_0${f}.png`});console.log('ok',f);}
await b.close();})();
