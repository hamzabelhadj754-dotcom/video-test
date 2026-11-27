// renderer.js: WebGL2 renderer. Every frame is computed from t inside seek(t): no timers, no CSS transitions.
import * as S from './scene.js';
const { W, H, F, PAGE_W, PAGE_H } = S;

const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255); };
const toLin = c => c.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const FLOOR_MID = toLin(hex('#f9fbfb')), FLOOR_EDGE = toLin(hex('#f2f3f6')), SHADOW = toLin(hex('#1a2133'));

// ------------------------------------------------------------------ shaders
const VS_QUAD = `#version 300 es
uniform vec3 uC[4]; uniform vec3 uPos, uU, uF; uniform float uFocal; uniform vec2 uRes;
out vec2 vUv; out float vDepth; out vec3 vWorld;
void main(){
  int i = gl_VertexID; vec2 uv = vec2(float(i & 1), float(i >> 1));
  vec3 P = uC[i]; vec3 v = P - uPos;
  float zc = dot(v, uF), xc = v.x, yc = dot(v, uU);
  gl_Position = vec4(xc * uFocal / (uRes.x * 0.5), yc * uFocal / (uRes.y * 0.5), 0.0, zc);
  vUv = uv; vDepth = zc; vWorld = P;
}`;
const VS_FULL = `#version 300 es
out vec2 vUv; void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FLOOR_FN = `
uniform vec3 uFloorMid, uFloorEdge; uniform vec2 uRes;
vec3 floorColor(vec2 fc){ vec2 q = (fc / uRes - 0.5) * 2.0; float r = clamp(length(q) / 1.41421, 0.0, 1.0); return mix(uFloorMid, uFloorEdge, smoothstep(0.0, 1.0, r)); }`;
const SDF = `float sdRR(vec2 p, vec4 r, float rad){ vec2 c = r.xy + r.zw * 0.5; vec2 q = abs(p - c) - r.zw * 0.5 + rad; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad; }`;

const FS_FLOOR = `#version 300 es
precision highp float; ${FLOOR_FN}
uniform vec3 uPos, uU, uF; uniform float uFocal;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oD;
void main(){
  vec2 fc = gl_FragCoord.xy; float sx = fc.x - uRes.x * 0.5, sy = fc.y - uRes.y * 0.5;   // sy up
  vec3 dir = uF + vec3(1,0,0) * (sx / uFocal) + uU * (sy / uFocal);
  float zc = dir.z < -1e-4 ? -uPos.z / dir.z : 1e5;
  oC = vec4(floorColor(fc), 1.0); oD = vec4(zc, 0, 0, 1);
}`;

const FS_PAGE_SHADOW = `#version 300 es
precision highp float; ${SDF}
in vec3 vWorld; uniform vec4 uRect; uniform float uRad, uSigma, uAmt; uniform vec3 uShadow;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oD;
void main(){
  float sd = sdRR(vWorld.xy, uRect, uRad);
  float a = uAmt * (1.0 - smoothstep(-uSigma * 0.6, uSigma * 2.4, sd));
  oC = vec4(uShadow * a, a); oD = vec4(0);
}`;

const FS_PAGE = `#version 300 es
precision highp float; ${FLOOR_FN} ${SDF}
in vec2 vUv; in float vDepth; in vec3 vWorld;
uniform sampler2D uTex; uniform vec4 uMask; uniform float uRad, uFade, uHeroBottom;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oD;
void main(){
  float sd = sdRR(vWorld.xy, uMask, uRad); float aa = max(fwidth(sd), 1e-3);
  float m = 1.0 - smoothstep(-aa, aa, sd); if (m <= 0.0) discard;
  vec3 c = texture(uTex, vUv).rgb;
  float below = smoothstep(uHeroBottom - 1.0, uHeroBottom + 1.0, vWorld.y);
  c = mix(c, floorColor(gl_FragCoord.xy), uFade * below);
  float k = step(0.5, m);
  oC = vec4(c * m, m); oD = vec4(vDepth * k, 0, 0, k);
}`;

const FS_PIECE = `#version 300 es
precision highp float; ${FLOOR_FN}
in vec2 vUv; in float vDepth;
uniform sampler2D uTex; uniform float uFade;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oD;
void main(){
  vec4 c = texture(uTex, vUv);              // linear, premultiplied
  if (c.a < 0.002) discard;
  c.rgb = mix(c.rgb, floorColor(gl_FragCoord.xy) * c.a, uFade);   // fade into the haze colour first
  float k = step(0.5, c.a);
  oC = c; oD = vec4(vDepth * k, 0, 0, k);
}`;

const FS_SOLID = `#version 300 es
precision highp float; in vec2 vUv; in float vDepth; uniform vec3 uColor;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oD;
void main(){ float shade = mix(1.0, 0.80, smoothstep(0.0, 1.0, vUv.y)); oC = vec4(uColor * shade, 1.0); oD = vec4(vDepth, 0, 0, 1); }`;

// shadow of a lifted piece: its rounded-rect silhouette in flat colour, offset and blurred (analytic, no mip blocks)
const FS_PIECE_SHADOW = `#version 300 es
precision highp float; ${SDF}
in vec3 vWorld; uniform vec4 uRect; uniform float uRad, uBlur, uAmt; uniform vec3 uShadow;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oD;
void main(){
  float sd = sdRR(vWorld.xy, uRect, uRad);
  float a = (1.0 - smoothstep(-0.85 * uBlur, 0.85 * uBlur, sd)) * uAmt;
  oC = vec4(uShadow * a, a); oD = vec4(0);
}`;

const FS_ACCUM = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uC, uD; uniform float uW;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oD;
void main(){ oC = texture(uC, vUv) * uW; oD = texture(uD, vUv) * uW; }`;

