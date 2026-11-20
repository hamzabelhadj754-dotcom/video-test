"""Sound cues for the editorial film (videohub/trazo-editorial), synced to its scene list and word times."""
import json
c = []
def a(t, ty, **k): c.append(dict(t=round(t, 3), type=ty, **k))

CUTS = [3.25, 9.75, 18.55, 22.0, 28.8, 35.55, 41.1, 46.4, 60.95, 68.4, 73.3, 81.65, 89.55]
for t in CUTS: a(t - .42, 'whoosh', dur=.85, level=.34, up=t not in (9.75, 68.4, 89.55))
for t in (9.75, 68.4): a(t - .05, 'hit', level=.45)            # paper → navy, navy → black
a(.25, 'shimmer', dur=2.6, level=.07); a(.7, 'hit', level=.35); a(1.3, 'click', level=.25)
a(3.5, 'riser', dur=.6, level=.12); a(4.06, 'hit', level=.4); a(5.04, 'click', level=.2)
for t in (7.16, 8.02, 8.3, 8.5): a(t, 'pop', level=.16, f=740)
a(11.6, 'whoosh', dur=.9, level=.22); a(12.36, 'pop', level=.22, f=660); a(15.4, 'whoosh', dur=.7, level=.3, pan=-.4); a(16.2, 'pop', level=.22, f=660)
a(20.44, 'hit', level=.4); a(20.82, 'hit', level=.3)
for i in range(4): a(20.9 + i * .1, 'tick', level=.1)
for base, items in ((22.04, (23.18, 24.92, 26.58)), (28.86, (30.3, 32.0, 33.98)), (35.64, (37.16, 38.18, 39.76)), (41.16, (42.82, 44.34, 45.3))):
    a(base + .1, 'click', level=.25)
    for t in items: a(t - .1, 'pop', level=.18, f=880)
a(22.3, 'whoosh', dur=1.3, level=.26, pan=.4); a(26.3, 'click', level=.35); a(26.35, 'pop', level=.22, f=990)   # card + like
for t in (30.6, 32.2, 34.3): a(t, 'pop', level=.2, f=620)       # reviews stacking
for t in (42.72, 43.48, 44.24): a(t, 'whoosh', dur=.4, level=.16, pan=.3)
a(45.62, 'hit', level=.55)                                       # warranty stamp
a(47.56, 'hit', level=.4); a(48.16, 'hit', level=.35)
for t in (49.24, 54.22, 57.54): a(t - .5, 'riser', dur=.5, level=.12); a(t, 'hit', level=.42); a(t + .05, 'shimmer', dur=1.6, level=.08)
a(61.48, 'hit', level=.45); a(62.3, 'whoosh', dur=.8, level=.22)
for t in (62.58, 64.16, 66.24): a(t - .1, 'pop', level=.22, f=700)
a(68.92, 'hit', level=.45)
for t in (70.14, 71.24, 72.02): a(t - .05, 'pop', level=.26, f=820); a(t, 'click', level=.2)
a(73.5, 'whoosh', dur=1.2, level=.2)
for t in (74.02, 75.4, 77.86, 79.62): a(t - .1, 'pop', level=.18, f=760)
a(83.0, 'hit', level=.35)
for t in (85.3, 86.08, 87.48, 88.64): a(t, 'pop', level=.2, f=680)
a(89.3, 'riser', dur=.7, level=.2); a(89.94, 'boom', level=.7); a(89.98, 'hit', level=.5); a(90.1, 'shimmer', dur=3.5, level=.1)
a(93.24, 'pop', level=.2, f=523)
json.dump({"duration": 96.4, "bpm": 100, "music": True, "music_start": 3.3, "music_fade_in": 2.5, "music_fade_out": 3.5, "music_level": .9,
           "duck": [[9.55, 9.8], [68.2, 68.45], [89.4, 89.95]], "cues": c}, open('audio/editorial.json', 'w'))
print(len(c), 'cues')
