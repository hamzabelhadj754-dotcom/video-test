"""Crop + resample the source photos for the two layouts.
full: 1080x1920 cover (flicker), card: 828x1104 (3:4 gallery frame). fx/fy = focus point (0..1)."""
import sys
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
FOCUS = {  # subject position in each photo
    1: (0.50, 0.55),  # kickback on the mat
    2: (0.52, 0.62),  # athlete under the light frames
    3: (0.58, 0.50),  # stretch, top view
    4: (0.62, 0.50),  # mat + dumbbell flat lay
    5: (0.80, 0.50),  # plank, laptop in foreground
}
def cover(im, W, H, fx, fy):
    s = max(W / im.width, H / im.height)
    r = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = min(max(round(r.width * fx - W / 2), 0), r.width - W)
    y = min(max(round(r.height * fy - H / 2), 0), r.height - H)
    return r.crop((x, y, x + W, y + H)), s
for i, (fx, fy) in FOCUS.items():
    im = Image.open(f"{src}/{i}.jpg").convert("RGB")
    for name, (W, H) in {"full": (1080, 1920), "card": (828, 1104)}.items():
        c, s = cover(im, W, H, fx, fy)
        if s > 1.05:
            c = c.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
        c.save(f"{out}/{i}_{name}.jpg", quality=94, subsampling=0)
        print(i, name, f"upscale x{s:.2f}")
