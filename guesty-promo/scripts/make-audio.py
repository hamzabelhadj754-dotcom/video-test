#!/usr/bin/env python3
"""
Generates ORIGINAL audio for the promo — no samples, no third-party audio, no licensing:
  public/music.mp3        30 s track at 133.33 BPM (1 bar = 1.8 s = 1 scene, so every cut lands on a downbeat)
  public/sfx/<name>.wav   synthesized sound effects (names referenced in src/sfx.ts)

Run:  python3 -m venv .venv-audio && .venv-audio/bin/pip install numpy scipy
      .venv-audio/bin/python scripts/make-audio.py
"""
import os
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 48000
BEAT = 0.45  # 133.33 BPM
BAR = 4 * BEAT  # 1.8 s == one 54-frame scene
DUR = 30.0
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
rng = np.random.default_rng(7)

# ----------------------------------------------------------------------------- helpers
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def hz(name: str) -> float:
    semis = NOTE[name[0]] + (1 if "#" in name else 0) - (1 if "b" in name[1:-1] else 0)
    midi = (int(name[-1]) + 1) * 12 + semis
    return 440.0 * 2 ** ((midi - 69) / 12)


def _sos(kind, f, order=2):
    return butter(order, f, kind, fs=SR, output="sos")


def lp(x, f, order=2):
    return sosfilt(_sos("low", f, order), x, axis=-1)


def hp(x, f, order=2):
    return sosfilt(_sos("high", f, order), x, axis=-1)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=-1)


def tt(seconds):
    return np.arange(int(seconds * SR)) / SR


def env(n, attack, decay, release=0.0):
    t = np.arange(n) / SR
    e = np.exp(-t / decay) if decay else np.ones(n)
    if attack > 0:
        e *= np.minimum(1.0, t / attack)
    if release > 0:
        r = int(release * SR)
        e[-r:] *= np.linspace(1, 0, r) if r < n else 1
    return e


def noise(n):
    return rng.uniform(-1, 1, n)


TABLE = 2048
_ph = np.arange(TABLE) / TABLE
SAW = sum(np.sin(2 * np.pi * k * _ph) / k for k in range(1, 40)) * (2 / np.pi)


def osc(freq, n, table=SAW, phase=0.0):
    inc = (np.full(n, freq) if np.isscalar(freq) else freq) / SR
    ph = (phase + np.cumsum(inc)) % 1.0
    return np.interp(ph * TABLE, np.arange(TABLE + 1), np.append(table, table[0]))


def sine_sweep(f0, f1, n, curve="exp"):
    k = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** k if curve == "exp" else f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def pan(sig, p=0.0):
    a = (p + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)


def stereo(sig):
    return sig if sig.ndim == 2 else pan(sig)


def reverb_ir(seconds=2.0, damp=5000, seed=1):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = []
    for _ in range(2):
        x = r.standard_normal(n) * np.exp(-t * 6.9 / seconds)
        x = lp(x, damp)
        ramp = int(0.015 * SR)
        x[:ramp] *= np.linspace(0, 1, ramp)
        out.append(x / np.sqrt(np.sum(x**2)))
    return np.stack(out)


def reverb(sig, seconds=2.0, mix=0.3, damp=5000):
    sig = stereo(sig)
    ir = reverb_ir(seconds, damp)
    tail = int(seconds * SR)
    padded = np.pad(sig, ((0, 0), (0, tail)))
    wet = np.stack([fftconvolve(padded[c], ir[c])[: padded.shape[1]] for c in range(2)])
    return padded + wet * mix


def bell(f, seconds=1.0, bright=1.0):
    t = tt(seconds)
    partials = [(1.0, 1.0, 1.0), (2.0, 0.35 * bright, 0.6), (3.01, 0.12 * bright, 0.35), (5.4, 0.05 * bright, 0.2)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (seconds * 0.45 * d)) for r, a, d in partials)
    return x * np.minimum(1, t / 0.002)


_pluck_cache = {}


def pluck(f, seconds=0.55, bright=0.55, decay=0.995):
    key = (round(f, 3), seconds, bright, decay)
    if key in _pluck_cache:
        return _pluck_cache[key]
    n = int(seconds * SR)
    N = max(2, int(round(SR / f - 0.5)))
    exc = np.zeros(n)
    exc[:N] = lp(noise(N), 1500 + 7000 * bright)
    a = np.zeros(N + 2)
    a[0], a[N], a[N + 1] = 1, -decay / 2, -decay / 2
    y = lfilter([1.0], a, exc) * env(n, 0.001, seconds * 0.6)
    y /= np.max(np.abs(y)) + 1e-9
    _pluck_cache[key] = y
    return y