const COC = `uniform float uFocus;
float coc(float z){ return z < uFocus ? min(120.0, 75.0 * (uFocus - z) / max(z, 1.0)) : min(120.0, 6.0 * (z - uFocus) / z); }
float cocNear(float z){ return z < uFocus ? min(120.0, 75.0 * (uFocus - z) / max(z, 1.0)) : 0.0; }`;

// near-CoC max per 16px tile, then dilated, so foreground blur can spill over sharp pixels behind it
const FS_TILEMAX = `#version 300 es
precision highp float; ${COC} uniform sampler2D uD; uniform vec2 uRes;
out vec4 o;
void main(){
  vec2 base = floor(gl_FragCoord.xy) * 16.0; float m = 0.0;
  for (int y = 0; y < 4; y++) for (int x = 0; x < 4; x++) m = max(m, cocNear(textureLod(uD, (base + vec2(x, y) * 4.0 + 2.0) / uRes, 0.0).r));
  o = vec4(m);
}`;
const FS_DILATE = `#version 300 es
precision highp float; uniform sampler2D uT; uniform vec2 uDir;
out vec4 o;
void main(){ ivec2 p = ivec2(gl_FragCoord.xy), sz = textureSize(uT, 0); float m = 0.0;
  for (int i = -8; i <= 8; i++){ ivec2 q = clamp(p + ivec2(uDir) * i, ivec2(0), sz - 1); m = max(m, texelFetch(uT, q, 0).r); }
  o = vec4(m); }`;

// depth of field per pixel: 40 taps on a golden-angle disc, each from a mip level matched to its blur
// near layer: near-lens pixels, premultiplied by how out of focus they are; mipmapped for the spill
// a pixel joins the near layer only if its blur is close to the largest nearby blur: the near-lens object itself,
// not the page around it (which is blurred too, but by less)
const NEAR_A = `float nearA(float cn, float R){ return smoothstep(0.55, 0.85, cn / max(R, 1.0)) * step(1.5, cn); }`;
const FS_NEAR = `#version 300 es
precision highp float; ${COC} ${NEAR_A}
in vec2 vUv; uniform sampler2D uC, uD, uTile;
out vec4 o;
void main(){ float a = nearA(cocNear(textureLod(uD, vUv, 0.0).r), texture(uTile, vUv).r); o = vec4(textureLod(uC, vUv, 0.0).rgb * a, a); }`;

