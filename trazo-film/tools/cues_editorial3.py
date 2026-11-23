"""Sound cues for TRAZO · "Un solo trazo" (v08+), generated from the film's own event log.
The film records every pen stroke, node, comet, giant word, typed word, cursor click, pill, roll, slam and card
(window.VH_EVENTS) and its cuts (window.VH_CUTS); a 20 fps pass over the film dumps them to audio/editorial3_events.json.
This turns them into audio/editorial3.json for tools/sound.py (sound effects only: the music is tools/score.py), so every
sound sits exactly on its picture event."""
import json

d = json.load(open('audio/editorial3_events.json'))
c = []
def a(t, ty, **k):
    if t >= 0: c.append(dict(t=round(t, 3), type=ty, **k))

for t, (kind, h, *ex) in sorted((float(k), v) for k, v in d['cuts'].items()):
    if kind == 'travel':   # the camera follows the pen: one long airy whoosh through the cut
        a(t - h - .1, 'whoosh', dur=2 * h + .4, level=.36, up=True, pan=-.2 if ex and ex[0][0] else 0)
    elif kind == 'iris':
        a(t - h, 'whoosh', dur=2 * h + .2, level=.22); a(t - .1, 'shimmer', dur=1.4, level=.1)
    elif kind == 'match':
        a(t - .3, 'whoosh', dur=.55, level=.16)

seen_pen = set()
for e in d['ev']:
    t, ty = e['t'], e['type']
    if ty == 'pen':      # the trazo drawing: a soft swish shaped to the stroke (long strokes get a longer, quieter swish)
        if round(t, 1) in seen_pen: continue
        seen_pen.add(round(t, 1)); dur = max(.18, min(1.6, e.get('dur', .4)))
        a(t, 'whoosh', dur=dur + .1, level=.09 if dur > .5 else .07, up=True, pan=.15)
    elif ty == 'node': a(t, 'pop', level=.12, f=1180); a(t, 'tick', level=.08)
    elif ty == 'comet': pass                                    # covered by the travel whoosh
    elif ty == 'word':   # giant word: reverse swell into the hit, sub boom under it
        a(t - .55, 'riser', dur=.55, level=.2); a(t + .02, 'hit', level=.62); a(t + .03, 'boom', level=.42); a(t + .45, 'whoosh', dur=.6, level=.16, up=False)
    elif ty == 'type':
        n, cps = e['n'], e['cps']
        for i in range(0, min(n, 28), 2): a(t + i / cps, 'tick', level=.05)
    elif ty == 'click': a(t, 'click', level=.3)
    elif ty == 'bar': a(t, 'whoosh', dur=.3, level=.06, pan=-.2)
    elif ty == 'swap': a(t, 'pop', level=.14, f=700)
    elif ty == 'ghost': a(t, 'whoosh', dur=.7, level=.1); a(t + .2, 'shimmer', dur=1.2, level=.06)
    elif ty == 'pop': a(t, 'pop', level=.13, f=880)
    elif ty == 'roll':
        for i in range(10): a(t + i * .05, 'tick', level=.045)
    elif ty == 'likes':
        for i in range(3): a(t + i * .07, 'pop', level=.17, f=990 + 120 * i)
    elif ty == 'slam': a(t - .02, 'hit', level=.62); a(t, 'boom', level=.42 if t < 80 else .75)
    elif ty == 'tumble': a(t, 'whoosh', dur=1.2, level=.22, pan=.3)
    elif ty == 'card': a(t, 'pop', level=.12, f=620); a(t - .05, 'whoosh', dur=.3, level=.06)
    elif ty == 'shrink': a(t, 'whoosh', dur=.7, level=.12, up=False)
    elif ty == 'carry': a(t, 'whoosh', dur=.8, level=.24); a(t + .82, 'hit', level=.34)

a(90.1, 'shimmer', dur=3.5, level=.1)
slams = [e['t'] for e in d['ev'] if e['type'] in ('slam', 'word')]
json.dump({"duration": 96.4, "music": False, "cues": sorted(c, key=lambda x: x['t'])}, open('audio/editorial3.json', 'w'))
print(len(c), 'cues; slams/words at', sorted(set(slams)))