def normalize(x, peak_db=-1.0):
    return x * (10 ** (peak_db / 20) / (np.max(np.abs(x)) + 1e-9))


def write_wav(path, x):
    x = stereo(x)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wavfile.write(path, SR, (np.clip(x.T, -1, 1) * 32767).astype(np.int16))


# ----------------------------------------------------------------------------- instruments
def kick(punch=1.0):
    t = tt(0.5)
    f = 46 + 95 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = hp(noise(len(t)), 2500) * np.exp(-t * 320) * 0.35 * punch
    return np.tanh(1.7 * (body + click))


def clap():
    t = tt(0.4)
    e = sum((t >= d) * np.exp(-np.maximum(0, t - d) * 190) for d in (0.0, 0.011, 0.023))
    e = e + (t >= 0.03) * np.exp(-np.maximum(0, t - 0.03) * 16) * 0.55
    return bp(noise(len(t)), 900, 4200) * e


def hat(open_=False):
    t = tt(0.45 if open_ else 0.08)
    return hp(noise(len(t)), 7500, 3) * np.exp(-t * (8 if open_ else 70))


def crash(seconds=2.2):
    t = tt(seconds)
    return hp(noise(len(t)), 4500, 2) * np.exp(-t * 2.2) * np.minimum(1, t / 0.004)


def bass_note(f, seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) + 0.18 * osc(f, n)
    x = lp(np.tanh(1.6 * x), 900)
    rel = min(n, int(0.015 * SR))
    e = env(n, 0.004, seconds * 1.2)
    e[-rel:] *= np.linspace(1, 0, rel)
    return x * e


def pad(notes, seconds, cutoff=2400, attack=0.2, release=0.8, detune=7):
    n = int((seconds + release) * SR)
    out = np.zeros((2, n))
    for i, name in enumerate(notes):
        f = hz(name)
        for j, cents in enumerate((-detune, 0, detune)):
            v = osc(f * 2 ** (cents / 1200), n, phase=rng.uniform())
            out += pan(v, (-0.6, 0.0, 0.6)[j] * (1 if i % 2 else -1))
    e = env(n, attack, 0)
    hold = int(seconds * SR)
    e[hold:] *= np.exp(-np.arange(n - hold) / SR / (release / 3))
    return lp(out * e, cutoff) / (len(notes) * 3)


def riser(seconds, f0=300, f1=6000):
    n = int(seconds * SR)
    k = np.linspace(0, 1, n)
    x = noise(n)
    # sweep by crossfading fixed bands (cheap time-varying filter)
    bands = np.geomspace(f0, f1, 10)
    centre = f0 * (f1 / f0) ** k
    out = np.zeros(n)
    for b in bands:
        w = np.exp(-((np.log(b) - np.log(centre)) / 0.45) ** 2)
        out += bp(x, b / 1.4, min(b * 1.4, SR / 2 - 100)) * w
    return out * k**2.2