// depth of field per pixel: 40 taps on a golden-angle disc, each from a mip level matched to its blur
const FS_DOF = `#version 300 es
precision highp float; ${COC} ${NEAR_A}
in vec2 vUv; uniform sampler2D uC, uD, uTile, uOver, uNear; uniform vec2 uRes; uniform float uFrame; uniform int uDebug;
out vec4 o;
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }   // interleaved gradient noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uFrame * 0.618) * 43758.5453); }
void main(){
  float zc = texture(uD, vUv).r; float c0 = coc(zc);
  float R = max(c0, texture(uTile, vUv).r);
  if (uDebug == 7) { c0 = 0.0; R = 0.0; }                             // fast preview: no depth of field
  vec3 acc = textureLod(uC, vUv, 0.0).rgb; float wsum = 1.0;          // the centre always counts
  float rot = ign(gl_FragCoord.xy) * 6.2831853;
  if (c0 >= 0.75) {                                                    // its own blur: 40 taps over its own radius
    const int N = 40;
    for (int i = 0; i < N; i++){
      float r = sqrt((float(i) + 0.5) / float(N)) * c0; float th = float(i) * 2.39996323 + rot;
      vec2 uv = vUv + vec2(cos(th), sin(th)) * r / uRes;
      float zs = textureLod(uD, uv, 0.0).r; float cs = coc(zs);
      float cov = zs > zc ? c0 : cs;          // behind: seen through this pixel's blur. in front: only if its blur reaches
      float w = clamp(cov - r + 1.0, 0.0, 1.0);
      // what is seen through a near blur is taken at this pixel's blur too, so both sides of a soft silhouette match
      float lb = zs > zc ? 0.36 * c0 : 0.36 * min(cs, c0);
      acc += textureLod(uC, uv, log2(max(1.0, lb))).rgb * w; wsum += w;
    }
  }
  vec3 col = acc / wsum;
  if (R > c0 + 1.0) {                                                  // near-lens blur spilling over this pixel
    const int M = 24; vec4 sp = vec4(0); float lod = log2(max(1.0, 0.5 * 0.42 * R));
    for (int j = 0; j < M; j++){
      float r = sqrt((float(j) + 0.5) / float(M)) * R; float th = float(j) * 2.39996323 + rot;
      sp += textureLod(uNear, vUv + vec2(cos(th), sin(th)) * r / uRes, lod);
    }
    sp /= float(M);
    float f = sp.a * (1.0 - nearA(cocNear(zc), R));          // not over the near object itself: its own blur handles that
    col = mix(col, sp.rgb / max(sp.a, 1e-4), clamp(f, 0.0, 1.0));
    if (uDebug == 5) { o = vec4(vec3(f), 1); return; }
    if (uDebug == 6) { o = vec4(vec3(sp.a), 1); return; }
  }
  if (uDebug == 5 || uDebug == 6) { o = vec4(0.2, 0, 0, 1); return; }
  if (uDebug == 1) { o = vec4(vec3(coc(zc) / 120.0), 1); return; }
  if (uDebug == 2) { o = vec4(vec3(R / 120.0), 1); return; }
  if (uDebug == 3) { o = vec4(textureLod(uNear, vUv, 0.0).aaa, 1); return; }
  if (uDebug == 4) { o = vec4(vec3(zc / (uFocus * 2.0)), 1); return; }
  vec4 ov = texture(uOver, vec2(vUv.x, 1.0 - vUv.y));            // overlay (title card), linear premultiplied
  col = ov.rgb + col * (1.0 - ov.a);
  vec3 s = mix(col * 12.92, 1.055 * pow(max(col, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, col));
  s += (hash(gl_FragCoord.xy + 17.0) + hash(gl_FragCoord.yx + 3.1) - 1.0) / 255.0;   // triangular dither: no banding
  o = vec4(s, 1.0);
}`;

// ------------------------------------------------------------------ GL helpers
function compile(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src);
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const loc = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(p, i); loc[u.name.replace('[0]', '')] = gl.getUniformLocation(p, u.name); }
  return { p, loc };
}
function texFrom(gl, src, aniso) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 16);
  return t;
}
function target(gl, w, h, n, { mip = false, fmt = 'RGBA16F' } = {}) {
  const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); const tex = [];
  for (let i = 0; i < n; i++) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    const mp = mip && i === 0;   // only the colour attachment gets mips; depth is read at level 0
    const levels = mp ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl[fmt], w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mp ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0); tex.push(t);
  }
  gl.drawBuffers(tex.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo incomplete ' + fmt);
  return { fb, tex, w, h };
}
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('load ' + src)); i.src = src; });

