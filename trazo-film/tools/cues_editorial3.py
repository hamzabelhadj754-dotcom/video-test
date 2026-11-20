"""Sound cues for TRAZO · Editorial v03, generated from the film's own event log.
The film records every typed word, cursor click, pill, roll, slam and card (window.VH_EVENTS) and its cuts (window.VH_CUTS);
a 20 fps pass over the film dumps them to audio/editorial3_events.json. This turns them into audio/editorial3.json for
tools/sound.py, so every sound sits exactly on its picture event."""
import json

d = json.load(open('audio/editorial3_events.json'))
c = []
def a(t, ty, **k):
    if t >= 0: c.append(dict(t=round(t, 3), type=ty, **k))

for t, (kind, h, *ex) in sorted((float(k), v) for k, v in d['cuts'].items()):
    if kind == 'push':
        a(t - h - .05, 'whoosh', dur=2 * h + .3, level=.34, up=ex[0][1] <= 0)
    elif kind == 'disc':
        a(t - h, 'whoosh', dur=2 * h + .2, level=.28); a(t - .1, 'shimmer', dur=1.2, level=.08)
    elif kind == 'match':
        a(t - .3, 'whoosh', dur=.55, level=.2)
    elif kind == 'flash':
        a(t - .55, 'riser', dur=.55, level=.16); a(t, 'hit', level=.5)
    elif kind == 'leaf':
        a(t - h, 'whoosh', dur=2 * h + .2, level=.3, up=False)

for e in d['ev']:
    t, ty = e['t'], e['type']
    if ty == 'type':
        n, cps = e['n'], e['cps']
        for i in range(0, min(n, 28), 2): a(t + i / cps, 'tick', level=.06)
    elif ty == 'click': a(t, 'click', level=.32)
    elif ty == 'bar': a(t, 'whoosh', dur=.32, level=.07, pan=-.2)
    elif ty == 'swap': a(t, 'pop', level=.15, f=700)
    elif ty == 'ghost': a(t, 'whoosh', dur=.7, level=.1); a(t + .2, 'shimmer', dur=1.2, level=.06)
    elif ty == 'pop': a(t, 'pop', level=.14, f=880)
    elif ty == 'roll':
        for i in range(12): a(t + i * .05, 'tick', level=.05)
    elif ty == 'likes':
        for i in range(3): a(t + i * .07, 'pop', level=.18, f=990 + 120 * i)
    elif ty == 'slam': a(t - .02, 'hit', level=.6); a(t, 'boom', level=.4 if t < 80 else .7)
    elif ty == 'tumble': a(t, 'whoosh', dur=1.2, level=.24, pan=.3)
    elif ty == 'flip': a(t - .1, 'whoosh', dur=.5, level=.18)
    elif ty == 'card': a(t, 'pop', level=.14, f=620); a(t - .05, 'whoosh', dur=.3, level=.07)
    elif ty == 'shrink': a(t, 'whoosh', dur=.7, level=.14, up=False)
    elif ty == 'carry': a(t - .2, 'riser', dur=.6, level=.14); a(t, 'whoosh', dur=.7, level=.22); a(t + .6, 'hit', level=.35)

a(90.1, 'shimmer', dur=3.5, level=.1)
slams = [e['t'] for e in d['ev'] if e['type'] == 'slam']
json.dump({"duration": 96.4, "bpm": 100, "music": True, "music_start": 1.2, "music_fade_in": 2.5, "music_fade_out": 3.5, "music_level": .9,
           "duck": [[s - .25, s + .02] for s in slams], "cues": sorted(c, key=lambda x: x['t'])}, open('audio/editorial3.json', 'w'))
print(len(c), 'cues; slams at', slams)
