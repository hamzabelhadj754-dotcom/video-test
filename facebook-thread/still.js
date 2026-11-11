// usage: node still.js out_dir f1 f2 ...
const { chromium } = require('playwright');
(async()=>{
  const [out,...fs]=process.argv.slice(2);
  const b=await chromium.launch({args:['--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
  p.on('console',m=>console.log('page:',m.text())); p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+__dirname+'/index.html'); await p.waitForFunction('window.ready',null,{timeout:20000});
  for(const f of fs){ await p.evaluate(f=>seek(f),Number(f)); await p.screenshot({path:`${out}/f${String(f).padStart(4,'0')}.png`}); }
  await b.close();
})();
