// THE THREAD — a frame-accurate, seekable composition. window.seek(frame) renders any (sub)frame.
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const FPS = 30, W = 1080, H = 1350, TOTAL = 630;
const C = { blue:'#0866FF', paper:'#F3F0E8', ink:'#0D0F14', ember:'#FF6A3D', fog:'#B9B4A8', inkSoft:'#5E5A52' };

/* ---------- math ---------- */
const clamp = (v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const prog = (f,a,b)=>clamp((f-a)/(b-a));
function bez(x1,y1,x2,y2){
  const cx=3*x1, bx=3*(x2-x1)-cx, ax=1-cx-bx, cy=3*y1, by=3*(y2-y1)-cy, ay=1-cy-by;
  const sx=t=>((ax*t+bx)*t+cx)*t, sy=t=>((ay*t+by)*t+cy)*t, dx=t=>(3*ax*t+2*bx)*t+cx;
  return x=>{ if(x<=0) return 0; if(x>=1) return 1; let t=x;
    for(let i=0;i<8;i++){ const e=sx(t)-x, d=dx(t); if(Math.abs(e)<1e-6) break; if(Math.abs(d)<1e-6) break; t-=e/d; }
    let lo=0,hi=1; if(Math.abs(sx(t)-x)>1e-5){ t=x; for(let i=0;i<30;i++){ const v=sx(t); if(v<x) lo=t; else hi=t; t=(lo+hi)/2; } }
    return sy(t); };
}
// One easing family for the whole film
const E = {
  out: bez(.16,1,.3,1),     // entrances (expo-out)
  in:  bez(.64,0,.78,0),    // exits (quint-in)
  cam: bez(.65,0,.35,1),    // camera
  pen: bez(.5,0,.12,1),     // the thread: pen pressure, fast attack, long settle
  lin: t=>t,
};
const tw=(f,a,b,e=E.out)=>e(prog(f,a,b));
function rng(seed){ let s=seed>>>0; return ()=>{ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }

/* ---------- dom ---------- */
function el(tag, attrs={}, parent){ const n=document.createElementNS(NS,tag); for(const k in attrs) n.setAttribute(k,attrs[k]); if(parent) parent.appendChild(n); return n; }
const $=id=>document.getElementById(id);
let clipId=0;

/* ---------- drawable strokes ---------- */
const strokes=[];
function stroke(d, parent, opts={}){
  const n=el('path',{d, fill:'none', stroke:opts.color||C.blue, 'stroke-linecap':'round','stroke-linejoin':'round'},parent);
  if(opts.opacity!=null) n.setAttribute('opacity',opts.opacity);
  const s={n, L:n.getTotalLength(), w:opts.w||9, local:opts.local||1};
  strokes.push(s); return s;
}
function span(s,a,b){ // show fraction [a,b] of the path
  if(b-a<=0.0005){ s.n.style.visibility='hidden'; return; }
  s.n.style.visibility='visible';
  s.n.setAttribute('stroke-dasharray', `${(b-a)*s.L} ${s.L*2+10}`);
  s.n.setAttribute('stroke-dashoffset', `${-a*s.L}`);
}

/* ---------- masked word lines ---------- */
function measure(parent, str, attrs){ const t=el('text',{...attrs, style:(attrs.style||'')+';white-space:pre'},parent); t.textContent=str; const w=t.getComputedTextLength(); t.remove(); return w; }
function line(parent, str, o){
  // o: x,y,size,family,weight,fill,anchor('start'|'middle'),ls(em),style,upper
  const attrs={ 'font-family':o.family, 'font-weight':o.weight||400, 'font-size':o.size, fill:o.fill||C.ink,
    'letter-spacing':`${(o.ls||0)*o.size}px`, 'font-style':o.style||'normal' };
  if(o.tnum) attrs.style='font-variant-numeric:tabular-nums';
  const words=str.split(' ');
  const full=measure(parent,str,attrs);
  const x0 = o.anchor==='middle' ? o.x-full/2 : o.anchor==='end' ? o.x-full : o.x;
  const id='lc'+(clipId++);
  const cp=el('clipPath',{id},parent);
  el('rect',{x:x0-o.size, y:o.y-o.size*1.15, width:full+o.size*2, height:o.size*1.55},cp);
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
        const y=(1-a)*this.size*1.12 - b*this.size*1.12;
        t.setAttribute('transform',`translate(0 ${y.toFixed(2)})`);
        t.style.visibility=(a<=0||b>=1)?'hidden':'visible';
      });
    },
    text(str){ items[0].textContent=str; } };
}

