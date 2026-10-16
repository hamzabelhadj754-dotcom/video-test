"""Cut the flat doctor illustration into animatable layers.

Outputs (2x upscaled, transparent PNGs, all share the same 2048x2048 canvas so
they stack with identical positioning):
  doctor-body.png   torso, legs, neck, stethoscope (arms + head removed)
  doctor-head.png   head + hair, with eyes and mouth painted out
  doctor-arm-l.png  viewer-left arm (sleeve + hand)
  doctor-arm-r.png  viewer-right arm
  doctor-eye-l.png  / doctor-eye-r.png  eye crops (for blinking)
  doctor-full.png   the whole figure, background removed
Coordinates below are in source (1024px) space.
"""
import sys
import cv2
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]
SCALE = 2
SKIN = (121, 177, 236)  # BGR, sampled from the forehead

im = cv2.imread(SRC)
h, w = im.shape[:2]

# --- background: flood fill the cream from the borders --------------------
ff = np.zeros((h + 2, w + 2), np.uint8)
flags = 4 | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8)
for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (500, 1020), (5, 500), (1018, 500), (512, 5)]:
    cv2.floodFill(im.copy(), ff, seed, 0, (14, 14, 14), (14, 14, 14), flags)
bg = ff[1:-1, 1:-1] > 0
# Small enclosed cream pockets (between legs, under arms) that the corners miss.
for seed in [(500, 900), (432, 470), (575, 450), (500, 700)]:
    x, y = seed
    if not bg[y, x] and np.abs(im[y, x].astype(int) - [235, 250, 253]).max() < 14:
        cv2.floodFill(im.copy(), ff, seed, 0, (14, 14, 14), (14, 14, 14), flags)
bg = ff[1:-1, 1:-1] > 0
fig = (~bg).astype(np.uint8)
# Clean speckles and soften the edge.
fig = cv2.morphologyEx(fig, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
n, lab, stats, _ = cv2.connectedComponentsWithStats(fig, 8)
keep = np.zeros_like(fig)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] > 400:
        keep[lab == i] = 1
fig = cv2.erode(keep, np.ones((2, 2), np.uint8))


def cut_line(mask, p0, p1, thick=3):
    m = mask.copy()
    cv2.line(m, p0, p1, 0, thick)
    return m


def component_at(mask, pt):
    n, lab = cv2.connectedComponents(mask, connectivity=4)
    return (lab == lab[pt[1], pt[0]]).astype(np.uint8)


# --- arms: sever along armpit -> shoulder, take the part holding the hand ---
cut = cut_line(fig, (434, 449), (452, 318))
cut = cut_line(cut, (559, 405), (546, 318))
# keep the head separate from the cut search
cut[:300, :] = 0
arm_l = component_at(cut, (340, 580))
arm_r = component_at(cut, (670, 585))
# grow back over the cut seam so arms overlap the body slightly
seam = cv2.dilate(arm_l, np.ones((5, 5), np.uint8)) & fig
seam[:, 452:] = 0
arm_l = np.maximum(arm_l, seam)
seam = cv2.dilate(arm_r, np.ones((5, 5), np.uint8)) & fig
seam[:, :546] = 0
arm_r = np.maximum(arm_r, seam)

# --- head: everything above the chin, plus the hanging curls --------------
yy, xx = np.mgrid[0:h, 0:w]
head = fig.copy()
head[(yy > 296)] = 0
curls = fig.copy()
curls[(yy > 334) | (yy <= 296) | ((xx >= 446) & (xx <= 562))] = 0
head = np.maximum(head, curls)
head &= (1 - arm_l) & (1 - arm_r)

body = fig & (1 - arm_l) & (1 - arm_r) & (1 - head)
# keep the neck top under the chin so a head tilt never shows a gap
neck = np.zeros_like(fig)
cv2.rectangle(neck, (494, 280), (510, 300), 1, -1)
body = np.maximum(body, neck & fig)

# --- painted-out face for the head layer ---------------------------------
face = im.copy()
noise = np.random.default_rng(7)
def skin_fill(mask):
    jitter = noise.integers(-1, 2, size=(h, w, 1))
    fill = np.clip(np.array(SKIN)[None, None, :] + jitter, 0, 255).astype(np.uint8)
    face[mask > 0] = fill[mask > 0]

m = np.zeros((h, w), np.uint8)
cv2.ellipse(m, (461, 204), (15, 24), 0, 0, 360, 1, -1)
cv2.ellipse(m, (532, 205), (15, 24), 0, 0, 360, 1, -1)
cv2.ellipse(m, (496, 250), (34, 15), 0, 0, 360, 1, -1)
skin_fill(m)


def write_layer(img, mask, name, crop=None):
    alpha = np.clip(mask * 255, 0, 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha
    if crop:
        x0, y0, x1, y1 = crop
        rgba = rgba[y0:y1, x0:x1]
    rgba = cv2.resize(rgba, (rgba.shape[1] * SCALE, rgba.shape[0] * SCALE), interpolation=cv2.INTER_LANCZOS4)
    cv2.imwrite(f"{OUT}/{name}", rgba)


write_layer(im, fig, "doctor-full.png")
write_layer(im, body, "doctor-body.png")
write_layer(face, head, "doctor-head.png")
write_layer(im, arm_l, "doctor-arm-l.png")
write_layer(im, arm_r, "doctor-arm-r.png")
# eye crops: opaque rectangles of the original eye on its skin
for name, c in (("doctor-eye-l.png", (461, 204)), ("doctor-eye-r.png", (532, 205))):
    em = np.zeros((h, w), np.uint8)
    cv2.ellipse(em, c, (13, 22), 0, 0, 360, 1, -1)
    em = cv2.GaussianBlur(em.astype(np.float32), (5, 5), 0)
    x, y = c
    write_layer(im, em, name, (x - 16, y - 26, x + 16, y + 26))
print("ok")