# ----------------------------------------------------------------------------- music
def make_music():
    L = int((DUR + 3) * SR)
    drums = np.zeros((2, L))
    bass = np.zeros((2, L))
    wet = np.zeros((2, L))  # pads, arps, claps, crashes -> reverb + sidechain
    kicks = []

    def add(bus, sig, t0, gain=1.0, p=0.0):
        s = (pan(sig, p) if sig.ndim == 1 else sig) * gain
        i = int(round(t0 * SR))
        n = min(s.shape[1], L - i)
        if n > 0:
            bus[:, i : i + n] += s[:, :n]

    def k(t0, gain=0.8):
        add(drums, kick(), t0, gain)
        kicks.append(t0)

    bar = lambda b: b * BAR  # noqa: E731

    CH = {
        "F": ("F2", ["F3", "A3", "C4", "E4"]),
        "C": ("C2", ["E3", "G3", "C4", "D4"]),
        "Am": ("A2", ["E3", "A3", "C4", "G4"]),
        "G": ("G2", ["D3", "G3", "B3", "E4"]),
        "Cmaj9": ("C2", ["E3", "G3", "B3", "D4"]),
        "Fmaj9": ("F2", ["C3", "A3", "E4", "G4"]),
    }

    # --- bars 0-1: chaos (tense cluster, ticking hats, pumping A/Bb bass)
    for b in (0, 1):
        t0 = bar(b)
        for beat in range(4):
            for s in range(4):
                add(drums, hat(), t0 + beat * BEAT + s * BEAT / 4, 0.22 if s == 0 else 0.12, 0.25)
        for kt in (0, 2, 3.5):
            k(t0 + kt * BEAT, 0.75)
        for e8 in range(8):
            f = hz("Bb1") if e8 >= 6 else hz("A1")
            add(bass, bass_note(f * 2, 0.16), t0 + e8 * BEAT / 2, 0.55 if e8 % 2 == 0 else 0.35)
    cluster = pad(["A2", "E3", "Bb3", "F4"], 2 * BAR, cutoff=1500, attack=0.05, release=0.3, detune=14)
    trem = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * (4 / BEAT) * np.arange(cluster.shape[1]) / SR))
    swell = np.linspace(0.6, 1.0, cluster.shape[1])
    add(wet, cluster * trem * swell, 0, 0.55)
    add(wet, riser(BAR, 400, 3000), bar(1), 0.05)

    # --- bar 2: "Sound familiar?" — everything stops; sub drop + riser into the logo
    add(drums, np.tanh(2 * np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-tt(1.4) * 6)) / SR) * np.exp(-tt(1.4) * 2.5)), bar(2), 0.7)
    add(wet, riser(1.3, 250, 9000), bar(3) - 1.3, 0.22)
    sweep = sine_sweep(180, 1400, int(1.0 * SR)) * np.linspace(0, 1, int(1.0 * SR)) ** 3
    add(wet, sweep, bar(3) - 1.0, 0.05)

    # --- bar 3: logo bloom — open major chord, no drums
    k(bar(3), 0.9)
    add(wet, crash(2.5), bar(3), 0.18, -0.2)
    root, notes = CH["Fmaj9"]
    add(bass, bass_note(hz(root), BAR * 1.05), bar(3), 0.6)
    add(wet, pad(notes, BAR, cutoff=3200, attack=0.03, release=1.2), bar(3), 1.2)
    for i, nm in enumerate(["C5", "E5", "G5", "A5", "C6"]):
        add(wet, pluck(hz(nm), 1.2, 0.8), bar(3) + i * BEAT / 4, 0.12, (-0.5, 0.5)[i % 2])

    # --- bars 4-10: feature groove (F C Am G F C G)
    prog = ["F", "C", "Am", "G", "F", "C", "G"]
    ARP = [0, 2, 1, 3, 2, 0, 3, 1, 0, 2, 1, 3, 2, 3, 1, 2]

    def groove(b, chord, lift=False, arp_oct=12, clap_on=True):
        t0 = bar(b)
        root, notes = CH[chord]
        for beat in range(4):
            k(t0 + beat * BEAT, 0.72)
            add(drums, hat(open_=lift), t0 + beat * BEAT + BEAT / 2, 0.16 if lift else 0.2, 0.3)
            add(drums, hat(), t0 + beat * BEAT + 3 * BEAT / 4, 0.07, -0.3)
            if clap_on and beat in (1, 3):
                add(wet, clap(), t0 + beat * BEAT, 0.32)
            add(bass, bass_note(hz(root), BEAT * 0.42), t0 + beat * BEAT, 0.62)
            add(bass, bass_note(hz(root) * 2, BEAT * 0.2), t0 + beat * BEAT + BEAT / 2, 0.3)
        add(wet, pad(notes, BAR, cutoff=3600 if lift else 2600, attack=0.06, release=0.5), t0, 0.9)
        for s in range(16):
            if s % 4 == 3 and not lift:
                continue
            f = hz(notes[ARP[s] % len(notes)]) * 2 ** (arp_oct / 12)
            add(wet, pluck(f, 0.45, 0.6), t0 + s * BEAT / 4, 0.1 if s % 2 else 0.14, (-0.35, 0.35)[s % 2])

    for i, chord in enumerate(prog):
        groove(4 + i, chord, clap_on=i > 0)
    add(wet, riser(BAR / 2, 500, 8000), bar(11) - BAR / 2, 0.2)

    # --- bars 11-14: proof — more lift
    add(wet, crash(2.2), bar(11), 0.16, 0.2)
    for i, chord in enumerate(["Am", "F", "C", "G"]):
        groove(11 + i, chord, lift=True, arp_oct=24 if i % 2 else 12)
    add(wet, riser(BAR / 2, 500, 9000), bar(15) - BAR / 2, 0.2)

    # --- bar 15: CTA — resolve home to C, groove continues one bar
    add(wet, crash(2.5), bar(15), 0.2, -0.2)
    groove(15, "Cmaj9", lift=False)

    # --- final hit at 28.8 s: sustained C, bells, tail (the video fades out over the last second)
    t_end = bar(16)
    k(t_end, 0.85)
    add(wet, crash(2.5), t_end, 0.16)
    root, notes = CH["Cmaj9"]
    add(bass, bass_note(hz(root), 1.3), t_end, 0.6)
    add(wet, pad(notes, 1.3, cutoff=3400, attack=0.02, release=1.0), t_end, 1.1)
    for i, nm in enumerate(["G4", "C5", "E5", "G5", "C6"]):
        add(wet, pluck(hz(nm), 1.4, 0.7), t_end + i * 0.06, 0.12, (-0.4, 0.4)[i % 2])

    # sidechain: duck bass + wet bus on every kick
    t = np.arange(L) / SR
    sc = np.ones(L)
    for kt in kicks:
        i = int(kt * SR)
        w = min(L - i, int(0.35 * SR))
        sc[i : i + w] *= 1 - 0.5 * np.exp(-t[:w] / 0.11)
    bass *= sc
    wet *= sc

    wet_out = reverb(wet, seconds=2.0, mix=0.32, damp=6000)[:, :L]
    mix = drums * 0.95 + bass * 0.9 + wet_out
    mix = mix[:, : int(DUR * SR)]
    # gentle glue + limiting
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    rms = np.sqrt(np.mean(mix**2))
    mix *= 10 ** (-17 / 20) / rms
    peak = np.max(np.abs(mix))
    if peak > 0.89:
        mix = np.tanh(mix / peak * 1.4) / np.tanh(1.4) * 0.89
    fade = int(0.05 * SR)
    mix[:, -fade:] *= np.linspace(1, 0, fade)
    return mix


