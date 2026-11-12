// node render.js <fps> <outdir> --range a b   |  node render.js <fps> <outdir> t1 t2 ... (stills)
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const fps=+process.argv[2],out=process.argv[3],rest=process.argv.slice(4);
fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(process.env.URL||('file://'+path.resolve('comp.html')));await p.waitForSelector('body[data-ready]');
if(rest[0]==='--range'){const a=+rest[1],z=+rest[2];
  for(let i=a;i<z;i++){await p.evaluate(t=>seek(t),i/fps);
    await p.screenshot({path:path.join(out,`f_${String(i).padStart(4,'0')}.jpg`),type:'jpeg',quality:97});}
}else{for(const t of rest.map(Number)){await p.evaluate(t=>seek(t),t);await p.screenshot({path:path.join(out,`t_${t.toFixed(2)}.png`)});}}
await b.close();})();
