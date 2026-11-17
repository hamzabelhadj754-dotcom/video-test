"""Sound cues for La Ruta (synced to the film5 timeline)."""
import json

V = lambda x: x + 3.4 if x < 42.9 else x + 6.0
c = []


def a(t, ty, **k):
    c.append(dict(t=round(t, 3), type=ty, **k))


# intro + station 01
a(.2, 'chime', level=.22); a(.55, 'shimmer', dur=2.2, level=.08)
a(2.8, 'whoosh', dur=1.6, level=.32); a(4.4, 'chime', level=.3)
a(3.7, 'whoosh', dur=2.2, level=.12, up=False)
for i in range(3): a(V(3.76) + i * .25, 'click', level=.18, pan=[-.4, 0, .4][i])
# station 02 (two branches)
a(9.2, 'whoosh', dur=1.4, level=.34); a(10.6, 'chime', level=.3)
a(V(12.34) - 1.0, 'whoosh', dur=1.2, level=.3, up=False); a(V(12.34) + .2, 'chime', level=.26, up=False)
for i in range(12): a(V(14.12) - .5 + i * .05, 'tick', level=.06)
# zoom out to the avenue
a(V(15.2) - .5, 'whoosh', dur=1.6, level=.36, up=False)
for i in range(4): a(V(16.4) + i * .12, 'pop', level=.14, f=660 + i * 110)
# four functions: travel + station chime + row ticks
FT = [[V(18.64), V(19.78), V(21.52), V(23.18)], [V(25.46), V(26.78), V(28.42), V(30.58)],
      [V(32.24), V(33.76), V(34.78), V(36.36)], [V(37.76), V(39.42), V(40.94), V(41.9)]]
for i, f in enumerate(FT):
    a(f[0] - 1.0, 'whoosh', dur=1.1, level=.32, pan=.2)
    a(f[0] - .05, 'chime', level=.26)
    for k in (1, 2, 3): a(f[k] - .2, 'click', level=.14)
# departures board
a(45.2, 'whoosh', dur=1.0, level=.3); a(45.75, 'chime', level=.3)
a(46.25, 'flaps', dur=2.2, level=.32)
# SMART climb
a(V(44.16) - .5, 'whoosh', dur=1.4, level=.32)
for t0 in (V(45.84), V(50.82), V(54.14)):
    a(t0 - 1.0, 'riser', dur=1.0, level=.12); a(t0, 'chime', level=.28); a(t0 + .05, 'hit', level=.25)
a(V(56.6), 'whoosh', dur=1.4, level=.34, up=False)
# supervision roundabout + medals
a(63.3, 'whoosh', dur=1.2, level=.3); a(64.5, 'shimmer', dur=V(64.8) - 64.5, level=.06)
for t0 in (V(59.18), V(60.76), V(62.84)): a(t0 - .15, 'pop', level=.22, f=740)
a(V(65.1), 'whoosh', dur=1.0, level=.3)
for t0 in (V(66.74), V(67.84), V(68.62)): a(t0 - .05, 'chime', level=.22); a(t0, 'hit', level=.22)
# factors crossroads
a(75.5, 'whoosh', dur=1.2, level=.32); a(76.2, 'chime', level=.26)
for t0 in (V(70.46), V(71.88), V(73.72), V(75.66)): a(t0 - .2, 'whoosh', dur=.45, level=.14, pan=-.4 if t0 < V(73) else .4)
# org metro map
a(84.0, 'whoosh', dur=1.2, level=.32); a(84.9, 'chime', level=.3)
for t0 in (V(82.68), V(84.08), V(85.24)): a(t0 - .3, 'whoosh', dur=1.0, level=.16); a(t0 + .2, 'pop', level=.18, f=880)
# end: pull back to the whole route + logo
a(91.4, 'riser', dur=1.6, level=.22); a(91.5, 'whoosh', dur=2.0, level=.34, up=False)
a(V(86.54) + .4, 'hit', level=.5); a(V(86.54) + .45, 'boom', level=.65); a(V(86.54) + .5, 'chime', level=.34)
a(V(86.54) + .6, 'shimmer', dur=3.5, level=.1)
a(V(89.84) - .1, 'pop', level=.2, f=523)

json.dump({"duration": 99.0, "bpm": 104, "music": True, "music_start": 3.4, "music_fade_in": 2.5, "music_fade_out": 3.5,
           "music_level": .9, "cues": c}, open('audio/ruta.json', 'w'))
print(len(c), 'cues')
