# Fill the sub-frames skipped in slow sections with their (identical) neighbour render.
import os, shutil
d = 'render/f120'; n = 2400; copied = missing = 0
for i in range(n):
    f = f'{d}/f_{i:04d}.jpg'
    if os.path.exists(f): continue
    base = f'{d}/f_{i - i % 4:04d}.jpg'
    if os.path.exists(base): shutil.copyfile(base, f); copied += 1
    else: missing += 1; print('missing base for', i)
print('copied', copied, 'missing', missing)
