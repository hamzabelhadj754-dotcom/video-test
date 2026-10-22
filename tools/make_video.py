import math, os, sys, wave, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from multiprocessing import Pool

W, H, S, FPS, DUR = 720, 1280, 2, 30, 16.5
N = int(DUR * FPS)
OUT = os.environ.get("OUT_DIR", "/tmp/frames")
CAM = [0, 0]
INK = (20, 15, 28)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

X = lambda v: (v + CAM[0]) * S
Y = lambda v: (v + CAM[1]) * S

def ell(d, cx, cy, rx, ry, fill, ow=0):
    d.ellipse([X(cx-rx), Y(cy-ry), X(cx+rx), Y(cy+ry)], fill=fill,
              outline=INK if ow else None, width=int(ow*S))
def rect(d, x0, y0, x1, y1, fill, r=0, ow=0):
    f = d.rounded_rectangle if r else d.rectangle
    kw = dict(radius=r*S) if r else {}
    f([X(x0), Y(y0), X(x1), Y(y1)], fill=fill, outline=INK if ow else None, width=int(ow*S), **kw)
def poly(d, pts, fill, ow=0):
    d.polygon([(X(x), Y(y)) for x, y in pts], fill=fill, outline=INK if ow else None)
def line(d, x0, y0, x1, y1, w, fill):
    d.line([X(x0), Y(y0), X(x1), Y(y1)], fill=fill, width=int(w*S))
    ell(d, x0, y0, w/2, w/2, fill); ell(d, x1, y1, w/2, w/2, fill)

clamp = lambda v, a=0, b=1: max(a, min(b, v))
smooth = lambda v: (lambda u: u*u*(3-2*u))(clamp(v))

def heart(d, x, y, s, col):
    ell(d, x-s*.5, y, s*.55, s*.55, col); ell(d, x+s*.5, y, s*.55, s*.55, col)
    poly(d, [(x-s*1.03, y+s*.25), (x+s*1.03, y+s*.25), (x, y+s*1.4)], col)

