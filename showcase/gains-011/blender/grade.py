"""Grade and trim the Blender hero stills.

Crushes the lacquer's grey body towards black (power curve on RGB, alpha kept),
so only the crisp coat highlights stay bright, then crops each still to its object.
Usage: python3 grade.py assets/renders
"""

import sys
from pathlib import Path

from PIL import Image

GAMMA = 1.75
LUT = [round(255 * (i / 255) ** GAMMA) for i in range(256)]

root = Path(sys.argv[1])
for raw in sorted(root.glob("raw-*.png")):
    im = Image.open(raw).convert("RGBA")
    r, g, b, a = im.split()
    r, g, b = (c.point(LUT) for c in (r, g, b))
    out = Image.merge("RGBA", (r, g, b, a))
    box = a.point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        pad = 30
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
        out = out.crop(box)
    name = raw.name.replace("raw-", "")
    out.save(root / name)
    print(name, out.size)
