"""Builds public/audio/mix.wav: original synthesized score + UI sound design + voiceover.

Everything is generated from code (no third-party samples). Timings come from
src/timeline.json so the audio stays locked to the picture.
Usage: python3 scripts/make_audio.py
"""
import json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy import signal

ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT / "src/timeline.json").read_text())
SR = 48000
DUR = T["durationInFrames"] / T["fps"]
N = int(DUR * SR)
EV = T["events"]
fr = lambda frame: frame / T["fps"]
rng = np.random.default_rng(42)


def tt(d):
    return np.arange(int(d * SR)) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


def place(buf, x, t, gain=1.0, pan=0.0):
    """Add mono x into stereo buf at time t (s) with equal-power pan (-1..1)."""
    i = int(t * SR)
    if i >= buf.shape[1]:
        return
    x = x[: buf.shape[1] - i]
    a = (pan + 1) * np.pi / 4
    buf[0, i : i + len(x)] += x * gain * np.cos(a)
    buf[1, i : i + len(x)] += x * gain * np.sin(a)


def env_ar(n, a, r_tau):
    t = np.arange(n) / SR
    e = np.exp(-t / r_tau)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def make_ir(rt=2.2, seed=1, lp=7000):
    r = np.random.default_rng(seed)
    t = tt(rt)
    ir = np.stack([r.standard_normal(len(t)), r.standard_normal(len(t))]) * np.exp(-t * 6.9 / rt)
    ir = signal.sosfilt(sos("lowpass", lp), ir, axis=1)
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt((ir**2).sum(axis=1, keepdims=True))


def reverb(st, ir, wet):
    out = np.stack([signal.fftconvolve(st[c], ir[c])[: st.shape[1]] for c in range(2)])
    return st + out * wet


# ------------------------------------------------------------------ instruments
def additive(freq, d, harmonics=8, bright=1.0, detune_cents=0.0, phase=0.0):
    t = tt(d)
    f = freq * 2 ** (detune_cents / 1200)
    x = np.zeros_like(t)
    for h in range(1, harmonics + 1):
        if f * h > 16000:
            break
        x += np.sin(2 * np.pi * f * h * t + phase * h) / (h ** (1.0 + 0.6 / bright))
    return x


def pad_note(m, d, a=0.6, r=0.8, lp=2200, voices=3):
    x = np.zeros(int((d + r) * SR))
    for v in range(voices):
        cents = (v - (voices - 1) / 2) * 7
        x += additive(mtof(m), d + r, harmonics=10, detune_cents=cents, phase=rng.uniform(0, 6))
    x = filt(x, "lowpass", lp)
    e = np.ones(len(x))
    na = int(a * SR)
    e[:na] = np.linspace(0, 1, na) ** 1.5
    nr = int(r * SR)
    e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return x * e / voices


def kick():
    t = tt(0.45)
    f = 46 + 110 * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.16)
    x += filt(rng.standard_normal(len(t)), "highpass", 2500) * np.exp(-t / 0.004) * 0.25
    return x


def hat(dec=0.03):
    t = tt(0.12)
    return filt(rng.standard_normal(len(t)), "highpass", 7500, 4) * np.exp(-t / dec)


def clap():
    t = tt(0.3)
    n = filt(rng.standard_normal(len(t)), "bandpass", [900, 2600])
    e = np.zeros(len(t))
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR)
        e[i:] += np.exp(-(t[: len(t) - i]) / (0.008 if k < 2 else 0.09))
    return n * e


def pluck(m, d=0.45, bright=1.0):
    t = tt(d)
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.05) + 0.12 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.03)
    return x * env_ar(len(t), 0.003, 0.13 * bright)


def bass_note(m, d):
    t = tt(d)
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)
    e = env_ar(len(t), 0.005, d * 0.9)
    e[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return filt(x * e, "lowpass", 500)


def bell(m, d=1.6, bright=1.0):
    t = tt(d)
    f = mtof(m)
    x = np.zeros_like(t)
    for ratio, amp, tau in [(1, 1.0, 0.9), (2.0, 0.45, 0.5), (2.76, 0.3 * bright, 0.25), (5.4, 0.18 * bright, 0.09), (8.9, 0.08 * bright, 0.04)]:
        x += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / tau)
    return x * env_ar(len(t), 0.002, 10)


# ------------------------------------------------------------------ score
music = np.zeros((2, N))
beat = 0.5  # 120 BPM, downbeat grid anchored at 16.0 s
GRID0 = fr(T["scenes"]["f1"][0])

