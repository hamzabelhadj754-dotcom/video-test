"""Measure on-screen rects of probed elements: renders stills with one element painted green."""
import json, subprocess, sys
import numpy as np
from PIL import Image

JOBS = [("hl", 116), ("hl", 152), ("bubble", 256), ("card", 437), ("check", 470)]
out = {}
for probe, frame in JOBS:
    path = f"out/probe_{probe}_{frame}.png"
    subprocess.run(["npx", "remotion", "still", "Someday", path, f"--frame={frame}", f"--props={json.dumps({'probe': probe})}"],
                   check=True, capture_output=True)
    a = np.asarray(Image.open(path).convert("RGB")).astype(int)
    m = (a[..., 1] > 170) & (a[..., 0] < 110) & (a[..., 2] < 110)
    ys, xs = np.nonzero(m)
    out[f"{probe}@{frame}"] = None if len(xs) == 0 else dict(x=int(xs.min()), y=int(ys.min()), w=int(xs.max() - xs.min() + 1), h=int(ys.max() - ys.min() + 1), px=int(m.sum()))
    print(probe, frame, out[f"{probe}@{frame}"], flush=True)
