"""v05 cues: v03 content cues minus the departures board, later cues shifted -2.6 s (pause removed), whooshes from v05 camera moves."""
import json, math, subprocess
subprocess.run(['python3', 'tools/cues_ruta.py'], check=True)
spec = json.load(open('audio/ruta.json'))
shots = json.load(open('audio/shots5.json'))
out = []
for c in spec['cues']:
    if c['type'] == 'whoosh' and c.get('level', 0) >= .2:
        continue  # camera whooshes are regenerated below
    if c['type'] == 'flaps' or (45.0 <= c['t'] < 46.3):
        continue  # departures board (chime, flaps) removed
    if c['t'] >= 46.3:
        c['t'] = round(c['t'] - 2.6, 3)
    out.append(c)
for t0, t1, dist in shots['moves']:
    lvl = min(.38, .16 + .05 * math.log10(max(dist, 10)))
    out.append(dict(t=round(t0 - .05, 3), type='whoosh', dur=round(t1 - t0 + .25, 3), level=round(lvl, 3), up=dist < 3000))
spec['cues'] = out
spec['duration'] = 96.4
json.dump(spec, open('audio/ruta5.json', 'w'))
print(len(out), 'cues')
