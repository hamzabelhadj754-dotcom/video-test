"""Split the OBELCHA logo into a transparent mark and wordmark (black + white), 4x upscaled."""
import sys
from PIL import Image
import numpy as np

src, out = sys.argv[1], sys.argv[2]
g = np.array(Image.open(src).convert("L")).astype(np.float32)
alpha = np.clip((235 - g) / (235 - 40), 0, 1)  # dark ink -> opaque, soft edges kept


def save(a, box, name):
    x0, y0, x1, y1 = box
    a = a[y0:y1, x0:x1]
    for col, suffix in ((0, "black"), (255, "white")):
        rgba = np.zeros(a.shape + (4,), np.uint8)
        rgba[..., :3] = col
        rgba[..., 3] = (a * 255).astype(np.uint8)
        im = Image.fromarray(rgba, "RGBA")
        im = im.resize((im.width * 4, im.height * 4), Image.LANCZOS)
        im.save(f"{out}/obelcha-{name}-{suffix}.png")


save(alpha, (128, 124, 374, 300), "mark")
save(alpha, (128, 318, 374, 362), "word")
save(alpha, (128, 124, 374, 362), "full")
print("ok")