def person(d, cx, fy, sc, phase, armL, armR, lookx, eye, mouth, shake, kind, sil=0,
           cross=False, brow=0, sweat=False, cream=False):
    mix = lambda c: tuple(int(c[i]*(1-sil)+(12, 12, 28)[i]*sil) for i in range(3))
    if kind == "boy":
        skin, shirt, pants, hr = (210, 165, 115), (70, 110, 190), (55, 60, 110), 80
    else:
        skin, shirt, pants, hr = (195, 145, 105), (160, 60, 65), (50, 55, 72), 86
    skin, shirt, pants = mix(skin), mix(shirt), mix(pants)
    cx += shake
    hipx, hipy = cx, fy-110*sc
    for side in (-1, 1):
        a = math.sin(phase + (0 if side < 0 else math.pi))*.5
        fx, fyy = hipx+side*28*sc+math.sin(a)*100*sc, hipy+math.cos(a)*110*sc
        line(d, hipx+side*26*sc, hipy, fx, fyy, 34*sc, pants)
        ell(d, fx+side*0+10*sc, fyy+4*sc, 30*sc, 14*sc, mix((30, 30, 40)))
    rect(d, cx-52*sc, fy-255*sc, cx+52*sc, fy-95*sc, shirt, r=26*sc, ow=3)
    if kind == "boy":
        for k in range(3): line(d, cx-44*sc, fy-215*sc+k*40*sc, cx+44*sc, fy-215*sc+k*40*sc, 6*sc, mix((235, 235, 245)))
    sh = fy-235*sc
    hands = []
    if cross:
        line(d, cx-52*sc, sh, cx+42*sc, fy-170*sc, 28*sc, shirt)
        line(d, cx+52*sc, sh, cx-42*sc, fy-175*sc, 28*sc, shirt)
        ell(d, cx+44*sc, fy-168*sc, 15*sc, 15*sc, skin); ell(d, cx-44*sc, fy-173*sc, 15*sc, 15*sc, skin)
        hands = [(cx-44*sc, fy-173*sc), (cx+44*sc, fy-168*sc)]
    else:
        for side, ang in ((-1, armL), (1, armR)):
            r = math.radians(ang)
            sx = cx+side*52*sc
            hx, hy = sx+math.sin(r)*105*sc, sh+math.cos(r)*105*sc
            line(d, sx, sh, hx, hy, 26*sc, shirt)
            ell(d, hx, hy, 16*sc, 16*sc, skin)
            hands.append((hx, hy))
    cy = fy-330*sc
    ell(d, cx-hr*sc, cy+8*sc, 14*sc, 20*sc, skin, 3); ell(d, cx+hr*sc, cy+8*sc, 14*sc, 20*sc, skin, 3)
    ell(d, cx, cy, hr*sc, hr*sc, skin, 4)
    if kind == "boy":
        d.pieslice([X(cx-86*sc), Y(cy-86*sc), X(cx+86*sc), Y(cy+86*sc)], 188, 352, fill=mix((230, 230, 240)), outline=INK, width=3*S)
        ell(d, cx+32*sc, cy-14*sc, 62*sc, 13*sc, mix((230, 230, 240)), 3)
    for side in (-1, 1):
        ex = cx+side*30*sc
        ell(d, ex, cy+6*sc, 21*sc*eye, 24*sc*eye, (250, 250, 250), 3)
        ell(d, ex+lookx*9*sc, cy+8*sc, 9*sc*eye**.5, 11*sc*eye**.5, INK)
        if brow:
            by = cy-30*sc*eye**.4 - (10*sc if brow > 0 else 0)
            tilt = -brow*14*sc*side*-1 if brow < 0 else 0
            line(d, ex-20*sc, by+(tilt if side < 0 else -tilt)*-1*0, ex+20*sc, by, 7*sc, INK) if brow > 0 else \
                line(d, ex-20*sc*side*-1 if False else ex-20*sc, by+(-12*sc if side > 0 else 12*sc)*-1, ex+20*sc, by+(12*sc if side > 0 else -12*sc)*-1, 8*sc, INK)
    if kind == "dad":
        ell(d, cx-22*sc, cy+38*sc, 26*sc, 12*sc, mix((35, 25, 25))); ell(d, cx+22*sc, cy+38*sc, 26*sc, 12*sc, mix((35, 25, 25)))
    kindm, amt = mouth
    my = cy+(58 if kind == "dad" else 48)*sc
    if kindm == "flat": line(d, cx-20*sc, my, cx+20*sc, my, 6*sc, INK)
    elif kindm == "smile":
        d.arc([X(cx-26*sc), Y(my-22*sc), X(cx+26*sc), Y(my+14*sc)], 20, 160, fill=INK, width=int(6*S*sc))
    else:
        ell(d, cx, my, 14*sc+10*sc*amt, 6*sc+20*sc*amt, (60, 15, 25), 3)
    if cream:
        for ox, oy, r in ((-22, 0, 9), (20, 4, 8), (-6, 16, 7), (0, -4, 6)):
            ell(d, cx+ox*sc, my+oy*sc, r*sc, r*sc, (255, 250, 245))
    if sweat:
        ex = cx+hr*sc*.8
        poly(d, [(ex, cy-70*sc), (ex-12*sc, cy-40*sc), (ex+12*sc, cy-40*sc)], (110, 190, 255))
        ell(d, ex, cy-38*sc, 12*sc, 12*sc, (110, 190, 255))
    return hands

def cake(d, x, y, s):
    ell(d, x, y+32*s, 78*s, 14*s, (225, 225, 235), 3)
    rect(d, x-60*s, y-28*s, x+60*s, y+30*s, (200, 110, 140), r=10*s, ow=3)
    rect(d, x-64*s, y-52*s, x+64*s, y-22*s, (255, 245, 240), r=14*s, ow=3)
    for k in range(-2, 3): ell(d, x+k*26*s, y-20*s, 11*s, 14*s, (255, 245, 240))
    ell(d, x, y-66*s, 14*s, 14*s, (210, 30, 50), 3)

