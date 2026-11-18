"""v03 cues: keep content cues from cues_ruta.py, replace camera whooshes with ones derived from the real camera moves."""
import json, math, subprocess
subprocess.run(['python3', 'tools/cues_ruta.py'], check=True)
spec = json.load(open('audio/ruta.json'))
shots = json.load(open('audio/shots.json'))
# drop the old camera whooshes (the big ones); keep small content whooshes (< .2)
spec['cues'] = [c for c in spec['cues'] if not (c['type'] == 'whoosh' and c.get('level', 0) >= .2)]
for t0, t1, dist in shots['moves']:
    d = t1 - t0
    lvl = min(.38, .16 + .05 * math.log10(max(dist, 10)))
    spec['cues'].append(dict(t=round(t0 - .05, 3), type='whoosh', dur=round(d + .25, 3), level=round(lvl, 3), up=dist < 3000))
json.dump(spec, open('audio/ruta3.json', 'w'))
print(len(spec['cues']), 'cues')
