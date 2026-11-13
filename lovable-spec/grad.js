// Living Lovable gradient on creme (official palette), as a full-screen shader. Pure function of t.
import * as THREE from 'three';
const W = 1080, H = 1350;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), prog = (t, a, b) => clamp((t - a) / (b - a));
const eInOut = p => p < .5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2, lerp = (a, b, p) => a + (b - a) * p;
const FRAG = `precision highp float;
uniform vec2 uRes,uC; uniform float uT,uR; uniform vec3 cL,cC,cR,cRim,cBg;
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
 vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx); vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
 vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
 vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
 vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
 vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
 m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
 vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.*dot(m,g);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
 vec2 uv=gl_FragCoord.xy/uRes;
 vec2 w=vec2(snoise(uv*1.5+vec2(0.,uT*.08)),snoise(uv*1.5+vec2(4.7,-uT*.07)))*.075;
 vec2 d=vec2(uv.x-uC.x,(uv.y-uC.y)*1.25)+w; float r=length(d);
 float inside=smoothstep(uR,uR*.3,r);
 float a=clamp(.5+(uv.x-uC.x)*1.4+w.x*2.5+snoise(uv*2.+uT*.05)*.06,0.,1.);
 vec3 col=mix(cL,cC,smoothstep(.05,.55,a)); col=mix(col,cR,smoothstep(.48,.98,a+(uC.y-uv.y)*.2));
 float rim=exp(-pow((r-uR*.82)/(.08*uR+.015),2.)); col=mix(col,cRim,rim*.5);
 vec3 o=mix(cBg,col,inside);
 o+=(hash(gl_FragCoord.xy+fract(uT)*91.)-.5)*(3./255.);
 gl_FragColor=vec4(o,1.);}`;
let R, S, C, M;
const v3 = h => { const c = new THREE.Color(); c.setHex(parseInt(h.slice(1), 16), THREE.LinearSRGBColorSpace); return new THREE.Vector3(c.r, c.g, c.b); };
export function initGrad(canvas) {
  R = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W, H, false);
  S = new THREE.Scene(); C = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  M = new THREE.ShaderMaterial({ fragmentShader: FRAG, vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}',
    uniforms: { uRes: { value: new THREE.Vector2(W, H) }, uC: { value: new THREE.Vector2(.95, .02) }, uT: { value: 0 }, uR: { value: .5 },
      cL: { value: v3('#4B73FF') }, cC: { value: v3('#FF0178') }, cR: { value: v3('#FF6D1B') }, cRim: { value: v3('#FFA6F9') }, cBg: { value: v3('#F7F4ED') } } });
  S.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), M));
}
// keyframed states: [t, cx, cy, radius]
const K = [[0, .98, -.02, .5], [9.9, .98, -.02, .55], [10.6, .5, -.32, 1.05], [14.2, .5, -.32, 1.05], [15.2, .5, .556, .6], [20, .5, .556, .64]];
export function renderGrad(t) {
  let a = K[0], b = K[0];
  for (let i = 0; i < K.length - 1; i++) if (t >= K[i][0]) { a = K[i]; b = K[i + 1]; }
  const p = eInOut(prog(t, a[0], b[0]));
  const breathe = Math.sin(t * 1.2) * .02;
  M.uniforms.uC.value.set(lerp(a[1], b[1], p), lerp(a[2], b[2], p));
  M.uniforms.uR.value = lerp(a[3], b[3], p) + breathe; M.uniforms.uT.value = t;
  R.render(S, C);
}
