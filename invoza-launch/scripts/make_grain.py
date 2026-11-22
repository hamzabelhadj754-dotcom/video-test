# Generates film-grain tiles used by the Grain overlay (cycled per frame).
import numpy as np
from PIL import Image
rng = np.random.default_rng(7)
for i in range(8):
    n = rng.normal(128, 38, (540, 960)).clip(0, 255).astype(np.uint8)
    Image.fromarray(n, "L").save(f"public/grain/g{i}.png")
