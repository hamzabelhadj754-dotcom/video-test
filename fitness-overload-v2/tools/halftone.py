"""Halftone version of the black-and-white athlete cutout (white dots on transparent), ref-A style.
usage: python3 tools/halftone.py"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = Image.open(os.path.join(R, "assets/photos/flex_bw.png")).convert("RGBA")
W, H = im.size; S = 2  # supersample
g = np.asarray(im.convert("L"), dtype=float) / 255; a = np.asarray(im.split()[3], dtype=float) / 255
cell = 9
out = Image.new("L", (W * S, H * S), 0); d = ImageDraw.Draw(out)
for y in range(0, H, cell):
    for x in range(0, W, cell):
        blk = g[y:y + cell, x:x + cell]; ab = a[y:y + cell, x:x + cell]
        if ab.mean() < 0.15: continue
        v = (blk * ab).sum() / max(ab.sum(), 1e-6)
        r = (cell / 2 + 0.6) * min(1, v ** 0.85 * 1.15)
        if r < 0.35: continue
        cx, cy = (x + cell / 2) * S, (y + cell / 2) * S
        if (y // cell) % 2: cx += cell * S / 2
        d.ellipse([cx - r * S, cy - r * S, cx + r * S, cy + r * S], fill=255)
out = out.resize((W, H), Image.LANCZOS)
# keep a little of the photo underneath so the form still reads, then mask by the cutout
base = np.asarray(im.convert("L"), dtype=float) * 0.35
dots = np.asarray(out, dtype=float)
lum = np.clip(np.maximum(dots, base), 0, 255).astype(np.uint8)
alpha = (np.asarray(im.split()[3], dtype=float) * np.clip(np.maximum(dots / 255, 0.55), 0, 1)).astype(np.uint8)
Image.merge("RGBA", [Image.fromarray(lum)] * 3 + [Image.fromarray(alpha)]).save(os.path.join(R, "assets/photos/flex_halftone.png"))
print("ok", W, H)