# ---- 0–12 s: night tension (dark drone, clock tick, heartbeat) ----
cut = fr(EV["blackCut"])
drone = np.zeros(int(cut * SR))
for m, g in [(33, 0.9), (40, 0.55), (45, 0.45), (48, 0.3), (52, 0.18)]:
    x = additive(mtof(m), cut, harmonics=6, detune_cents=rng.uniform(-4, 4))
    drone += x * g
drone = filt(drone, "lowpass", 700)
lfo = 0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * tt(cut))
fade = np.minimum(1, tt(cut) / 1.8)
drone *= lfo * fade
place(music, drone, 0, 0.22, -0.15)
place(music, np.roll(drone, 900), 0, 0.22, 0.15)
# dissonant high tone creeping in (pain)
t_p = fr(T["scenes"]["pain"][0])
tense = additive(mtof(70), cut - t_p, harmonics=3) * np.minimum(1, tt(cut - t_p) / 3) * 0.6
place(music, filt(tense, "lowpass", 1800), t_p, 0.045, 0.3)
# clock ticks
for k in range(0, 12):
    tk = 0.25 + k * 1.0
    if tk > cut - 0.3:
        break
    x = filt(rng.standard_normal(int(0.03 * SR)), "bandpass", [2500 if k % 2 else 3300, 6000]) * np.exp(-tt(0.03) / 0.004)
    place(music, x, tk, 0.10 if tk < 5 else 0.05, 0.4)
# heartbeat-ish sub pulse in the pain scene
for k in range(int(t_p), int(cut)):
    for off, g in [(0, 1.0), (0.22, 0.6)]:
        t0 = k + 0.6 + off
        if t0 < cut - 0.4:
            x = np.sin(2 * np.pi * 52 * tt(0.25)) * np.exp(-tt(0.25) / 0.07)
            place(music, x, t0, 0.32 * g)
# riser into the cut
rd = 2.0
t = tt(rd)
noise = rng.standard_normal(len(t))
riser = np.zeros(len(t))
blocks = 64
for b in range(blocks):
    a, z = b * len(t) // blocks, (b + 1) * len(t) // blocks
    fc = 400 * (12 ** (b / blocks))
    riser[a:z] = signal.sosfilt(sos("bandpass", [fc * 0.7, min(fc * 1.4, 20000)]), noise[a - min(a, 2000) : z])[-(z - a) :]
riser *= (t / rd) ** 2.2
ph = 2 * np.pi * np.cumsum(220 * 2 ** (2 * t / rd)) / SR
riser += 0.25 * np.sin(ph) * (t / rd) ** 2
place(music, riser, cut - rd, 0.22)

# ---- 12.3 s →: Invoza (warm, confident, building) ----
logo_t = fr(EV["sweep"])
CH = {
    "F": (41, [57, 60, 64, 67, 72]),
    "C/E": (40, [55, 60, 64, 67, 74]),
    "Am": (45, [55, 60, 64, 69, 72]),
    "G": (43, [55, 59, 62, 67, 71]),
}
prog = ["F", "C/E", "Am", "G"]
# intro chords before the beat drops
for name, t0, d in [("F", logo_t, 2.0), ("G", logo_t + 2.0, GRID0 - logo_t - 2.0)]:
    root, notes = CH[name]
    for m in notes:
        place(music, pad_note(m, d, a=0.9 if t0 == logo_t else 0.3, lp=1800), t0, 0.07, rng.uniform(-0.5, 0.5))
    place(music, pad_note(root - 12 + 12, d, a=0.8, lp=600, voices=2), t0, 0.12)

END = DUR
bars = []
tb = GRID0
i = 0
while tb < END - 0.01:
    bars.append((tb, prog[i % 4]))
    tb += 2.0
    i += 1