// ------------------------------------------------------------------ film
export async function createFilm(canvas, base = '..') {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) throw new Error('no webgl2');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('no EXT_color_buffer_float');
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

  const P = {
    floor: compile(gl, VS_FULL, FS_FLOOR), pageShadow: compile(gl, VS_QUAD, FS_PAGE_SHADOW), page: compile(gl, VS_QUAD, FS_PAGE),
    piece: compile(gl, VS_QUAD, FS_PIECE), solid: compile(gl, VS_QUAD, FS_SOLID), pieceShadow: compile(gl, VS_QUAD, FS_PIECE_SHADOW),
    accum: compile(gl, VS_FULL, FS_ACCUM), near: compile(gl, VS_FULL, FS_NEAR), tilemax: compile(gl, VS_FULL, FS_TILEMAX), dilate: compile(gl, VS_FULL, FS_DILATE), dof: compile(gl, VS_FULL, FS_DOF),
  };
  gl.bindVertexArray(gl.createVertexArray());

  // assets: the flat page in two halves (texture limit 8192), each piece, the logo tile
  const meta = await (await fetch(`${base}/capture/out/layers.json`)).json();
  const pageImg = await loadImg(`${base}/capture/out/page.png`);
  const half = pageImg.naturalHeight / 2, chunks = [];
  for (let k = 0; k < 2; k++) {
    const bmp = await createImageBitmap(pageImg, 0, k * half, pageImg.naturalWidth, half, { colorSpaceConversion: 'none' });
    chunks.push({ tex: texFrom(gl, bmp, aniso), y0: k * PAGE_H / 2, y1: (k + 1) * PAGE_H / 2 });
  }
  const layers = [];
  for (const L of meta.layers) {
    const img = await loadImg(`${base}/capture/out/pieces/${L.id}.png`);
    // the image covers the clip rect (piece + 28px padding), in page px
    layers.push({ ...L, tex: texFrom(gl, img, aniso), rect: [L.clip.x, L.clip.y, L.clip.width, L.clip.height], texScale: img.naturalWidth / L.clip.width });
  }
  const tileTex = texFrom(gl, await makeTile(`${base}/assets/logomark-color-2x.png`), aniso);
  const overlay = new Overlay(`${base}/assets`); await overlay.ready;
  const overTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, overTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const scene = target(gl, W, H, 2), acc = target(gl, W, H, 2, { mip: true });
  const tw = Math.ceil(W / 16), th = Math.ceil(H / 16);
  const tA = target(gl, tw, th, 1, { fmt: 'R16F' }), tB = target(gl, tw, th, 1, { fmt: 'R16F' });
  const nearT = target(gl, W / 2, H / 2, 1, { mip: true });

  const setCam = (pr, cam) => {
    const l = pr.loc; gl.uniform3fv(l.uPos, cam.pos); gl.uniform3fv(l.uU, cam.u); gl.uniform3fv(l.uF, cam.f);
    if (l.uFocal) gl.uniform1f(l.uFocal, F); if (l.uRes) gl.uniform2f(l.uRes, W, H);
    if (l.uFloorMid) { gl.uniform3fv(l.uFloorMid, FLOOR_MID); gl.uniform3fv(l.uFloorEdge, FLOOR_EDGE); }
  };
  const quad = (pr, corners) => { gl.uniform3fv(pr.loc.uC, corners.flat()); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  const use = (pr, cam) => { gl.useProgram(pr.p); if (cam) setCam(pr, cam); return pr.loc; };
  const bindTex = (unit, tex, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); };

  function pieceCorners(L, st) {
    const [x, y, w, h] = L.rect, cx = x + w / 2 + st.dx, cy = y + h / 2 + st.dy, c = Math.cos(st.phi), s = Math.sin(st.phi);
    const pt = (lx, ly) => [cx + lx, cy + ly * c, st.z - ly * s];
    return [pt(-w / 2, -h / 2), pt(w / 2, -h / 2), pt(-w / 2, h / 2), pt(w / 2, h / 2)];
  }
  function tileCorners(ts, cam) {
    const h = ts.size / 2, e = ts.face, c = ts.P;
    const down = [0, lerp3(1, -cam.u[1], e), lerp3(0, -cam.u[2], e)]; const n = Math.hypot(down[1], down[2]); down[1] /= n; down[2] /= n;
    const pt = (a, b) => [c[0] + a, c[1] + down[1] * b, c[2] + down[2] * b];
    return [pt(-h, -h), pt(h, -h), pt(-h, h), pt(h, h)];
  }
  const lerp3 = (a, b, t) => a + (b - a) * t;

  function drawShadow(rect, rad, z, phi, amtScale) {
    // offset (0.10z, 4 + 0.36z), blur 7 + 0.5z, 26%; foreshortened by the stand angle
    const [x, y, w, h] = rect, cy = y + h / 2, hh = h * Math.cos(phi);
    const blur = Math.min(140, 7 + 0.5 * z), ox = 0.10 * z, oy = 4 + 0.36 * z;
    const R = [x + ox, cy - hh / 2 + oy, w, hh], m = blur + 4;
    const l = use(P.pieceShadow, curCam);
    gl.uniform4f(l.uRect, ...R); gl.uniform1f(l.uRad, Math.min(rad, hh / 2, w / 2)); gl.uniform1f(l.uBlur, blur);
    gl.uniform1f(l.uAmt, 0.26 * amtScale); gl.uniform3fv(l.uShadow, SHADOW);
    quad(P.pieceShadow, [[R[0] - m, R[1] - m, 0], [R[0] + w + m, R[1] - m, 0], [R[0] - m, R[1] + hh + m, 0], [R[0] + w + m, R[1] + hh + m, 0]]);
  }

  let curCam = null;
  let pageOnly = false;
  function renderScene(t) {
    const cam = S.camera(t); curCam = cam;
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb); gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND); use(P.floor, cam); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const m = S.pageMask(t);
    // page shadow: soft and wide, on the floor
    let l = use(P.pageShadow, cam); const sh = [m.x, m.y + 18, m.w, m.shadowBottom], pad = 320;
    gl.uniform4f(l.uRect, ...sh); gl.uniform1f(l.uRad, m.radius); gl.uniform1f(l.uSigma, 64); gl.uniform1f(l.uAmt, 0.17); gl.uniform3fv(l.uShadow, SHADOW);
    quad(P.pageShadow, [[-pad, -pad, 0], [PAGE_W + pad, -pad, 0], [-pad, m.shadowBottom + pad, 0], [PAGE_W + pad, m.shadowBottom + pad, 0]]);
    // the page
    l = use(P.page, cam);
    gl.uniform4f(l.uMask, m.x, m.y, m.w, m.h); gl.uniform1f(l.uRad, m.radius); gl.uniform1f(l.uFade, m.fade); gl.uniform1f(l.uHeroBottom, S.HERO_BOTTOM);
    for (const c of chunks) { if (c.y0 > m.h) continue; bindTex(0, c.tex, l.uTex); quad(P.page, [[0, c.y0, 0], [PAGE_W, c.y0, 0], [0, c.y1, 0], [PAGE_W, c.y1, 0]]); }
    // pieces and tiles, lowest first, no depth buffer
    const items = [];
    if (!pageOnly) {
      for (const L of layers) { const st = S.pieceState(L, t); if (!st.cut) items.push({ z: st.z, L, st }); }
      for (let i = 0; i < 4; i++) { const ts = S.tileState(i, t); if (ts.visible) items.push({ z: ts.P[2], tile: ts }); }
    }
    items.sort((a, b) => a.z - b.z);
    for (const it of items) {
      if (it.tile) {
        const ts = it.tile, s = ts.size;
        if (ts.P[2] < 900) drawShadow([ts.P[0] - s / 2, ts.P[1] - s / 2, s, s], s * 0.235, ts.P[2], ts.face * 0.6, 1);
        l = use(P.piece, curCam); bindTex(0, tileTex, l.uTex); gl.uniform1f(l.uFade, 0); quad(P.piece, tileCorners(ts, curCam));
        continue;
      }
      const { L, st } = it;
      drawShadow([L.x + st.dx, L.y + st.dy, L.w, L.h], L.radius, st.z, st.phi, 1 - st.fade);
      if (st.edge > 0.5) {   // the testimonial's white edge, seen as it stands up
        const c = pieceCorners(L, st), pad = 28, rad = L.radius, n = [0, Math.sin(st.phi), Math.cos(st.phi)];
        const bl = c[2].slice(), br = c[3].slice();
        const inset = (a, b, k) => a.map((v, i) => v + (b[i] - a[i]) * k);
        const w = L.rect[2], k0 = (pad + rad) / w, k1 = 1 - k0;
        // bottom edge of the card face (not the padded quad): pad px up from the quad's bottom along the face
        const up = [0, -Math.cos(st.phi) * pad, Math.sin(st.phi) * pad];
        const e0 = inset(bl, br, k0).map((v, i) => v + up[i]), e1 = inset(bl, br, k1).map((v, i) => v + up[i]);
        const b0 = e0.map((v, i) => v - n[i] * st.edge), b1 = e1.map((v, i) => v - n[i] * st.edge);
        l = use(P.solid, curCam); gl.uniform3fv(l.uColor, toLin(hex('#ffffff'))); quad(P.solid, [e0, e1, b0, b1]);
      }
      l = use(P.piece, curCam); bindTex(0, L.tex, l.uTex); gl.uniform1f(l.uFade, st.fade); quad(P.piece, pieceCorners(L, st));
    }
    return cam;
  }

  function seek(t, { subframes = 16, shutter = 0.7, fps = 60, debug = 0, page = false } = {}) {
    pageOnly = page;
    gl.bindFramebuffer(gl.FRAMEBUFFER, acc.fb); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    for (let k = 0; k < subframes; k++) {
      const tk = subframes > 1 ? t + ((k + 0.5) / subframes - 0.5) * shutter / fps : t;
      renderScene(Math.max(0, Math.min(S.DURATION, tk)));
      gl.bindFramebuffer(gl.FRAMEBUFFER, acc.fb); gl.viewport(0, 0, W, H);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      const l = use(P.accum); bindTex(0, scene.tex[0], l.uC); bindTex(1, scene.tex[1], l.uD); gl.uniform1f(l.uW, 1 / subframes);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.disable(gl.BLEND);
    gl.bindTexture(gl.TEXTURE_2D, acc.tex[0]); gl.generateMipmap(gl.TEXTURE_2D);
    const focus = S.focusAt(t, layers);
    // tile max of near blur, dilated 8 tiles each way
    gl.bindFramebuffer(gl.FRAMEBUFFER, tA.fb); gl.viewport(0, 0, tw, th);
    let l = use(P.tilemax); bindTex(0, acc.tex[1], l.uD); gl.uniform2f(l.uRes, W, H); gl.uniform1f(l.uFocus, focus); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tB.fb); l = use(P.dilate); bindTex(0, tA.tex[0], l.uT); gl.uniform2f(l.uDir, 1, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tA.fb); l = use(P.dilate); bindTex(0, tB.tex[0], l.uT); gl.uniform2f(l.uDir, 0, 1); gl.drawArrays(gl.TRIANGLES, 0, 3);
    // near layer (half res, mipmapped)
    gl.bindFramebuffer(gl.FRAMEBUFFER, nearT.fb); gl.viewport(0, 0, W / 2, H / 2);
    l = use(P.near); bindTex(0, acc.tex[0], l.uC); bindTex(1, acc.tex[1], l.uD); bindTex(2, tA.tex[0], l.uTile); gl.uniform1f(l.uFocus, focus); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, nearT.tex[0]); gl.generateMipmap(gl.TEXTURE_2D);
    // overlay
    overlay.draw(t);
    gl.bindTexture(gl.TEXTURE_2D, overTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, overlay.canvas);
    // depth of field + overlay + encode
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    l = use(P.dof); bindTex(0, acc.tex[0], l.uC); bindTex(1, acc.tex[1], l.uD); bindTex(2, tA.tex[0], l.uTile); bindTex(3, overTex, l.uOver); bindTex(4, nearT.tex[0], l.uNear);
    gl.uniform2f(l.uRes, W, H); gl.uniform1f(l.uFocus, focus); gl.uniform1f(l.uFrame, Math.round(t * 60)); gl.uniform1i(l.uDebug, debug);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return { focus };
  }
  function readFrame() {   // RGBA, top row first
    const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const out = new Uint8Array(W * H * 4), row = W * 4;
    for (let y = 0; y < H; y++) out.set(px.subarray((H - 1 - y) * row, (H - y) * row), y * row);
    return out;
  }
  function readFrameB64() {
    const u8 = readFrame(); let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }
  return { seek, readFrame, readFrameB64, layers, gl };
}

