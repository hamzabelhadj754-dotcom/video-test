import sys, glob, os
from PIL import Image, ImageDraw
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3])
files = sorted(glob.glob(f"{d}/f*.png"))
ims = [Image.open(f) for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * (w + 6), rows * (h + 26)), (50, 50, 50))
dr = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * (w + 6), (i // cols) * (h + 26)
    S.paste(im, (x, y + 22)); dr.text((x + 4, y + 4), os.path.basename(f), fill=(255, 200, 0))
S.save(out)