pads = np.zeros((2, N))
drums = np.zeros((2, N))
bassb = np.zeros((2, N))
arps = np.zeros((2, N))
t_f2 = fr(T["scenes"]["f2"][0])
t_f3 = fr(T["scenes"]["f3"][0])
t_pay = fr(T["scenes"]["payoff"][0])
t_cta = fr(T["scenes"]["cta"][0])
for bi, (t0, name) in enumerate(bars):
    root, notes = CH[name]
    last = t0 + 2.0 >= END - 0.01
    d = min(2.0, END - t0) if not last else END - t0
    for m in notes:
        place(pads, pad_note(m, d, a=0.12, r=0.5, lp=2600 if t0 >= t_f3 else 2000), t0, 0.06, rng.uniform(-0.6, 0.6))
    # bass: 8ths from F2 scene; sustained in CTA tail
    if t0 < t_cta + 2.0:
        for k in range(8):
            tk = t0 + k * 0.25
            if tk >= END - 0.3:
                break
            place(bassb, bass_note(root, 0.23), tk, 0.34 if k % 2 == 0 else 0.24)
    else:
        place(bassb, bass_note(root, d), t0, 0.34)
    # drums
    for k in range(4):
        tk = t0 + k * beat
        if tk < t_cta + 2.0:
            place(drums, kick(), tk, 0.55)
        if t0 >= t_f2 and k in (1, 3) and tk < t_cta + 2.0:
            place(drums, clap(), tk, 0.16, 0.1)
        for h in (0.25,):
            if tk + h < t_cta + 2.0:
                place(drums, hat(0.035), tk + h, 0.10 if t0 < t_f3 else 0.13, 0.35)
        if t0 >= t_f3 and tk < t_cta + 2.0:
            place(drums, hat(0.015), tk, 0.05, -0.35)
    # arps from F2 scene on
    if t0 >= t_f2:
        seq = [notes[0], notes[2], notes[4], notes[3], notes[1], notes[3], notes[4], notes[2]]
        for k, m in enumerate(seq):
            tk = t0 + k * 0.25
            if tk >= END - 0.3:
                break
            octave = 12 if t0 >= t_f3 else 0
            place(arps, pluck(m + octave, bright=1.4 if t0 >= t_pay else 1.0), tk, 0.075, -0.45 if k % 2 else 0.45)

# sidechain pump on pads + bass from kicks
sc = np.ones(N)
for t0, _ in bars:
    for k in range(4):
        tk = t0 + k * beat
        if tk >= t_cta + 2.0:
            continue
        i0 = int(tk * SR)
        n = int(0.42 * SR)
        seg = 1 - 0.55 * np.exp(-np.arange(n) / SR / 0.09)
        sc[i0 : i0 + n] = np.minimum(sc[i0 : i0 + n], seg[: max(0, min(n, N - i0))])
pads *= sc
bassb *= sc
# arp echo (dotted 8th)
dl = int(0.375 * SR)
echo = np.zeros_like(arps)
echo[0, dl:] = arps[1, :-dl] * 0.45
echo[1, dl:] = arps[0, :-dl] * 0.45
echo[0, 2 * dl :] += arps[0, : -2 * dl] * 0.2
echo[1, 2 * dl :] += arps[1, : -2 * dl] * 0.2
arps = arps + filt(echo, "lowpass", 4000)

# build: the groove section opens up scene by scene
build = np.interp(np.arange(N) / SR, [GRID0, t_f2, t_f3, t_pay, t_cta + 1.8, END - 0.9, END], [0.78, 0.86, 0.94, 1.0, 1.0, 0.6, 0.0])
# no beat before the grid starts
pre = np.arange(N) / SR < GRID0 - 0.02
for b in (drums, bassb, arps):
    b[:, pre] = 0
music += (pads + drums + bassb * 0.9 + arps) * build
# master fade in the last moment
tail = np.arange(N) / SR > END - 1.2
music[:, tail] *= np.linspace(1, 0.15, tail.sum())
music = reverb(music, make_ir(2.4, 3), 0.22)
# hard cut to black at 12.0 s → silence until the sweep
c0, c1 = int(cut * SR), int((logo_t - 0.02) * SR)
music[:, c0:c1] = 0
music[:, c0 - 240 : c0] *= np.linspace(1, 0, 240)

# ------------------------------------------------------------------ sound design
sfx = np.zeros((2, N))


def whoosh(d=0.55, f0=300, f1=3500, pan0=-0.6, pan1=0.6):
    t = tt(d)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    blocks = 48
    for b in range(blocks):
        a, z = b * len(t) // blocks, (b + 1) * len(t) // blocks
        k = b / blocks
        fc = f0 * (f1 / f0) ** (np.sin(k * np.pi / 2))
        out[a:z] = signal.sosfilt(sos("bandpass", [fc * 0.6, min(fc * 1.6, 20000)]), n[max(0, a - 3000) : z])[-(z - a) :]
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    return out * e, pan0, pan1


def place_moving(buf, x, t, gain, pan0, pan1):
    i = int(t * SR)
    x = x[: buf.shape[1] - i]
    pan = np.linspace(pan0, pan1, len(x))
    a = (pan + 1) * np.pi / 4
    buf[0, i : i + len(x)] += x * gain * np.cos(a)
    buf[1, i : i + len(x)] += x * gain * np.sin(a)


def blip(f=1200, d=0.09, up=1.25):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(f * (1 + (up - 1) * (t / d))) / SR
    return np.sin(ph) * env_ar(len(t), 0.002, d / 4)


