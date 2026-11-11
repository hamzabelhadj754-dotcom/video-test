// THE THREAD — frame-accurate, seekable composition. window.seek(frame) renders any (sub)frame.
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const FPS = 30, W = 1080, H = 1350, TOTAL = 630;
const C = { blue:'#0866FF', blueDeep:'#0444B4', blueHi:'#8DBBFF', blueSpec:'#EEF4FF',
  paper:'#F3F0E8', ink:'#0D0F14', ember:'#FF6A3D', emberInk:'#7A2C10', fog:'#B9B4A8', inkSoft:'#5E5A52' };

/* ---------- math ---------- */
const clamp = (v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const prog = (f,a,b)=>clamp((f-a)/(b-a));
function bez(x1,y1,x2,y2){
  const cx=3*x1, bx=3*(x2-x1)-cx, ax=1-cx-bx, cy=3*y1, by=3*(y2-y1)-cy, ay=1-cy-by;
  const sx=t=>((ax*t+bx)*t+cx)*t, sy=t=>((ay*t+by)*t+cy)*t;
  return x=>{ if(x<=0) return 0; if(x>=1) return 1; let lo=0,hi=1,t=x;
    for(let i=0;i<40;i++){ const v=sx(t); if(Math.abs(v-x)<1e-7) break; if(v<x) lo=t; else hi=t; t=(lo+hi)/2; }
    return sy(t); };
}
// One easing family for the whole film
const E = {
  out: bez(.16,1,.3,1),     // entrances (expo-out)
  in:  bez(.64,0,.78,0),    // exits (quint-in)
  cam: bez(.65,0,.35,1),    // camera
  pen: bez(.5,0,.12,1),     // the cord: fast attack, long settle
  lin: t=>t,
};
const tw=(f,a,b,e=E.out)=>e(prog(f,a,b));
function rng(seed){ let s=seed>>>0; return ()=>{ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }

/* ---------- dom ---------- */
function el(tag, attrs={}, parent){ const n=document.createElementNS(NS,tag); for(const k in attrs) n.setAttribute(k,attrs[k]); if(parent) parent.appendChild(n); return n; }
const $=id=>document.getElementById(id);
let clipId=0;

/* ---------- the cord: a lit tube (edge, body, highlight, specular) ---------- */
const cords=[];
function cord(d, parent, opts={}){
  const g=el('g',{},parent);
  const mk=(color,op=1)=>el('path',{d,fill:'none',stroke:color,'stroke-linecap':'round','stroke-linejoin':'round',opacity:op},g);
  const s={ g, w:opts.w||1, plain:!!opts.plain };
  if(s.plain){ s.paths=[mk(opts.color||C.fog, opts.opacity??1)]; }
  else { s.paths=[mk(C.blueDeep), mk(C.blue), mk(C.blueHi,.9), mk(C.blueSpec,.95)]; s.hi=[s.paths[2],s.paths[3]]; }
  s.L=s.paths[0].getTotalLength();
  cords.push(s); return s;
}
function span(s,a,b){
  if(b-a<=0.0005){ s.g.style.visibility='hidden'; return; }
  s.g.style.visibility='visible';
  const da=`${(b-a)*s.L} ${s.L*2+10}`, off=`${-a*s.L}`;
  s.paths.forEach(p=>{ p.setAttribute('stroke-dasharray',da); p.setAttribute('stroke-dashoffset',off); });
}
function cordWidth(s, screenW, z){
  const w=screenW*s.w/z;
  if(s.plain){ s.paths[0].setAttribute('stroke-width',w); return; }
  const [edge,body,hi,spec]=s.paths;
  edge.setAttribute('stroke-width',w); body.setAttribute('stroke-width',w*0.74);
  hi.setAttribute('stroke-width',w*0.30); spec.setAttribute('stroke-width',w*0.10);
  hi.setAttribute('transform',`translate(${(-0.07*w).toFixed(3)} ${(-0.17*w).toFixed(3)})`);
  spec.setAttribute('transform',`translate(${(-0.09*w).toFixed(3)} ${(-0.22*w).toFixed(3)})`);
}

/* ---------- masked word lines ---------- */
function tattrs(o){ const a={ 'font-family':o.family, 'font-weight':o.weight||400, 'font-size':o.size, fill:o.fill||C.ink,
  'letter-spacing':`${(o.ls||0)*o.size}px`, 'font-style':o.style||'normal' }; if(o.tnum) a.style='font-variant-numeric:tabular-nums'; return a; }
function measure(parent, str, attrs){ const t=el('text',{...attrs, style:(attrs.style||'')+';white-space:pre'},parent); t.textContent=str; const w=t.getComputedTextLength(); t.remove(); return w; }
function fit(parent, strs, o, maxW){ let s=o.size; const w=Math.max(...strs.map(x=>measure(parent,x,tattrs({...o,size:s})))); return w>maxW?Math.floor(s*maxW/w):s; }
function line(parent, str, o){
  const attrs=tattrs(o);
  const words=str.split(' ');
  const full=measure(parent,str,attrs);
  const x0 = o.anchor==='middle' ? o.x-full/2 : o.anchor==='end' ? o.x-full : o.x;
  const id='lc'+(clipId++);
  const cp=el('clipPath',{id},parent);
  el('rect',{x:x0-o.size, y:o.y-o.size*1.2, width:full+o.size*2, height:o.size*1.6},cp);
  const g=el('g',{'clip-path':`url(#${id})`},parent);
  const items=words.map((w,i)=>{
    const pre=words.slice(0,i).join(' ')+(i?' ':'');
    const dx=i?measure(parent,pre,attrs):0;
    const t=el('text',{...attrs, x:x0+dx, y:o.y},g); t.textContent=w; return t;
  });
  return { g, items, size:o.size, full, x0,
    set(f, tin, tout=1e9, st=2.2, dur=20){
      items.forEach((t,i)=>{
        const a=tw(f, tin+i*st, tin+i*st+dur, E.out);
        const b=tw(f, tout+i*1.6, tout+i*1.6+11, E.in);
        const y=(1-a)*this.size*1.15 - b*this.size*1.15;
        t.setAttribute('transform',`translate(0 ${y.toFixed(2)})`);
        t.style.visibility=(a<=0||b>=1)?'hidden':'visible';
      });
    },
    text(str){ items[0].textContent=str; } };
}

/* ---------- world geometry ---------- */
const TAG_C=[4600,700], TAG_R=-6*Math.PI/180;
const rot=(x,y)=>{ const dx=x-TAG_C[0], dy=y-TAG_C[1]; return [TAG_C[0]+dx*Math.cos(TAG_R)-dy*Math.sin(TAG_R), TAG_C[1]+dx*Math.sin(TAG_R)+dy*Math.cos(TAG_R)]; };
const P=(x,y)=>rot(x,y).map(v=>v.toFixed(1)).join(' ');
const tagTip=rot(4140,700), tagRight=rot(5080,700);
const LOGO=[7000,680];

// camera keyframes [frame, cx, cy, zoom, easeIntoThisKey]
const K=[
  [0,   540, 675, 1.00, 'lin'],
  [44,  540, 675, 1.06, 'lin'],
  [96,  1900,660, 1.00, 'cam'],
  [144, 1935,668, 1.035,'lin'],
  [186, 3300,760, 1.00, 'cam'],
  [252, 3322,770, 1.035,'lin'],
  [290, 4600,700, 1.00, 'cam'],
  [342, 4622,706, 1.035,'lin'],
  [386, 5860,790, 1.00, 'cam'],
  [426, 5876,794, 1.045,'lin'],
  [478, 3770,203, 0.15, 'cam'],
  [516, 3786,208, 0.157,'lin'],
  [550, 7000,535, 1.00, 'out'],
  [630, 7000,548, 1.045,'lin'],
];
function camera(f){
  let i=0; while(i<K.length-2 && f>=K[i+1][0]) i++;
  const A=K[i], B=K[i+1]; const u=E[B[4]](prog(f,A[0],B[0]));
  const z0=A[3], z1=B[3];
  const z=Math.exp(lerp(Math.log(z0),Math.log(z1),u));
  let w=u; if(Math.abs(Math.log(z1/z0))>0.2) w=(1/z-1/z0)/(1/z1-1/z0);
  return { cx:lerp(A[1],B[1],w), cy:lerp(A[2],B[2],w), z };
}

/* ---------- build ---------- */
const S={};
const OV={cx:3770, cy:203, z:0.15}; // overview camera (other people's threads are placed in its screen space)

function build(){
  const world=$('world');
  const flat=el('g',{},world);                                   // printed things (no shadow)
  const txt=el('g',{},world);                                    // type, printed on paper
  const lay=el('g',{filter:'url(#cast)'},world);                 // objects resting on paper: cast shadows
  const rowsG=el('g',{transform:`translate(${OV.cx-540/OV.z} ${OV.cy-675/OV.z}) scale(${1/OV.z})`},lay);

  /* S1 — the dot */
  S.ring1=el('circle',{cx:540,cy:675,r:16,fill:'none',stroke:C.blue,'stroke-width':2.5},flat);
  S.ring2=el('circle',{cx:540,cy:675,r:16,fill:'none',stroke:C.blue,'stroke-width':2.5},flat);
  S.dotG=el('g',{},lay);
  S.dot=el('circle',{cx:540,cy:675,r:15,fill:'url(#bead)'},S.dotG);
  S.typing=line(txt,'Maya is typing',{x:590,y:687,size:34,family:'ISans',weight:500,fill:C.inkSoft,ls:-0.01});

  /* S5 memory content (flat, under the cord) */
  S.mem=el('g',{'clip-path':'url(#frameClip)'},flat);
  S.memWash=el('rect',{x:5572,y:342,width:576,height:676,fill:'url(#emberWash)'},S.mem);
  S.memBub=el('g',{},S.mem);
  el('path',{d:'M5670 660 V610 A40 40 0 0 1 5710 570 H6010 A40 40 0 0 1 6050 610 V710 A40 40 0 0 1 6010 750 H5730 L5700 800 L5760 750 H5710 A40 40 0 0 1 5670 710 Z',
    fill:'none',stroke:C.emberInk,'stroke-width':7,'stroke-linejoin':'round',opacity:.85},S.memBub);
  S.memTxt=line(S.memBub,'tennis sunday?',{x:5860,y:680,size:56,family:'Brico',weight:800,fill:C.emberInk,anchor:'middle',ls:-0.03});

  /* the cord */
  S.seg0=cord('M540 675 C 800 675 900 600 1090 618 S 1360 650 1440 645',lay);
  S.bubT=cord('M1440 645 V520 A90 90 0 0 1 1530 430 H2270 A90 90 0 0 1 2360 520 V645',lay);
  S.bubB=cord('M1440 645 V770 A90 90 0 0 0 1530 860 H1562 L1515 952 L1690 860 H2270 A90 90 0 0 0 2360 770 V645',lay);
  S.seg1=cord('M2360 645 C 2580 645 2620 1150 2880 1130 S 3060 1015 3100 1015',lay);
  S.cirT=cord('M3100 1015 A300 300 0 0 1 3700 1015',lay);
  S.cirB=cord('M3100 1015 A300 300 0 0 0 3700 1015',lay);
  S.seg2=cord(`M3700 1015 C 3900 1015 3880 700 4000 690 S ${tagTip[0]-50} ${tagTip[1]} ${tagTip[0]} ${tagTip[1]}`,lay);
  S.tagT=cord(`M${P(4140,700)} L${P(4320,470)} L${P(5036,470)} A44 44 0 0 1 ${P(5080,514)} L${P(5080,700)}`,lay);
  S.tagB=cord(`M${P(4140,700)} L${P(4320,930)} L${P(5036,930)} A44 44 0 0 0 ${P(5080,886)} L${P(5080,700)}`,lay);
  const hc=rot(4272,700);
  S.hole=cord(`M${hc[0]-26} ${hc[1]} a26 26 0 1 1 52 0 a26 26 0 1 1 -52 0`,lay,{w:.6});
  S.seg3=cord(`M${tagRight[0]} ${tagRight[1]} C ${tagRight[0]+200} ${tagRight[1]} 5380 760 5470 712 S 5530 680 5560 680`,lay);
  S.frmT=cord('M5560 680 V330 H6160 V680',lay);
  S.frmB=cord('M5560 680 V1030 H6160 V680',lay);
  S.seg4=cord(`M6160 680 C 6360 680 6450 596 6620 626 S 6820 680 ${LOGO[0]-110} 680`,lay);
  S.logoRing=cord(`M${LOGO[0]-110} 680 A110 110 0 1 1 ${LOGO[0]+110} 680 A110 110 0 1 1 ${LOGO[0]-110} 680`,lay);

  /* group: 214 members on a hex grid; the blue bead in the middle is you */
  const pts=[]; const sp=33;
  for(let r=-12;r<=12;r++) for(let q=-12;q<=12;q++){ const x=3400+(q+r*0.5)*sp, y=1015+r*sp*0.866; const d=Math.hypot(x-3400,y-1015); if(d<262) pts.push({x,y,d}); }
  pts.sort((a,b)=>a.d-b.d); const r=rng(7); S.members=[];
  pts.slice(0,214).forEach((p,i)=>{
    const you=i===0;
    const c=el('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:you?13:9.5,fill:you?'url(#bead)':(r()<.22?C.fog:C.ink)},lay);
    S.members.push({c,x:p.x,y:p.y,t0:192+Math.pow(p.d/262,1.1)*40+r()*3});
  });

  /* logo: disk, then the official mark revealed upward */
  S.logo=el('g',{},lay);
  S.disk=el('circle',{cx:0,cy:0,r:110,fill:C.blue},S.logo);
  const lc=el('clipPath',{id:'logoReveal'},S.logo);
  S.logoRevealRect=el('rect',{x:-120,y:120,width:240,height:240},lc);
  S.logoImg=el('image',{href:'assets/facebook-logo.svg',x:-110,y:-110,width:220,height:220,'clip-path':'url(#logoReveal)'},S.logo);
  lay.appendChild(S.logoRing.g); // ring sits on top of the disk, like a bezel

  /* type (world) */
  // S2 — the first message, set big inside the bubble
  const hb=fit(txt,['sunday?'],{family:'Brico',weight:800,size:176,ls:-0.04},800);
  S.s2cap=line(txt,'Maya · just now',{x:1446,y:396,size:32,family:'ISans',weight:500,fill:C.inkSoft});
  S.s2a=line(txt,'tennis',{x:1512,y:625,size:hb,family:'Brico',weight:800,ls:-0.04});
  S.s2b=line(txt,'sunday?',{x:1512,y:625+hb*0.92,size:hb,family:'Brico',weight:800,ls:-0.04});
  // S3 — group
  S.s3cap=line(txt,'GROUP',{x:2858,y:292,size:26,family:'ISans',weight:600,fill:C.inkSoft,ls:0.16});
  S.s3a=line(txt,'Sunday',{x:2852,y:468,size:190,family:'Brico',weight:800,ls:-0.045});
  S.s3b=line(txt,'Tennis',{x:2852,y:640,size:190,family:'Brico',weight:800,ls:-0.045});
  S.s3num=line(txt,'214',{x:3744,y:470,size:96,family:'Brico',weight:800,anchor:'end',tnum:true,ls:-0.04});
  S.s3mem=line(txt,'members',{x:3744,y:516,size:34,family:'ISans',weight:600,fill:C.inkSoft,anchor:'end'});
  // S4 — marketplace (rotated with the tag)
  const tagTxt=el('g',{transform:`rotate(-6 ${TAG_C[0]} ${TAG_C[1]})`},txt);
  S.s4cap=line(tagTxt,'Marketplace · 2 km away',{x:4392,y:548,size:30,family:'ISans',weight:500,fill:C.inkSoft});
  S.s4sub=line(tagTxt,'Bike. Barely ridden.',{x:4392,y:614,size:52,family:'ISans',weight:600,ls:-0.015});
  S.s4hero=line(tagTxt,'$80',{x:4380,y:888,size:300,family:'Brico',weight:800,ls:-0.05});
  // S5 — memories
  const ms=fit(txt,['7 years ago'],{family:'ISerif',size:150,style:'italic',ls:-0.02},900);
  S.s5cap=line(txt,'MEMORIES',{x:5562,y:296,size:26,family:'ISans',weight:600,fill:C.inkSoft,ls:0.16});
  S.s5a=line(txt,'7 years ago',{x:5860,y:1172,size:ms,family:'ISerif',style:'italic',anchor:'middle',ls:-0.02});
  S.s5b=line(txt,'today.',{x:5860,y:1172+ms*0.86,size:ms,family:'ISerif',style:'italic',anchor:'middle',ls:-0.02});
  // End card (world, so it takes the final push-in)
  const hs=fit(txt,['are already here.'],{family:'Brico',weight:800,size:118,ls:-0.04},900);
  S.end1=line(txt,'Your people',{x:LOGO[0],y:270,size:hs,family:'Brico',weight:800,anchor:'middle',ls:-0.04});
  S.end2=line(txt,'are already here.',{x:LOGO[0],y:270+hs*0.96,size:hs,family:'Brico',weight:800,anchor:'middle',ls:-0.04});

  /* HUD (screen space) */
  const hud=$('hud');
  S.b1=line(hud,'3 billion',{x:92,y:300,size:170,family:'Brico',weight:800,ls:-0.05});
  S.b2=line(hud,'people.',{x:92,y:458,size:170,family:'Brico',weight:800,ls:-0.05});
  S.bcap=line(hud,'on Facebook, every month.',{x:98,y:530,size:38,family:'ISans',weight:500,fill:C.inkSoft});
  S.spec=line(hud,'Spec ad. Not affiliated with Meta.',{x:540,y:1306,size:20,family:'ISans',weight:500,fill:'#8E897E',anchor:'middle'});

  /* other people's threads, in overview screen space */
  const rr2=rng(23); S.rows=[];
  [64,132,606,900,968,1036,1104,1172,1240,1308].forEach(y=>{
    let x=-60-rr2()*40, d=`M${x.toFixed(1)} ${y}`;
    while(x<1140){
      const k=rr2(), step=40+rr2()*70;
      if(k<.16){ const s=10+rr2()*8; d+=` C ${x+s*1.6} ${y} ${x+s*2.2} ${y-s*2.2} ${x+s*1.2} ${y-s*2.2} C ${x+s*.2} ${y-s*2.2} ${x+s*.6} ${y} ${x+s*2.6} ${y}`; x+=s*2.6; }
      else if(k<.30){ const w=34+rr2()*60, h=12+rr2()*14, r=Math.min(6,h/2); d+=` V${y-h+r} q0 ${-r} ${r} ${-r} h${w-2*r} q${r} 0 ${r} ${r} V${y}`; x+=w; }
      else if(k<.42){ const r=9+rr2()*12; d+=` a${r} ${r} 0 0 1 ${2*r} 0`; x+=2*r; }
      else { const a=(rr2()-.5)*16; d+=` q${step/2} ${a} ${step} 0`; x+=step; }
    }
    const ink=rr2()<.3;
    const s=cord(d,rowsG,{plain:true,color:ink?C.inkSoft:'#A9A396',opacity:ink?.6:1,w:1});
    s.overview=true; s.order=Math.abs(y-760); S.rows.push(s);
  });
  S.rows.sort((a,b)=>a.order-b.order);

  /* foreground defocused cords (parallax 1.7) */
  const fg=$('fg'); S.fg=[];
  [[1250,-160,'M0 0 C 180 120 260 420 120 760'],[2660,120,'M0 0 C 220 -90 300 300 80 520 S -140 980 60 1300'],[5240,-80,'M0 0 C -160 240 180 520 40 900']]
    .forEach(([X,Y,d])=>{ const g=el('g',{},fg); el('path',{d,fill:'none',stroke:C.blue,'stroke-width':70,'stroke-linecap':'round',opacity:.22,filter:'url(#fgBlur)'},g); S.fg.push({g,X,Y}); });

  /* grain: pre-baked frames, cycled */
  const cv=$('grain'), ctx=cv.getContext('2d'); S.grain=[];
  for(let k=0;k<12;k++){ const im=ctx.createImageData(540,675), g=rng(100+k);
    for(let i=0;i<im.data.length;i+=4){ const v=128+(g()+g()+g()-1.5)*120; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255; }
    S.grain.push(im); }
  S.ctx=ctx;
}

/* ---------- render a frame ---------- */
function seek(f){
  const cam=camera(f);
  $('cam').setAttribute('transform',`translate(540 675) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`);
  // cord thickness held in screen space: 16px close, 4px in the overview
  const k=clamp((cam.z-0.15)/(1-0.15));
  const cw=lerp(4,16,k);
  cords.forEach(s=> s.overview ? cordWidth(s, 2.0, cam.z/OV.z) : cordWidth(s,cw,cam.z));

  // bg parallax (slow: the paper is far away)
  $('bgImg').setAttribute('x',(-40-cam.cx*0.08*cam.z).toFixed(2));
  $('bgImg').setAttribute('y',(-300-cam.cy*0.08*cam.z).toFixed(2));
  // fg parallax
  const fgOp=clamp((cam.z-0.6)/0.3);
  S.fg.forEach(o=>{ const sx=(o.X-cam.cx)*cam.z*1.7+540, sy=o.Y+(675-cam.cy)*0.4; o.g.setAttribute('transform',`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`); o.g.style.display=(fgOp<=0||sx<-900||sx>2000)?'none':''; o.g.setAttribute('opacity',fgOp); });

  /* S1 — the dot */
  const dIn=tw(f,4,20,E.out);
  const pulse=t0=>1+0.34*(E.out(prog(f,t0,t0+6))-E.out(prog(f,t0+6,t0+18)));
  const ds=dIn*(f<36?pulse(18):pulse(36));
  S.dot.setAttribute('r',(15*ds).toFixed(2));
  [[S.ring1,18],[S.ring2,36]].forEach(([c,t0])=>{ const a=prog(f,t0,t0+26); c.setAttribute('r',16+E.out(a)*70); c.setAttribute('opacity',a>0&&a<1?(1-a)*0.5:0); });
  S.typing.set(f,10,40,2.2,18);

  /* the cord drawing */
  span(S.seg0,0,tw(f,44,92,E.pen));
  const b1=tw(f,88,118,E.pen); span(S.bubT,0,b1); span(S.bubB,0,b1);
  span(S.seg1,0,tw(f,146,180,E.pen));
  const c1=tw(f,174,208,E.pen); span(S.cirT,0,c1); span(S.cirB,0,c1);
  span(S.seg2,0,tw(f,254,286,E.pen));
  const t1=tw(f,282,310,E.pen); span(S.tagT,0,t1); span(S.tagB,0,t1);
  span(S.hole,0,tw(f,302,316,E.pen));
  span(S.seg3,0,tw(f,344,378,E.pen));
  const m1=tw(f,374,416,E.pen); span(S.frmT,0,m1); span(S.frmB,0,m1);
  span(S.seg4,0,tw(f,430,476,E.pen));
  span(S.logoRing,0,tw(f,530,554,E.pen));

  /* type */
  S.s2cap.set(f,102,138); S.s2a.set(f,106,138); S.s2b.set(f,111,138);
  S.s3cap.set(f,192,246); S.s3a.set(f,194,246); S.s3b.set(f,199,246); S.s3num.set(f,204,246); S.s3mem.set(f,208,246);
  S.s4cap.set(f,294,336); S.s4sub.set(f,298,336,2.4); S.s4hero.set(f,304,336,2,18);
  S.s5cap.set(f,390,420); S.memTxt.set(f,398,1e9,2.4,22); S.s5a.set(f,402,420,2.6,24); S.s5b.set(f,408,420,2.6,24);
  S.b1.set(f,468,512,3); S.b2.set(f,472,512,3); S.bcap.set(f,480,512,1.6);
  S.end1.set(f,552,1e9,3,22); S.end2.set(f,558,1e9,3,22);
  S.spec.set(f,574,1e9,1.2,16);

  /* members + counter */
  let n=0;
  S.members.forEach(m=>{ const a=tw(f,m.t0,m.t0+12,E.out); m.c.setAttribute('transform',`translate(${m.x} ${m.y}) scale(${a.toFixed(4)}) translate(${-m.x} ${-m.y})`); if(a>0.5) n++; });
  S.s3num.text(String(n));

  /* memory */
  S.memWash.setAttribute('opacity',tw(f,392,440,E.out));
  const mb=tw(f,396,424,E.out); S.memBub.setAttribute('opacity',mb*0.95);
  S.memBub.setAttribute('transform',`translate(5860 660) scale(${lerp(0.92,1,mb)}) translate(-5860 -660)`);

  /* other people's threads */
  S.rows.forEach((s,i)=>{ const a=tw(f,446+i*2.6,446+i*2.6+40,E.pen), b=tw(f,514+i*1.2,514+i*1.2+16,E.in); span(s,b,a); });

  /* logo */
  const dk=tw(f,550,566,E.out); S.disk.setAttribute('r',110*dk);
  const rv=tw(f,558,574,E.out); S.logoRevealRect.setAttribute('y',lerp(120,-120,rv));
  const settle=1+0.05*(1-tw(f,550,592,E.out))*(f>=550?1:0);
  S.logo.setAttribute('transform',`translate(${LOGO[0]} ${LOGO[1]}) scale(${settle})`);

  S.ctx.putImageData(S.grain[Math.floor(f)%12],0,0);
}

/* ---------- boot ---------- */
(async()=>{
  await Promise.all([
    document.fonts.load('800 100px Brico'),document.fonts.load('700 100px Brico'),document.fonts.load('500 100px Brico'),
    document.fonts.load('400 40px ISans'),document.fonts.load('500 40px ISans'),document.fonts.load('600 40px ISans'),
    document.fonts.load('italic 400 100px ISerif')]);
  await document.fonts.ready;
  build();
  await new Promise(r=>{ const i=new Image(); i.onload=r; i.onerror=r; i.src='assets/facebook-logo.svg'; });
  const q=new URLSearchParams(location.search);
  seek(Number(q.get('f')||0));
  window.seek=seek; window.TOTAL=TOTAL; window.ready=true;
})();