// logo tile: the brand's colour mark on a white rounded tile
async function makeTile(src) {
  const img = await loadImg(src), N = 512, c = new OffscreenCanvas(N, N), x = c.getContext('2d');
  const r = N * 0.235;
  x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(0, 0, N, N, r); x.fill();
  x.strokeStyle = 'rgba(26,33,51,0.07)'; x.lineWidth = 3; x.beginPath(); x.roundRect(1.5, 1.5, N - 3, N - 3, r - 1.5); x.stroke();
  const s = N * 0.56, ar = img.naturalWidth / img.naturalHeight;
  x.drawImage(img, (N - s * ar) / 2, (N - s) / 2 + N * 0.01, s * ar, s);
  return c.transferToImageBitmap();
}

// ------------------------------------------------------------------ title card overlay (Canvas 2D, drawn from t)
class Overlay {
  constructor(assets) {
    this.canvas = new OffscreenCanvas(W, H); this.ctx = this.canvas.getContext('2d');
    this.ready = (async () => {
      const geist = new FontFace('Geist', `url(${assets}/fonts/Geist-variable.woff2)`, { weight: '100 900' });
      const serif = new FontFace('Instrument Serif', `url(${assets}/fonts/InstrumentSerif-400-italic.woff2)`, { style: 'italic', weight: '400' });
      await Promise.all([geist.load(), serif.load()]); document.fonts.add(geist); document.fonts.add(serif);
      this.lockup = await loadImg(`${assets}/lockup-black-DoV_IwHG.png`);
      this.layout();
    })();
  }
  layout() {
    const x = this.ctx, T = S.TITLE;
    const lines = [
      { ...T.line1, font: `500 ${T.line1.size}px Geist`, spacing: -0.034 * T.line1.size, color: '#16161a' },
      { ...T.line2, font: `italic 400 ${T.line2.size}px "Instrument Serif"`, spacing: -0.005 * T.line2.size },
    ];
    for (const L of lines) {
      x.font = L.font; x.letterSpacing = `${L.spacing}px`;
      const words = L.text.split(' '), space = x.measureText(' ').width;
      const widths = words.map(w => x.measureText(w).width);
      const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
      let cx = W / 2 - total / 2;
      L.words = words.map((w, i) => { const o = { w, x: cx, at: L.at + i * L.step }; cx += widths[i] + space; return o; });
    }
    this.lines = lines;
  }
  draw(t) {
    const x = this.ctx, T = S.TITLE; x.clearRect(0, 0, W, H);
    if (t < T.badgeIn) return;
    // badge pill: logo + brand, 21px, fades in
    const a = S.s5(T.badgeIn, T.badgeIn + 0.32, t);
    const lh = 21, lw = lh * this.lockup.naturalWidth / this.lockup.naturalHeight, ph = 44, pw = lw + 34;
    const bx = W / 2 - pw / 2, by = T.badgeY;
    x.save(); x.globalAlpha = a;
    x.shadowColor = 'rgba(26,33,51,0.10)'; x.shadowBlur = 22; x.shadowOffsetY = 6;
    x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(bx, by, pw, ph, ph / 2); x.fill();
    x.shadowColor = 'transparent';
    x.strokeStyle = 'rgba(26,33,51,0.06)'; x.lineWidth = 1; x.beginPath(); x.roundRect(bx + 0.5, by + 0.5, pw - 1, ph - 1, ph / 2); x.stroke();
    x.drawImage(this.lockup, W / 2 - lw / 2, by + (ph - lh) / 2, lw, lh);
    x.restore();
    // words rise 16px out of a 12px blur
    for (const L of this.lines) {
      x.font = L.font; x.letterSpacing = `${L.spacing}px`; x.fillStyle = L.color; x.textBaseline = 'alphabetic';
      for (const w of L.words) {
        if (t < w.at) continue;
        const e = S.outExpo(w.at, w.at + T.dur, t);
        x.save(); x.globalAlpha = Math.min(1, e * 1.25);
        const b = T.blur * (1 - e); x.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
        x.fillText(w.w, w.x, L.baseline + T.rise * (1 - e));
        x.restore();
      }
    }
  }
}
