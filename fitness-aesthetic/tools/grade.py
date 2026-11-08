"""Editorial duotone grade for the Unsplash photos: luminance -> S-curve -> gradient from --bg (#0A0A0D) to --ink (#F3F1EC).
Optional ember split-tone on the highlights. usage: python3 tools/grade.py   (reads assets/photos/src, writes assets/photos)"""
import os
import numpy as np
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, "assets/photos/src"), os.path.join(ROOT, "assets/photos")
BG, INK, EMBER = np.array([10, 10, 13.]), np.array([243, 241, 236.]), np.array([255, 106, 61.])
# name: (long side, exposure, contrast, ember amount)
JOBS = {"hero": (1800, 0.95, 1.25, 0.0), "torso": (1800, 0.8, 1.3, 0.0), "bedroom": (1600, 1.25, 1.1, 0.55),
        "dumbbell": (1200, 1.0, 1.2, 0.0), "eggs": (1200, 0.95, 1.15, 0.25), "bed": (1200, 0.9, 1.15, 0.0), "rest": (1800, 0.95, 1.2, 0.0)}
for name, (side, expo, con, ember) in JOBS.items():
    im = Image.open(os.path.join(SRC, name + ".jpg")).convert("RGB"); im.thumbnail((side, side), Image.LANCZOS)
    a = np.asarray(im, dtype=np.float64) / 255
    y = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]) * expo
    y = np.clip(y, 0, 1); y = 0.5 + (y - 0.5) * con; y = np.clip(y, 0, 1)
    y = y * y * (3 - 2 * y) * 0.6 + y * 0.4                 # soft S-curve
    out = BG + (INK - BG) * y[..., None]
    if ember: w = np.clip((y - 0.45) / 0.55, 0, 1)[..., None] ** 1.4 * ember; out = out * (1 - w) + (BG + (EMBER - BG) * y[..., None]) * w
    rng = np.random.default_rng(3); out += rng.normal(0, 3.0, out.shape[:2])[..., None]   # fine film grain baked in
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name + ".jpg"), quality=90)
    print(name, im.size)