# ----------------------------------------------------------------------------- sfx
def sfx_whoosh(seconds=0.6, peak=0.2, f_lo=250, f_hi=3500):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    up = np.minimum(1, t / peak)
    centre = np.where(t < peak, f_lo * (f_hi / f_lo) ** up, f_hi * (f_lo * 2 / f_hi) ** ((t - peak) / (seconds - peak)))
    out = np.zeros((2, n))
    for c in range(2):
        x = noise(n)
        acc = np.zeros(n)
        for b in np.geomspace(f_lo, f_hi, 9):
            w = np.exp(-((np.log(b) - np.log(centre)) / 0.5) ** 2)
            acc += bp(x, b / 1.4, min(b * 1.4, SR / 2 - 100)) * w
        out[c] = acc
    amp = np.where(t < peak, up**2, np.exp(-(t - peak) / ((seconds - peak) / 4)))
    p = np.linspace(-0.7, 0.7, n)
    out[0] *= amp * np.cos((p + 1) * np.pi / 4)
    out[1] *= amp * np.sin((p + 1) * np.pi / 4)
    return normalize(out, -1)


def sfx_pop(f):
    t = tt(0.16)
    freq = f * (1 + 0.7 * np.exp(-t * 90))
    x = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 38)
    x += 0.2 * np.sin(2 * np.pi * np.cumsum(freq * 2) / SR) * np.exp(-t * 60)
    x += hp(noise(len(t)), 3000) * np.exp(-t * 900) * 0.25
    return normalize(x * np.minimum(1, t / 0.001), -1)


def sfx_notify(f1, f2):
    x = np.zeros(int(0.7 * SR))
    for i, f in enumerate((f1, f2)):
        b = bell(f, 0.55, 0.6)
        s = int(i * 0.075 * SR)
        x[s : s + len(b)] += b[: len(x) - s]
    return normalize(reverb(x, 0.6, 0.15)[:, : int(0.9 * SR)], -1)


def sfx_impact():
    t = tt(1.3)
    boom = np.sin(2 * np.pi * np.cumsum(32 + 60 * np.exp(-t * 14)) / SR) * np.exp(-t * 3.2)
    crunch = lp(noise(len(t)), 1800) * np.exp(-t * 14) * 0.6
    snap = bp(noise(len(t)), 300, 2500) * np.exp(-t * 70) * 0.8
    x = np.tanh(2.2 * (boom + crunch + snap))
    return normalize(reverb(x, 1.0, 0.18, 3000)[:, : int(1.6 * SR)], -1)


