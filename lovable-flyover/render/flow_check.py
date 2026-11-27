# flow_check.py: measure the rendered glide from tracked features (Shi-Tomasi corners + pyramidal Lucas-Kanade).
# Each tracked corner is mapped through the camera at time t onto the page plane: the median page-space step per frame
# is the measured glide speed (page px/s); a least-squares fit vx = a (x - 720) + b gives the zoom: a < 0 = zoom out.
import sys, csv, numpy as np, cv2
video, cams = sys.argv[1], sys.argv[2]
F, W, H = 1880.0, 1440, 1152
import json
RECTS = np.array([[l['x'] - 40, l['y'] - 60, l['x'] + l['w'] + 40, l['y'] + l['h'] + 40] for l in json.load(open('capture/out/layers.json'))['layers']])
cam, tiles = {}, {}
for r in csv.reader(open(cams)):
    cam[int(r[0])] = np.array(list(map(float, r[1:10])))
    tiles[int(r[0])] = [list(map(float, b.split())) for b in r[10].split(';') if b.strip()] if len(r) > 10 else []
def to_page(n, pts):
    c = cam[n]; pos, u, f = c[0:3], c[3:6], c[6:9]
    d = f[None, :] + np.outer((pts[:, 0] - W / 2) / F, [1, 0, 0]) + np.outer((H / 2 - pts[:, 1]) / F, u)
    t = -pos[2] / d[:, 2]
    return pos[None, :] + t[:, None] * d
cap = cv2.VideoCapture(video); fps = cap.get(cv2.CAP_PROP_FPS)
prev = None; n = 0; res = []
while True:
    ok, fr = cap.read()
    if not ok: break
    g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
    if prev is not None:
        p0 = cv2.goodFeaturesToTrack(prev, 600, 0.01, 12)
        sp, zoom, nf = np.nan, np.nan, 0
        if p0 is not None:
            p1, st, err = cv2.calcOpticalFlowPyrLK(prev, g, p0, None, winSize=(31, 31), maxLevel=4)
            pb, st2, _ = cv2.calcOpticalFlowPyrLK(g, prev, p1, None, winSize=(31, 31), maxLevel=4)   # forward-backward check
            fb = np.linalg.norm(pb[:, 0] - p0[:, 0], axis=1)
            m = (st[:, 0] == 1) & (st2[:, 0] == 1) & (fb < 0.5)
            for x0, y0, x1, y1 in tiles.get(n - 1, []):        # the logo tiles are not on the page plane
                m &= ~((p0[:, 0, 0] > x0) & (p0[:, 0, 0] < x1) & (p0[:, 0, 1] > y0) & (p0[:, 0, 1] < y1))
            a, b = p0[m, 0], p1[m, 0]; nf = len(a)
            if nf > 20:
                v = b - a
                A = np.c_[a[:, 0] - W / 2, np.ones(nf)]; keep = np.ones(nf, bool)
                for _ in range(5):   # robust: drop features off the page plane (tiles, lifted pieces) by residual
                    coef, *_ = np.linalg.lstsq(A[keep], v[keep, 0], rcond=None)
                    r = np.abs(A @ coef - v[:, 0]); mad = np.median(r[keep]) + 1e-3; keep = r < 3 * mad
                zoom = coef[0]
                if cam[n - 1][8 - 1 + 0] is not None:
                    P0 = to_page(n - 1, a); P1 = to_page(n - 1, b)     # same camera: page-space step of each feature
                    inside = ((P0[:, None, 0] > RECTS[None, :, 0]) & (P0[:, None, 0] < RECTS[None, :, 2]) & (P0[:, None, 1] > RECTS[None, :, 1]) & (P0[:, None, 1] < RECTS[None, :, 3])).any(1)
                    ok_ = np.isfinite(P0[:, 1]) & ~inside          # flat page only: lifted pieces and their margins excluded
                    sp = -np.median((P1[ok_, 1] - P0[ok_, 1])) * fps if ok_.sum() >= 60 else np.nan   # need 60 flat-page features
                    nf = int(ok_.sum())
        res.append((n / fps, sp, zoom, nf))
    prev = g; n += 1
R = np.array(res)
import scipy.ndimage as nd
v = R[:, 1].copy(); good = np.isfinite(v); v[~good] = np.interp(np.flatnonzero(~good), np.flatnonzero(good), v[good]); R[:, 1] = nd.median_filter(v, 3)   # 3-frame median; gaps interpolated
def rng(a, b): return R[(R[:, 0] >= a) & (R[:, 0] <= b)]
print(f"frames {n} @ {fps:.0f}fps")
cr = rng(1.75, 7.25)
print(f"cruise 1.75-7.25s: page speed median {np.median(cr[:,1]):.0f} px/s (model 617), min {cr[:,1].min():.0f}, max {cr[:,1].max():.0f}, min/median {cr[:,1].min()/np.median(cr[:,1]):.3f}")
ei = rng(0.04, 1.62); dips = [f"{t:.2f}s" for (t, s, *_), (t2, s2, *_) in zip(ei[:-1], ei[1:]) if s > 40 and s2 < s * 0.92]
low = cr[cr[:,1] < 0.94*np.median(cr[:,1])]
print("cruise frames under 0.94x:", [f"{t:.2f}s {sp:.0f}px/s ({int(k)} feats)" for t, sp, z, k in low] or "none")
print("ease-in (0-1.6s) frame-to-frame drops >8%:", dips or "none")
fl = rng(0.04, 9.2)
zin = fl[fl[:, 2] > 2e-4]
print(f"zoom during flight and rise: max {np.nanmax(fl[:,2]):+.5f}/frame -> " + ("ZOOM-IN at " + ", ".join(f"{t:.2f}s" for t in zin[:, 0]) if len(zin) else "never zooms in"))
import os
for t, s, z, k in (R[(R[:,0]>1.3)&(R[:,0]<2.3)] if os.environ.get('ZOOMIN') else R[::10]): print(f"  t={t:5.2f}  page speed {s:7.1f}px/s  zoom {z:+.5f}/frame  features {int(k)}")