def scene(t):
    img = Image.new("RGBA", (W*S, H*S), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)
    rect(d, -20, -20, W+20, 935, (38, 48, 88))
    for k in range(0, 935, 26): rect(d, -20, k, W+20, k+13, (40, 51, 92))
    rect(d, -20, 925, W+20, 945, (28, 30, 55))
    rect(d, -20, 945, W+20, H+20, (34, 30, 52))
    for k, yy in enumerate((985, 1065, 1165)): rect(d, -20, yy, W+20, yy+4, (26, 24, 42))
    for xx in range(-400, 1200, 110): line(d, 360+(xx-360)*.35, 945, xx, H+20, 4, (26, 24, 42))
    rect(d, 40, 200, 300, 500, (14, 20, 60), ow=6)
    for sx, sy in ((90, 260), (150, 320), (260, 400), (70, 430), (200, 240)): ell(d, sx, sy, 3, 3, (240, 240, 255))
    ell(d, 230, 275, 38, 38, (250, 240, 190)); ell(d, 244, 266, 34, 34, (14, 20, 60))
    line(d, 170, 200, 170, 500, 6, INK); line(d, 40, 350, 300, 350, 6, INK)
    ell(d, 350, 290, 38, 38, (230, 230, 225), 4)
    line(d, 350, 290, 350, 262, 4, INK); line(d, 350, 290, 372, 290, 4, INK)
    rect(d, 0, 785, 380, 935, (70, 50, 46), ow=4); rect(d, -10, 765, 390, 792, (105, 78, 66), ow=4)
    ell(d, 70, 758, 40, 10, (200, 200, 215)); rect(d, 250, 715, 285, 765, (120, 160, 190), ow=3)
    # fridge
    op = smooth((t-4.5)/2.0) if t < 13.0 else 1
    op = op if t < 15.8 else 1
    rect(d, 400, 250, 640, 930, (150, 165, 185), r=14, ow=5)
    if op > .02:
        rect(d, 412, 262, 628, 918, (250, 244, 205), r=8)
        for sy in (420, 610, 800): rect(d, 412, sy, 628, sy+10, (200, 205, 195))
        rect(d, 430, 340, 460, 420, (240, 240, 250), ow=3); rect(d, 560, 515, 590, 610, (90, 180, 90), ow=3)
        ell(d, 600, 580, 14, 14, (230, 120, 40)); rect(d, 470, 540, 520, 610, (230, 200, 90), ow=3)
        rect(d, 540, 700, 600, 800, (120, 80, 160), ow=3); rect(d, 430, 700, 470, 800, (200, 60, 60), ow=3)
        s_ = math.sin(op*1.25)
        poly(d, [(640, 250), (640, 930), (640+80*s_, 965), (640+80*s_, 215)], (175, 190, 210), 4)
    else:
        rect(d, 612, 400, 626, 520, (90, 100, 115), r=6)
        rect(d, 430, 300, 520, 380, (250, 230, 120), ow=3)
    # cake
    cs = .75
    if t > 7.5: cs -= .2*clamp((t-7.5)/1.2)
    if t > 12.2: cs -= .3*clamp((t-12.2)/2.8)
    bx = 330
    if t < 3.5: bx = -100+430*(t/3.5)
    if t < 6.5: cpos = (468, 770)
    elif t < 7.2:
        u = smooth((t-6.5)/.7); cpos = (468+(bx-468)*u, 770+(860-770)*u)
    else: cpos = (bx, 860)
    if t < 6.5 and op > .02: cake(d, cpos[0], cpos[1], cs)
    # light
    if op > .02:
        fl = 1 if t < 8.6 else (.75+.25*math.sin(t*40))
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
        a = int(95*op*fl)
        poly(ld, [(405, 262), (405, 925), (-250, 1290), (-250, 640)], (255, 245, 190, a))
        poly(ld, [(405, 262), (405, 925), (150, 1290), (150, 900)], (255, 245, 190, int(a*.5)))
        ell(ld, 430, 1000, 260, 70, (255, 245, 190, int(a*.8)))
        img = Image.alpha_composite(img, lay); d = ImageDraw.Draw(img)
    # boy
    fy = 1050
    phase = 0; lookx = .8; eye = 1; mouth = ("flat", 0); armL, armR = -15, 15; brow = 0; sweat = False; shake = 0
    if t < 3.5:
        phase = t*8; lookx = math.sin(t*3)
        armL, armR = -50+10*math.sin(phase), 50-10*math.sin(phase); fy -= abs(math.sin(phase))*9
    elif t < 4.5: eye = 1.1
    if 4.5 <= t < 8.5: eye = 1.4; mouth = ("o", .3+.3*math.sin(t*5)) if t < 6.6 else mouth
    if 5.7 <= t < 6.6: armR = 100
    if t >= 6.6:
        armL, armR = 30, -30
    if 7.4 <= t < 8.6 or 12.2 <= t < 15.2: mouth = ("o", .5+.5*math.sin(t*14)); eye = 1.1
    if t >= 8.7:
        mouth = ("o", .15)
        eye = 1.6; brow = 1; sweat = True; shake = math.sin(t*60)*3 if t < 11.4 else 0
    if t >= 12.2:
        eye = 1.1; brow = 0; sweat = False
    if t >= 15.2: mouth = ("smile", 0)
    person(d, bx, fy, 1.0, phase, armL, armR, lookx if t < 6 else .6, eye, mouth, shake, "boy",
           brow=brow, sweat=sweat, cream=t > 8.2)
    if t >= 6.5: cake(d, cpos[0], cpos[1], cs)
    # dad
    if t >= 8.5:
        if t < 10.5: dx = -170+230*smooth((t-8.5)/2.0); ph = t*5; sil = 1
        elif t < 11.2: dx = 60; ph = 0; sil = 1-smooth((t-10.5)/.7)
        elif t < 12.2: dx = 60+90*smooth((t-11.2)); ph = t*6; sil = 0
        else: dx = 150; ph = 0; sil = 0
        crossed = t < 12.0
        dm = ("flat", 0); dbrow = -1 if t < 12.2 else 0
        if t >= 12.2: dm = ("o", .5+.5*math.sin(t*12+1)) if t < 15.2 else ("smile", 0)
        hands = person(d, dx, 1085, 1.3, ph, -15, 80, .7, 1.1, dm, 0, "dad", sil=sil, cross=crossed, brow=dbrow,
                       cream=t > 13)
        if t >= 12.2:
            hx, hy = hands[1]
            line(d, hx, hy, hx+38, hy+6, 5, (230, 230, 240))
    if t > 13:
        for k in range(7):
            u = ((t-13)*.22+k*.14) % 1
            heart(d, 90+k*90+math.sin(u*9+k)*18, 560-u*430, 12+k%3*4, (255, 90, 130))
    img = img.convert("RGB").resize((W, H), Image.LANCZOS)
    return img