def sfx_buzz():
    out = np.zeros(int(0.42 * SR))
    for i, f in enumerate((233.08, 185.0)):
        n = int(0.13 * SR)
        sq = np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR))
        tone = lp(sq, 1800) * env(n, 0.004, 0, 0.02)
        s = int(i * 0.16 * SR)
        out[s : s + n] += tone
    return normalize(out, -1)


def sfx_freeze():
    t = tt(1.1)
    down = sine_sweep(900, 60, len(t)) * np.exp(-t * 2.5) * 0.7
    air = lp(noise(len(t)), 2500) * np.exp(-t * 6) * 0.3
    thud = np.sin(2 * np.pi * np.cumsum(40 + 50 * np.exp(-t * 20)) / SR) * np.exp(-t * 5)
    x = np.tanh(1.5 * (down + air + thud))
    return normalize(reverb(x, 1.4, 0.3, 2500)[:, : int(1.8 * SR)], -1)


def sfx_shimmer():
    n = int(2.0 * SR)
    x = np.zeros(n)
    notes = ["C6", "G6", "E6", "B6", "D7", "G6", "C7", "E7"]
    for i, nm in enumerate(notes):
        b = bell(hz(nm), 1.0, 0.4) * (0.9 - i * 0.07)
        s = int(i * 0.055 * SR)
        x[s : s + len(b)] += b[: n - s]
    air = hp(noise(n), 6000) * np.exp(-np.arange(n) / SR * 3) * 0.08
    return normalize(reverb(x + air, 2.2, 0.45, 9000)[:, : int(2.4 * SR)], -1)


def sfx_chime():
    n = int(1.2 * SR)
    x = np.zeros(n)
    for i, nm in enumerate(["C6", "E6", "G6", "C7"]):
        b = bell(hz(nm), 0.9, 0.7) * (1.0 if i < 3 else 0.5)
        s = int(i * 0.06 * SR)
        x[s : s + len(b)] += b[: n - s]
    return normalize(reverb(x, 1.2, 0.22, 8000)[:, : int(1.5 * SR)], -1)


def sfx_tick():
    t = tt(0.035)
    x = hp(noise(len(t)), 3500) * np.exp(-t * 700) + 0.5 * np.sin(2 * np.pi * 2800 * t) * np.exp(-t * 400)
    return normalize(x, -1)


def sfx_toggle():
    t = tt(0.2)
    click = lambda d: (t >= d) * hp(noise(len(t)), 2500) * np.exp(-np.maximum(0, t - d) * 600)  # noqa: E731
    blip = sine_sweep(700, 1300, len(t)) * np.exp(-t * 25) * 0.5
    return normalize(click(0) + 0.7 * click(0.045) + blip, -1)


def sfx_thump():
    t = tt(0.55)
    x = np.sin(2 * np.pi * np.cumsum(48 + 70 * np.exp(-t * 24)) / SR) * np.exp(-t * 7)
    x += hp(noise(len(t)), 2000) * np.exp(-t * 500) * 0.2
    return normalize(np.tanh(1.6 * x), -1)


def main():
    sfx_dir = os.path.join(PUBLIC, "sfx")
    effects = {
        "whoosh": sfx_whoosh(),
        "swoosh": sfx_whoosh(0.3, 0.07, 800, 6000),
        "pop-1": sfx_pop(hz("C5")),
        "pop-2": sfx_pop(hz("E5")),
        "pop-3": sfx_pop(hz("G5")),
        "notify-1": sfx_notify(hz("Bb5"), hz("E6")),
        "notify-2": sfx_notify(hz("A5"), hz("D#6")),
        "impact": sfx_impact(),
        "buzz": sfx_buzz(),
        "freeze": sfx_freeze(),
        "shimmer": sfx_shimmer(),
        "chime": sfx_chime(),
        "tick": sfx_tick(),
        "toggle": sfx_toggle(),
        "thump": sfx_thump(),
    }
    for name, x in effects.items():
        write_wav(os.path.join(sfx_dir, f"{name}.wav"), x)
        print(f"sfx/{name}.wav  {stereo(x).shape[1] / SR:.2f}s")

    music = make_music()
    tmp = os.path.join(PUBLIC, "music.tmp.wav")
    write_wav(tmp, music)
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", "192k", os.path.join(PUBLIC, "music.mp3")],
        check=True,
    )
    os.remove(tmp)
    print(f"music.mp3  {music.shape[1] / SR:.2f}s")


if __name__ == "__main__":
    main()
