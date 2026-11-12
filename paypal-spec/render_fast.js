// Renders only the 120fps sub-frames that matter: every sub-frame inside fast-motion windows
// (needed for real motion blur), and one per output frame elsewhere (the other 3 are identical
// and get copied by fill step). Existing frames are kept.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FAST=[[0.2,0.75],[2.5,3.05],[3.55,5.05],[5.95,7.45],[7.95,9.75],[10.45,11.75],[12.35,13.35],[14.15,14.85],[15.0,15.6]];
const fps=120, out='render/f120', name=i=>path.join(out,`f_${String(i).padStart(4,'0')}.jpg`);
const isFast=i=>FAST.some(([a,b])=>i/fps>=a&&i/fps<b);
const need=i=>!fs.existsSync(name(i))&&(isFast(i)||i%4===0);
(async()=>{const [a,z]=process.argv.slice(2).map(Number);
 const [k,n]=process.argv.slice(4).map(Number);const todo=[];for(let i=a;i<z;i++)if(need(i))todo.push(i);const mine=todo.filter((_,j)=>j%n===k);todo.length=0;todo.push(...mine);
 console.log('to render',todo.length,'of',z-a);
 const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.goto(process.env.URL);await p.waitForSelector('body[data-ready]',{timeout:120000});
 for(const i of todo){await p.evaluate(t=>seek(t),i/fps);await p.screenshot({path:name(i),type:'jpeg',quality:97});}
 await b.close();})();