CAPS = [(0, 4.5, "Me at 2am, sneaking to the fridge"), (4.5, 7.0, "Found the cake"),
        (7.0, 8.6, "Nobody will ever know..."), (8.6, 11.0, "...Dad woke up"),
        (11.0, 12.2, "Dad: Move over."), (12.2, 15.0, "Midnight snack club"),
        (15.0, 16.6, "Best secret ever")]

def caption(img, t):
    txt = next((c for a, b, c in CAPS if a <= t < b), None)
    if not txt: return img
    d = ImageDraw.Draw(img); f = ImageFont.truetype(FONT, 46)
    words, lines, cur = txt.split(), [], ""
    for w in words:
        if d.textlength((cur+" "+w).strip(), font=f) > W-80: lines.append(cur); cur = w
        else: cur = (cur+" "+w).strip()
    lines.append(cur)
    y = 70
    for l in lines:
        x = (W-d.textlength(l, font=f))/2
        d.text((x, y), l, font=f, fill="white", stroke_width=6, stroke_fill=(15, 15, 30)); y += 62
    return img

def render(i):
    t = i/FPS
    CAM[0] = CAM[1] = 0
    if 8.7 <= t < 11: CAM[0], CAM[1] = math.sin(t*70)*3, math.cos(t*53)*3
    img = caption(scene(t), t)
    f = min(1, t/.25, (DUR-t)/.4)
    if f < 1: img = Image.eval(img, lambda v: int(v*max(f, 0)))
    img.save(f"{OUT}/f{i:04d}.jpg", quality=92)