def click():
    t = tt(0.05)
    x = filt(rng.standard_normal(len(t)), "bandpass", [1800, 6000]) * np.exp(-t / 0.003)
    x += np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.012) * 0.6
    return x


def key_click(soft=1.0):
    t = tt(0.04)
    x = filt(rng.standard_normal(len(t)), "bandpass", [rng.uniform(1800, 2600), 7000]) * np.exp(-t / 0.0028)
    x += np.sin(2 * np.pi * rng.uniform(180, 240) * t) * np.exp(-t / 0.008) * 0.5
    return x * soft


def vibrate():
    out = np.zeros(int(0.5 * SR))
    for off in (0.0, 0.24):
        t = tt(0.17)
        x = np.tanh(3 * np.sin(2 * np.pi * 168 * t)) * (1 + 0.35 * np.sin(2 * np.pi * 34 * t))
        x += 0.25 * filt(rng.standard_normal(len(t)), "bandpass", [300, 900]) * (np.sin(2 * np.pi * 84 * t) > 0)
        e = np.minimum(1, t / 0.015) * np.minimum(1, (0.17 - t) / 0.02)
        i = int(off * SR)
        out[i : i + len(t)] += filt(x * e, "lowpass", 900)
    return out


def tense_ping():
    t = tt(0.7)
    x = np.sin(2 * np.pi * mtof(76) * t) * np.exp(-t / 0.12) + 0.8 * np.sin(2 * np.pi * mtof(75) * t) * np.exp(-(t - 0.0) / 0.25) * (t > 0.11)
    return filt(x, "lowpass", 2500)


# scene 1: wake + overdue notifications
place(sfx, blip(220, 0.35, 1.6) * 0.8, fr(EV["wake"]), 0.12)
for k, nf in enumerate(EV["notifs"]):
    place(sfx, vibrate(), fr(nf), 0.2)
    place(sfx, tense_ping(), fr(nf) + 0.02, 0.07, 0.2)
# scene 2: typing / deleting
for s in T["typing"]:
    n = len(s["text"])
    times = np.linspace(s["t0"], s["t1"], n, endpoint=False)
    for tk in times:
        jitter = rng.uniform(-0.012, 0.012)
        place(sfx, key_click(0.8 if s["kind"] == "type" else 0.6), tk + jitter, 0.16, rng.uniform(0.1, 0.35))
# transitions
for tr in EV["transitions"]:
    if tr == T["scenes"]["cta"][0]:
        continue
    x, a, b = whoosh(0.6, 280, 3800)
    place_moving(sfx, x, fr(tr) - 0.32, 0.20, a, b)
# black cut → logo: impact + violet sweep + shimmer
t = tt(1.6)
boom = np.sin(2 * np.pi * (42 + 30 * np.exp(-t / 0.1)) * t) * np.exp(-t / 0.45)
boom += filt(rng.standard_normal(len(t)), "lowpass", 300) * np.exp(-t / 0.2) * 0.4
place(sfx, boom, fr(EV["sweep"]), 0.42)
x, a, b = whoosh(0.95, 500, 7000, -0.8, 0.8)
place_moving(sfx, x, fr(EV["sweep"]), 0.18, a, b)
shimmer = np.zeros(int(2.2 * SR))
for k, m in enumerate([84, 88, 91, 96, 100]):
    y = bell(m, 1.6, 0.6)
    i = int(k * 0.055 * SR)
    shimmer[i : i + len(y)] += y[: len(shimmer) - i] * (0.9 - k * 0.1)
place(sfx, shimmer, fr(EV["logo"]), 0.07, 0.1)
# feature 1
place(sfx, blip(900, 0.08), fr(EV["f1Client"]), 0.10, 0.25)
for it in EV["f1Items"]:
    place(sfx, blip(1050, 0.08), fr(it), 0.09, 0.3)
for k in range(10):  # counting total
    place(sfx, blip(1500 + k * 60, 0.03, 1.0), fr(EV["f1Total"][0]) + k * (fr(EV["f1Total"][1]) - fr(EV["f1Total"][0])) / 10, 0.035, 0.3)