/* ---------- world geometry ---------- */
const TAG_C=[4480,700], TAG_R=-5*Math.PI/180;
const rot=(x,y)=>{ const dx=x-TAG_C[0], dy=y-TAG_C[1]; return [TAG_C[0]+dx*Math.cos(TAG_R)-dy*Math.sin(TAG_R), TAG_C[1]+dx*Math.sin(TAG_R)+dy*Math.cos(TAG_R)]; };
const tagTip=rot(4060,700), tagRight=rot(4900,700);

// camera keyframes [frame, cx, cy, zoom, easeIntoThisKey]
const K=[
  [0,   540, 675, 1.00, 'lin'],
  [44,  540, 675, 1.06, 'lin'],
  [96,  1900,640, 1.00, 'cam'],
  [144, 1935,652, 1.035,'lin'],
  [186, 3300,760, 1.00, 'cam'],
  [252, 3322,770, 1.035,'lin'],
  [290, 4480,700, 1.00, 'cam'],
  [342, 4502,706, 1.035,'lin'],
  [386, 5600,700, 1.00, 'cam'],
  [426, 5616,704, 1.045,'lin'],
  [478, 3550,185, 0.165,'cam'],
  [516, 3566,190, 0.172,'lin'],
  [550, 6700,535, 1.00, 'out'],
  [630, 6700,548, 1.045,'lin'],
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
const OV={cx:3550, cy:185, z:0.165}; // overview camera, used to place other people's threads

function build(){
  const world=$('world');
  const lay=el('g',{},world);          // shapes
  const txt=el('g',{},world);          // type
  const rowsG=el('g',{transform:`translate(${OV.cx-540/OV.z} ${OV.cy-675/OV.z}) scale(${1/OV.z})`},world);
  S.rowsG=rowsG;

  // scene 1: the dot
  S.ring1=el('circle',{cx:540,cy:675,r:16,fill:'none',stroke:C.blue,'stroke-width':2.5},lay);
  S.ring2=el('circle',{cx:540,cy:675,r:16,fill:'none',stroke:C.blue,'stroke-width':2.5},lay);
  S.dot=el('circle',{cx:540,cy:675,r:15,fill:C.blue},lay);
  S.typing=line(txt,'Maya is typing',{x:584,y:687,size:34,family:'ISans',weight:500,fill:C.inkSoft,ls:-0.01});

  // thread segments + shapes
  S.seg0=stroke('M540 675 C 800 675 880 588 1070 606 S 1350 640 1460 635',lay);
  S.bubT=stroke('M1460 635 V540 A70 70 0 0 1 1530 470 H2270 A70 70 0 0 1 2340 540 V635',lay);
  S.bubB=stroke('M1460 635 V730 A70 70 0 0 0 1530 800 H1588 L1548 884 L1690 800 H2270 A70 70 0 0 0 2340 730 V635',lay);
  S.seg1=stroke('M2340 635 C 2520 635 2590 790 2770 802 S 2940 780 3000 780',lay);
  S.cirT=stroke('M3000 780 A300 300 0 0 1 3600 780',lay);
  S.cirB=stroke('M3000 780 A300 300 0 0 0 3600 780',lay);
  S.seg2=stroke(`M3600 780 C 3760 780 3830 650 3930 668 S ${tagTip[0]-60} ${tagTip[1]+10} ${tagTip[0]} ${tagTip[1]}`,lay);
  const P=(x,y)=>rot(x,y).map(v=>v.toFixed(1)).join(' ');
  S.tagT=stroke(`M${P(4060,700)} L${P(4240,500)} L${P(4860,500)} A40 40 0 0 1 ${P(4900,540)} L${P(4900,700)}`,lay);
  S.tagB=stroke(`M${P(4060,700)} L${P(4240,900)} L${P(4860,900)} A40 40 0 0 0 ${P(4900,860)} L${P(4900,700)}`,lay);
  const hc=rot(4196,700);
  S.hole=stroke(`M${hc[0]-24} ${hc[1]} a24 24 0 1 1 48 0 a24 24 0 1 1 -48 0`,lay,{w:7});
  S.seg3=stroke(`M${tagRight[0]} ${tagRight[1]} C ${tagRight[0]+150} ${tagRight[1]} 5110 760 5200 722 S 5270 680 5300 680`,lay);
  // memory frame: inner content first so the line sits on top
  S.mem=el('g',{'clip-path':'url(#frameClip)'},lay);
  S.memWash=el('rect',{x:5312,y:342,width:576,height:676,fill:'url(#emberWash)'},S.mem);
  S.memA=el('circle',{cx:5548,cy:640,r:118,fill:C.blue},S.mem);
  S.memB=el('circle',{cx:5668,cy:668,r:104,fill:C.ember,style:'mix-blend-mode:multiply'},S.mem);
  S.frmT=stroke('M5300 680 V330 H5900 V680',lay);
  S.frmB=stroke('M5300 680 V1030 H5900 V680',lay);
  S.seg4=stroke('M5900 680 C 6080 680 6170 596 6330 626 S 6520 680 6590 680',lay);
  S.logoRing=stroke('M6590 680 A110 110 0 1 1 6810 680 A110 110 0 1 1 6590 680',lay);

  // group members: phyllotaxis, one blue dot = the newest member
  const r=rng(7); S.members=[];
  const gm=el('g',{},lay);
  for(let i=0;i<214;i++){
    const rr=262*Math.sqrt((i+0.6)/214), th=i*2.399963+0.6;
    const x=3300+rr*Math.cos(th), y=780+rr*Math.sin(th);
    const isYou=i===0;
    const c=el('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:isYou?13:(5.5+r()*4.5),
      fill:isYou?C.blue:(r()<.28?C.fog:C.ink), opacity:isYou?1:(0.82+r()*.18)},gm);
    S.members.push({c, t0:192+Math.pow(i/214,0.85)*44});
  }

  // logo: disk + official mark revealed upward
  S.logo=el('g',{transform:'translate(6700 680)'},lay);
  S.disk=el('circle',{cx:0,cy:0,r:110,fill:C.blue},S.logo);
  const lc=el('clipPath',{id:'logoReveal'},S.logo);
  S.logoRevealRect=el('rect',{x:-120,y:120,width:240,height:240},lc);
  S.logoImg=el('image',{href:'assets/facebook-logo.svg',x:-110,y:-110,width:220,height:220,'clip-path':'url(#logoReveal)'},S.logo);

  // type, world space
  S.s2cap=line(txt,'Maya · just now',{x:1462,y:428,size:32,family:'ISans',weight:500,fill:C.inkSoft});
  S.s2hero=line(txt,'tennis sunday?',{x:1900,y:670,size:104,family:'Brico',weight:800,anchor:'middle',ls:-0.035});
  S.s3cap=line(txt,'GROUP',{x:3300,y:300,size:26,family:'ISans',weight:600,fill:C.inkSoft,anchor:'middle',ls:0.14});
  S.s3hero=line(txt,'Sunday Tennis',{x:3300,y:418,size:112,family:'Brico',weight:800,anchor:'middle',ls:-0.035});
  S.s3count=line(txt,'214 members',{x:3300,y:1150,size:44,family:'ISans',weight:600,anchor:'middle',tnum:true,ls:-0.01});
  const tagTxt=el('g',{transform:`rotate(-5 ${TAG_C[0]} ${TAG_C[1]})`},txt);
  S.s4cap=line(tagTxt,'Marketplace · 2 km away',{x:4300,y:584,size:30,family:'ISans',weight:500,fill:C.inkSoft});
  S.s4sub=line(tagTxt,'Bike. Barely ridden.',{x:4300,y:650,size:48,family:'ISans',weight:600,ls:-0.015});
  S.s4hero=line(tagTxt,'$80',{x:4290,y:850,size:230,family:'Brico',weight:800,ls:-0.045});
  S.s5cap=line(txt,'MEMORIES',{x:5300,y:296,size:26,family:'ISans',weight:600,fill:C.inkSoft,ls:0.14});
  S.s5hero=line(txt,'7 years ago today',{x:5600,y:1138,size:112,family:'ISerif',weight:400,style:'italic',anchor:'middle',ls:-0.02});
  // end card (world, so it takes the final push-in)
  let hs=112; const probe={family:'Brico',weight:800,ls:-0.035};
  const wmax=Math.max(measure(txt,'are already here.',{'font-family':'Brico','font-weight':800,'font-size':hs,'letter-spacing':`${-0.035*hs}px`}));
  if(wmax>900) hs=Math.floor(hs*900/wmax);
  S.end1=line(txt,'Your people',{x:6700,y:270,size:hs,...probe,anchor:'middle'});
  S.end2=line(txt,'are already here.',{x:6700,y:270+hs*0.98,size:hs,...probe,anchor:'middle'});

  // HUD (screen space)
  const hud=$('hud');
  S.b1=line(hud,'3 billion',{x:96,y:300,size:150,family:'Brico',weight:800,ls:-0.045});
  S.b2=line(hud,'people.',{x:96,y:440,size:150,family:'Brico',weight:800,ls:-0.045});
  S.bcap=line(hud,'on Facebook, every month.',{x:100,y:512,size:38,family:'ISans',weight:500,fill:C.inkSoft});
  S.spec=line(hud,'Spec ad. Not affiliated with Meta.',{x:540,y:1306,size:20,family:'ISans',weight:500,fill:'#8E897E',anchor:'middle'});

  // other people's threads (overview space = screen px at overview camera)
  const rr2=rng(23); S.rows=[];
  const rowYs=[70,140,570,640,880,950,1020,1090,1160,1230,1300];
  rowYs.forEach((y,ri)=>{
    let x=-60-rr2()*40, d=`M${x.toFixed(1)} ${y}`;
    while(x<1140){
      const k=rr2(), step=40+rr2()*70;
      if(k<.18){ // cursive loop
        const s=10+rr2()*8; d+=` C ${x+s*1.6} ${y} ${x+s*2.2} ${y-s*2.2} ${x+s*1.2} ${y-s*2.2} C ${x+s*.2} ${y-s*2.2} ${x+s*.6} ${y} ${x+s*2.6} ${y}`; x+=s*2.6;
      } else if(k<.32){ // bubble bump
        const w=34+rr2()*60, h=12+rr2()*12, r=Math.min(6,h/2); d+=` V${y-h+r} q0 ${-r} ${r} ${-r} h${w-2*r} q${r} 0 ${r} ${r} V${y}`; x+=w;
      } else if(k<.44){ // circle top
        const r=9+rr2()*12; d+=` a${r} ${r} 0 0 1 ${2*r} 0`; x+=2*r;
      } else { // wave
        const a=(rr2()-.5)*16; d+=` q${step/2} ${a} ${step} 0`; x+=step;
      }
    }
    const col = rr2()<.3 ? C.inkSoft : C.fog;
    const s=stroke(d,rowsG,{color:col,w:2.2,local:OV.z,opacity:col===C.fog?1:.55});
    s.order=Math.abs(y-757); S.rows.push(s);
  });
  S.rows.sort((a,b)=>a.order-b.order);

  // foreground defocused threads (parallax 1.7)
  const fg=$('fg'); S.fg=[];
  [[1250,-160,'M0 0 C 180 120 260 420 120 760'],[2660,120,'M0 0 C 220 -90 300 300 80 520 S -140 980 60 1300'],[5080,-80,'M0 0 C -160 240 180 520 40 900']]
    .forEach(([X,Y,d])=>{ const g=el('g',{},fg); el('path',{d,fill:'none',stroke:C.blue,'stroke-width':58,'stroke-linecap':'round',opacity:.2,filter:'url(#fgBlur)'},g); S.fg.push({g,X,Y}); });

  // grain buffers (pre-baked, cycled)
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
  // stroke weight held in screen space: 9px close, 3px in the overview
  const swScreen=lerp(3.2,9,clamp((cam.z-0.165)/(1-0.165)));
  strokes.forEach(s=>s.n.setAttribute('stroke-width', s.local!==1 ? 2.2*OV.z/cam.z : swScreen*(s.w/9)/cam.z));

  // bg parallax (slow: the paper is far away)
  $('bgImg').setAttribute('x',(-40-cam.cx*0.08*cam.z).toFixed(2));
  $('bgImg').setAttribute('y',(-300-cam.cy*0.08*cam.z).toFixed(2));

  // fg parallax
  const fgOp=clamp((cam.z-0.6)/0.3);
  S.fg.forEach(o=>{ const sx=(o.X-cam.cx)*cam.z*1.7+540, sy=o.Y+(675-cam.cy)*0.4; o.g.setAttribute('transform',`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`); o.g.style.display=(fgOp<=0||sx<-900||sx>2000)?'none':''; o.g.setAttribute('opacity',fgOp); });

  /* S1 — the dot (0–45) */
  const dIn=tw(f,4,20,E.out);
  const pulse=t0=>1+0.34*(E.out(prog(f,t0,t0+6))-E.out(prog(f,t0+6,t0+18)));
  const ds=dIn*(f<36?pulse(18):pulse(36));
  S.dot.setAttribute('r',(15*ds).toFixed(2));
  [[S.ring1,18],[S.ring2,36]].forEach(([c,t0])=>{ const a=prog(f,t0,t0+26); c.setAttribute('r',16+E.out(a)*70); c.setAttribute('opacity',a>0&&a<1?(1-a)*0.55:0); });
  S.typing.set(f,10,40,2.2,18);

  /* thread drawing */
  span(S.seg0,0,tw(f,44,92,E.pen));
  const b1=tw(f,88,118,E.pen); span(S.bubT,0,b1); span(S.bubB,0,b1);
  span(S.seg1,0,tw(f,146,178,E.pen));
  const c1=tw(f,172,206,E.pen); span(S.cirT,0,c1); span(S.cirB,0,c1);
  span(S.seg2,0,tw(f,254,284,E.pen));
  const t1=tw(f,280,308,E.pen); span(S.tagT,0,t1); span(S.tagB,0,t1);
  span(S.hole,0,tw(f,300,314,E.pen));
  span(S.seg3,0,tw(f,344,378,E.pen));
  const m1=tw(f,374,416,E.pen); span(S.frmT,0,m1); span(S.frmB,0,m1);
  span(S.seg4,0,tw(f,430,476,E.pen));
  span(S.logoRing,0,tw(f,530,554,E.pen));

  /* type */
  S.s2cap.set(f,104,140); S.s2hero.set(f,110,140,3);
  S.s3cap.set(f,196,248); S.s3hero.set(f,200,248,3); S.s3count.set(f,206,248);
  S.s4cap.set(f,296,338); S.s4sub.set(f,300,338,2.4); S.s4hero.set(f,306,338);
  S.s5cap.set(f,392,422); S.s5hero.set(f,398,422,2.6,26);
  S.b1.set(f,468,512,3); S.b2.set(f,472,512,3); S.bcap.set(f,480,512,1.6);
  S.end1.set(f,552,1e9,3,22); S.end2.set(f,558,1e9,3,22);
  S.spec.set(f,574,1e9,1.2,16);

  /* members + counter */
  let n=0;
  S.members.forEach(m=>{ const a=tw(f,m.t0,m.t0+12,E.out); m.c.setAttribute('transform',`translate(${m.c.getAttribute('cx')} ${m.c.getAttribute('cy')}) scale(${a}) translate(${-m.c.getAttribute('cx')} ${-m.c.getAttribute('cy')})`); if(a>0.5) n++; });
  S.s3count.text(String(n));

  /* memory */
  const w=tw(f,394,440,E.out); S.memWash.setAttribute('opacity',w);
  const ma=tw(f,400,428,E.out), mb=tw(f,406,434,E.out);
  S.memA.setAttribute('transform',`translate(${(1-ma)*-60} 0)`); S.memA.setAttribute('opacity',ma);
  S.memB.setAttribute('transform',`translate(${(1-mb)*60} 0)`); S.memB.setAttribute('opacity',mb);

  /* other threads */
  S.rows.forEach((s,i)=>{ const a=tw(f,446+i*2.6,446+i*2.6+40,E.pen), b=tw(f,514+i*1.2,514+i*1.2+16,E.in); span(s,b,a); });

  /* logo */
  const dk=tw(f,550,566,E.out); S.disk.setAttribute('r',110*dk);
  const rv=tw(f,558,572,E.out); S.logoRevealRect.setAttribute('y',lerp(120,-120,rv));
  const settle=1+0.05*(1-tw(f,550,590,E.out))*(f>=550?1:0);
  S.logo.setAttribute('transform',`translate(6700 680) scale(${settle})`);

  /* grain */
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
  // wait for logo image
  await new Promise(r=>{ const i=new Image(); i.onload=r; i.onerror=r; i.src='assets/facebook-logo.svg'; });
  const q=new URLSearchParams(location.search);
  seek(Number(q.get('f')||0));
  window.seek=seek; window.TOTAL=TOTAL; window.ready=true;
})();