def audio(path):
    sr = 44100; n = int(DUR*sr); tt = np.arange(n)/sr; a = np.zeros(n); rng = np.random.default_rng(1)
    def add(t0, sig, g=1.0):
        i = int(t0*sr); sig = sig[:max(0, n-i)]; a[i:i+len(sig)] += sig*g
    def noise(dur, decay): m = np.arange(int(dur*sr))/sr; return rng.standard_normal(len(m))*np.exp(-m*decay)
    def tone(f, dur, decay, wave="sin"):
        m = np.arange(int(dur*sr))/sr; ph = 2*np.pi*f*m
        s = np.sin(ph) if wave == "sin" else 2*np.abs(2*((f*m) % 1)-1)-1
        return s*np.exp(-m*decay)
    a += (np.sin(2*np.pi*4300*tt)*(np.sin(2*np.pi*13*tt) > .55))*.025*np.minimum(1, tt)
    a += (np.sin(2*np.pi*3900*tt)*(np.sin(2*np.pi*11*tt+1) > .6))*.02
    for k in range(7): add(.3+k*.5, np.convolve(noise(.08, 60), np.ones(30)/30, 'same'), .5)
    m = np.arange(int(2*sr))/sr
    creak = np.sin(2*np.pi*np.cumsum(150+90*np.sin(2*np.pi*3.2*m)+60*m)/sr)*(np.sin(2*np.pi*23*m) > -.3)
    add(4.5, creak*.18*np.minimum(1, m*6)*np.minimum(1, (2-m)*3))
    seg = (tt >= 5) & (tt < 10.5); a += np.sin(2*np.pi*55*tt)*.03*seg
    for k in range(7): add(7.4+k*.17, np.convolve(noise(.12, 30), np.ones(12)/12, 'same'), .5)
    add(8.6, tone(110, 2.5, 1.3)+tone(116.5, 2.5, 1.3)+tone(220, 2.5, 2), .3)
    for k in range(5): add(8.7+k*.5, tone(55, .3, 12), .8)
    for k in range(3): add(8.9+k*.6, np.convolve(noise(.15, 25), np.ones(60)/60, 'same'), 1.2)
    for k in range(5): add(11.3+k*.25, np.convolve(noise(.1, 30), np.ones(40)/40, 'same'), 1.4)
    add(10.6, tone(880, .6, 5), .12)
    for j, f in enumerate((523, 659, 784, 1047)): add(12.2+j*.12, tone(f, .6, 5), .2)
    for k in range(10): add(12.8+k*.2, np.convolve(noise(.12, 30), np.ones(12)/12, 'same'), .45)
    for j, f in enumerate((523, 659, 784, 659, 523, 784, 1047)): add(15+j*.14, tone(f, .5, 6), .2)
    a *= np.minimum(1, (DUR-tt)/.5)
    a = a/np.abs(a).max()*.8
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a*32767).astype(np.int16).tobytes())

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        for i in map(int, sys.argv[2:]): render(i)
        sys.exit()
    with Pool() as p: p.map(render, range(N), chunksize=8)
    audio(f"{OUT}/a.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", f"{OUT}/f%04d.jpg", "-i", f"{OUT}/a.wav",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", "-shortest", sys.argv[1] if len(sys.argv) > 1 else "out.mp4"], check=True)