place(sfx, click(), fr(EV["f1Tap"]), 0.35, 0.25)
place(sfx, blip(700, 0.12, 1.5), fr(EV["f1Tap"]) + 0.06, 0.09, 0.25)
x, a, b = whoosh(0.5, 600, 5000, 0.2, 0.9)
place_moving(sfx, x, fr(EV["f1Fly"]), 0.20, a, b)
# feature 2
place(sfx, click(), fr(EV["f2Toggle"]), 0.22, -0.4)
place(sfx, click(), fr(EV["f2Toggle"]) + 0.07, 0.12, -0.4)
for k, c in enumerate(EV["f2Cards"]):
    x, a, b = whoosh(0.32, 900, 4000, 0.7, 0.2)
    place_moving(sfx, x, fr(c) - 0.08, 0.10, a, b)
    y = blip(1320, 0.11, 1.0) + 0.6 * np.pad(blip(1980, 0.09, 1.0), (0, int(0.02 * SR)))
    place(sfx, y, fr(c) + 0.27, 0.08, 0.3)
# feature 3
for k in range(6):
    place(sfx, blip(600 + k * 110, 0.06, 1.1), fr(EV["f3Bars"]) + k * 5 / 30, 0.045, 0.3)
place(sfx, click(), fr(EV["f3Paid"]), 0.18, -0.2)
paid = bell(84, 1.6) + 0.8 * np.pad(bell(91, 1.6), (int(0.09 * SR), 0))[: int(1.6 * SR)]
place(sfx, paid, fr(EV["f3Paid"]) + 0.03, 0.13, -0.1)
# payoff: the payment chime
big = np.zeros(int(2.6 * SR))
for k, (m, g) in enumerate([(79, 0.8), (84, 0.9), (88, 1.0), (91, 0.6)]):
    y = bell(m, 2.2, 0.8)
    i = int(k * 0.085 * SR)
    big[i : i + len(y)] += y[: len(big) - i] * g
x, a, b = whoosh(0.45, 400, 3000, 0, 0)
place_moving(sfx, x, fr(EV["payNotif"]) - 0.3, 0.12, a, b)
place(sfx, big, fr(EV["payNotif"]), 0.14)
# CTA
x, a, b = whoosh(0.8, 500, 6500, -0.8, 0.8)
place_moving(sfx, x, fr(EV["ctaSweep"]) - 0.2, 0.17, a, b)
place(sfx, shimmer, fr(EV["ctaSweep"]) + 0.3, 0.05)
place(sfx, blip(800, 0.14, 1.4), fr(EV["ctaButton"]) + 0.1, 0.10)
place(sfx, click(), fr(EV["ctaButton"]) + 0.1, 0.12)

sfx = reverb(sfx, make_ir(1.4, 5), 0.18)

# ------------------------------------------------------------------ voiceover
vo = np.zeros((2, N))
duck = np.ones(N)
for v in T["vo"]:
    x, sr = sf.read(ROOT / "public/vo" / f"{v['id']}.wav", dtype="float64")
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = signal.resample_poly(x, SR, sr)
    x = filt(x, "highpass", 75)
    # gentle presence + level
    x = x + 0.25 * filt(x, "bandpass", [2500, 6000])
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    x = np.tanh(x * 1.4) / np.tanh(1.4)
    place(vo, x, v["start"], 0.62)
    i0 = int((v["start"] - 0.15) * SR)
    i1 = int((v["start"] + len(x) / SR + 0.25) * SR)
    duck[max(0, i0) : i1] = 0.42
duck = np.convolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
vo = reverb(vo, make_ir(0.8, 9, 5000), 0.06)

mix = music * duck * 0.6 + sfx * 0.85 + vo
mix = filt(mix, "highpass", 25)
mix = mix / np.abs(mix).max() * 0.89
out_raw = ROOT / "out" / "mix_raw.wav"
out_raw.parent.mkdir(exist_ok=True)
sf.write(out_raw, mix.T, SR, subtype="PCM_24")
for name, arr in [("music", music), ("sfx", sfx), ("vo", vo)]:
    sf.write(ROOT / "out" / f"stem_{name}.wav", (arr / (np.abs(arr).max() + 1e-9) * 0.89).T, SR, subtype="PCM_24")
subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-y", "-i", str(out_raw), "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", str(ROOT / "public/audio/mix.wav")],
    check=True,
)
print("wrote public/audio/mix.wav", DUR, "s")

if __name__ == "__main__" and "--report" in __import__("sys").argv:
    db = lambda a: round(20 * np.log10(np.sqrt((a**2).mean()) + 1e-12), 1)
    for v in T["vo"]:
        i0 = int(v["start"] * SR); i1 = i0 + int(1.5 * SR)
        print(v["id"], "vo", db(vo[:, i0:i1]), "music", db((music * duck * 0.6)[:, i0:i1]), "sfx", db(sfx[:, i0:i1]))
    for a, b in [(13.5, 16), (19, 21), (26.5, 30), (34, 37), (44, 45)]:
        print(a, b, "music only", db((music * 0.9)[:, int(a * SR):int(b * SR)]))
