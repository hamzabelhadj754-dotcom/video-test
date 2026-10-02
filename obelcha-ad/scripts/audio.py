#!/usr/bin/env python3
"""Build the ad soundtrack from timeline.json.

  python3 scripts/audio.py            -> audio/mix.wav (+ stems, vo_report.json)
  python3 scripts/audio.py --no-vo    -> captions-only mix (music + sfx)

Everything is synthesized locally and deterministically (seeded RNG):
  * VO   : Spanish (es_ES) neural TTS via sherpa-onnx + Piper 'sharvard' voice,
           auto-tightened per line so it always ends before its maxEnd.
  * SFX  : drop, whoosh, air, impact, shimmer, tick, chime (additive / filtered noise).
  * Music: assets/music.mp3 if present, else a synth pad placeholder; normalised
           to timeline.audio.music.lufs (-18 LUFS) and ducked under the VO.
  * Master: integrated loudness -> targetLUFS, true-peak ceiling via soft limiter.
"""
import json, os, sys, subprocess, math
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, 'timeline.json')))
A = TL['audio']
SR = A['sampleRate']
DUR = TL['meta']['duration']
N = int(round(DUR * SR))
RNG = np.random.default_rng(TL['meta']['seed'])
OUT = os.path.join(ROOT, 'audio')
os.makedirs(OUT, exist_ok=True)
TTS_DIR = os.environ.get('OBELCHA_TTS_DIR', os.path.join(ROOT, '.cache', 'tts'))
NO_VO = '--no-vo' in sys.argv

db = lambda x: 10 ** (x / 20)
tt = lambda d: np.arange(int(d * SR)) / SR


def place(buf, x, t, gain_db=0.0):
    """Add mono/stereo x into stereo buf at time t."""
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    i = int(round(t * SR))
    if i < 0:
        x = x[-i:]; i = 0
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[: j - i] * db(gain_db)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x, axis=0)


def reverb(x, secs=1.4, mix=0.25, tone=5000):
    """Small stereo convolution reverb with a seeded exponential-noise IR."""
    n = int(secs * SR)
    env = np.exp(-np.arange(n) / SR * (6.9 / secs))
    irs = [lp(RNG.standard_normal(n) * env, tone) for _ in range(2)]
    irs = [ir / np.sqrt(np.sum(ir ** 2)) for ir in irs]
    mono = x if x.ndim == 1 else x.mean(1)
    wet = np.stack([signal.fftconvolve(mono, ir)[: len(mono) + n] for ir in irs], 1)
    dry = np.zeros_like(wet); dry[: len(mono)] = np.stack([mono, mono], 1)
    return dry * (1 - mix) + wet * mix * 0.6


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


# ---------------- SFX ----------------
def sfx_drop():
    t = tt(0.25)
    f = 520 + 1100 * np.exp(-t * 60)
    plip = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    t2 = tt(0.35)
    thump = np.sin(2 * np.pi * (70 + 60 * np.exp(-t2 * 25)) * t2) * np.exp(-t2 * 14) * 0.7
    x = np.zeros(int(0.35 * SR)); x[: len(plip)] += plip; x += thump
    return norm(reverb(x, 1.2, 0.3))


def sfx_whoosh(d):
    n = int(d * SR); t = np.arange(n) / SR; k = t / d
    noise = RNG.standard_normal(n)
    # sweep: process in blocks with a moving band
    out = np.zeros(n); blk = 1024
    for s in range(0, n, blk):
        c = 300 + 2600 * math.sin(math.pi * min(1, (s + blk / 2) / n)) ** 2
        seg = noise[s:s + blk]
        out[s:s + blk] = bp(np.concatenate([np.zeros(256), seg]), c * 0.6, min(c * 1.6, SR / 2 - 100))[256:]
    env = np.sin(np.pi * k) ** 2.2
    pan = 0.5 + 0.4 * np.sin(np.pi * (k - 0.5))
    x = out * env
    return norm(np.stack([x * (1 - pan), x * pan], 1) * 1.4)


def sfx_air(d):
    n = int(d * SR); k = np.arange(n) / n
    x = hp(RNG.standard_normal(n), 2500) * (k ** 2) * (1 - k ** 8)
    return norm(x)


def sfx_impact():
    t = tt(1.2)
    sub = np.sin(2 * np.pi * np.cumsum(48 + 70 * np.exp(-t * 9)) / SR) * np.exp(-t * 3.2)
    burst = lp(RNG.standard_normal(len(t)), 900) * np.exp(-t * 22) * 0.6
    tone = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(220, .12), (330, .08), (440, .05)]) * np.exp(-t * 2.5)
    return norm(reverb(sub + burst + tone, 2.2, 0.35, 3500))


def sfx_shimmer(d):
    t = tt(d)
    x = np.zeros(len(t)); k = t / d
    for i in range(9):
        f = 2400 + RNG.random() * 4200
        ph = RNG.random() * 6.28
        x += np.sin(2 * np.pi * f * t + ph) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + i) * t + ph))
    x *= np.sin(np.pi * k) ** 2
    return norm(reverb(x, 1.6, 0.45, 9000))


def sfx_tick():
    t = tt(0.3)
    x = (np.sin(2 * np.pi * 2350 * t) + 0.5 * np.sin(2 * np.pi * 3720 * t)) * np.exp(-t * 30)
    return norm(reverb(x, 0.9, 0.3, 8000))


def sfx_chime():
    t = tt(3.0)
    f0 = 1046.5  # C6
    x = np.zeros(len(t))
    for r, a, dcy in [(1, 1, 1.6), (2.0, .35, 2.6), (2.76, .25, 3.2), (4.07, .12, 4.5), (5.4, .06, 6)]:
        x += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * dcy)
    x += 0.5 * np.sin(2 * np.pi * 523.25 * t) * np.exp(-t * 1.2)
    x *= 1 - np.exp(-t * 400)
    return norm(reverb(x, 2.8, 0.4, 9000))


def build_sfx():
    buf = np.zeros((N + SR * 4, 2))
    for c in A['sfx']:
        typ = c['type']
        x = {'drop': sfx_drop, 'impact': sfx_impact, 'tick': sfx_tick, 'chime': sfx_chime}.get(typ)
        x = x() if x else {'whoosh': sfx_whoosh, 'airRise': sfx_air, 'shimmer': sfx_shimmer}[typ](c.get('dur', 1.0))
        place(buf, x, c['t'], c['gain'])
    return buf[:N]


# ---------------- music ----------------
def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def pad_voice(f, d, bright=0.5):
    t = tt(d)
    x = np.zeros(len(t))
    for det in (-0.07, 0.0, 0.06):
        ff = f * 2 ** (det / 12)
        for h in range(1, 7):
            x += np.sin(2 * np.pi * ff * h * t + h) * (1 / h ** (1.6 - bright * 0.6))
    return x


def synth_pad():
    # (start, end, root, chord tones) — follows the scene arc
    prog = [(0.0, 2.3, 38, [50, 57, 64]),           # D drone + 9 (hook)
            (1.8, 6.3, 35, [50, 54, 57, 61]),      # Bm9 (tension)
            (5.9, 12.3, 38, [54, 57, 61, 64]),     # Dmaj9 (reveal)
            (11.9, 16.3, 31, [50, 54, 59, 62]),    # Gmaj7 (benefits)
            (15.9, 20.0, 38, [50, 57, 61, 64, 66])]  # Dmaj9(6) (cta)
    buf = np.zeros(N)
    for s, e, root, tones in prog:
        d = e - s; t = tt(d)
        env = np.minimum(1, t / 0.7) * np.minimum(1, (d - t) / 0.7)
        x = 0.9 * np.sin(2 * np.pi * midi(root) * t) + 0.3 * np.sin(2 * np.pi * midi(root + 12) * t)
        for m in tones:
            x += 0.35 * pad_voice(midi(m), d)
        x *= env
        i = int(s * SR); buf[i:i + len(x)] += x[: N - i]
    buf = lp(buf, 2200, 4)
    st = np.stack([buf, np.roll(buf, int(0.011 * SR))], 1)
    return reverb(st, 3.0, 0.35, 4000)[:N]


def load_music():
    p = os.path.join(ROOT, A['music']['file'])
    if os.path.exists(p):
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
        x = np.pad(x, ((0, max(0, N - len(x))), (0, 0)))[:N]
        return x, 'assets/music.mp3'
    return synth_pad(), 'synth placeholder pad'


# ---------------- VO ----------------
def tts_engine():
    import sherpa_onnx
    v = TL['vo']['voice']
    if v['engine'] == 'kokoro':
        d = os.path.join(TTS_DIR, v['model'])
        if not os.path.exists(d):
            return None
        m = sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=f'{d}/model.onnx', voices=f'{d}/voices.bin', tokens=f'{d}/tokens.txt', data_dir=f'{d}/espeak-ng-data',
            dict_dir=f'{d}/dict', lexicon=f'{d}/lexicon-us-en.txt', lang='es'), num_threads=4)
    else:  # piper / vits
        d = os.path.join(TTS_DIR, 'vits-piper-' + v['model'])
        if not os.path.exists(d):
            return None
        m = sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(
            model=f"{d}/{v['model']}.onnx", tokens=f'{d}/tokens.txt', data_dir=f'{d}/espeak-ng-data',
            noise_scale=0.55, noise_scale_w=0.4), num_threads=4)
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=m))


def trim(x, thr=0.01):
    idx = np.where(np.abs(x) > thr * np.max(np.abs(x)))[0]
    return x[max(0, idx[0] - int(0.01 * SR)): idx[-1] + int(0.04 * SR)] if len(idx) else x


def build_vo():
    """Lines are cached in audio/vo_cache (keyed by text+voice+speed) so re-renders are
    bit-identical; delete the cache or pass --regen-vo to re-synthesize."""
    import hashlib
    v = TL['vo']['voice']
    cache = os.path.join(OUT, 'vo_cache'); os.makedirs(cache, exist_ok=True)
    eng = None
    def synth(text, speed):
        nonlocal eng
        key = hashlib.sha1(f"{v['model']}|{v['speaker']}|{text}|{speed:.2f}".encode()).hexdigest()[:12]
        fn = os.path.join(cache, f'{key}.wav')
        if os.path.exists(fn) and '--regen-vo' not in sys.argv:
            return sf.read(fn)[0]
        if eng is None:
            eng = tts_engine()
            if eng is None:
                return None
        a = eng.generate(text, sid=v['speaker'], speed=speed)
        x = trim(signal.resample_poly(np.array(a.samples, dtype=np.float64), SR, a.sample_rate))
        sf.write(fn, x.astype(np.float32), SR)
        return x
    buf = np.zeros((N + SR * 3, 2)); rep = []
    prev_end = 0.0
    tol = TL['vo'].get('tolerance', 0.15)
    for ln in TL['vo']['lines']:
        start = max(ln['t'], prev_end + 0.06)
        room = ln['maxEnd'] + tol - start
        for speed in (1.0, 1.05, 1.1, 1.15):
            x = synth(ln['say'], speed / v['lengthScale'])
            if x is None:
                print('! TTS model not found in', TTS_DIR, '— run scripts/setup_tts.sh; building captions-only mix')
                return None, []
            if len(x) / SR <= room:
                break
        x = hp(x, 90)
        x = x + 0.25 * bp(x, 2500, 6000)
        env = np.maximum(np.abs(x), 1e-6)
        g = np.minimum(1, (0.35 / env) ** 0.35)
        g = signal.sosfiltfilt(signal.butter(1, 30, fs=SR, output='sos'), g)
        x = norm(x * g, 0.9)
        place(buf, x, start)
        d = len(x) / SR
        prev_end = start + d
        fits = prev_end <= ln['maxEnd'] + tol + 1e-3
        rep.append({'id': ln['id'], 'say': ln['say'], 'start': round(start, 3), 'end': round(prev_end, 3), 'maxEnd': ln['maxEnd'],
                    'speed': speed, 'fits': fits})
        print(f"  VO {ln['id']}: {start:.2f}-{prev_end:.2f}s (limit {ln['maxEnd']:.2f}+{tol}, speed {speed:.2f}) {'OK' if fits else 'TOO LONG'}")
    return buf[:N], rep


# ---------------- mix ----------------
def lufs(x):
    return pyln.Meter(SR).integrated_loudness(x)


def limiter(x, ceiling_db):
    """Look-ahead brickwall: gain = moving-average(min-filter(required gain)) on a 4x-oversampled peak envelope."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    c = db(ceiling_db) * 0.98
    up = np.abs(signal.resample_poly(x, 4, 1, axis=0)).max(1)
    pk = up[: len(x) * 4].reshape(-1, 4).max(1)
    need = np.minimum(1, c / np.maximum(pk, 1e-9))
    w = int(0.005 * SR) | 1
    g = uniform_filter1d(minimum_filter1d(need, 2 * w + 1), w)
    rel = int(0.08 * SR)
    g = np.minimum(g, uniform_filter1d(minimum_filter1d(need, rel), rel))  # slower release, no pumping
    y = x * g[:, None]
    tp = np.max(np.abs(signal.resample_poly(y, 4, 1, axis=0)))
    return y * min(1, db(ceiling_db) / tp)


def main():
    print('Building SFX…'); sfx = build_sfx()
    print('Building music…'); music, msrc = load_music()
    m_l = lufs(music); music *= db(A['music']['lufs'] - m_l)
    vo, rep = (None, []) if NO_VO else build_vo()
    # duck music under VO
    if vo is not None:
        env = np.abs(vo).max(1)
        env = signal.sosfiltfilt(signal.butter(1, 6, fs=SR, output='sos'), (env > 0.02).astype(float))
        duck = db(A['music']['duckDb'] * np.clip(env * 1.5, 0, 1))
        music *= duck[:, None]
    fo0, fo1 = A['music']['fadeOut']
    t = np.arange(N) / SR
    music *= np.clip((fo1 - t) / (fo1 - fo0), 0, 1)[:, None] ** 1.5
    mix = sfx + music + (vo if vo is not None else 0)
    mix *= np.clip(t / 0.01, 0, 1)[:, None]
    pre = mix.copy(); g = A['targetLUFS'] - lufs(mix)
    for _ in range(4):  # limiter eats loudness on peaky VO: iterate the make-up gain
        mix = limiter(pre * db(g), A['truePeak'])
        err = A['targetLUFS'] - lufs(mix)
        if abs(err) < 0.2:
            break
        g += err
    name = 'mix.wav' if vo is not None else 'mix_novo.wav'
    sf.write(os.path.join(OUT, name), mix.astype(np.float32), SR, subtype='PCM_24')
    sf.write(os.path.join(OUT, 'stem_sfx.wav'), sfx.astype(np.float32), SR)
    sf.write(os.path.join(OUT, 'stem_music.wav'), music.astype(np.float32), SR)
    if vo is not None:
        sf.write(os.path.join(OUT, 'stem_vo_es.wav'), vo.astype(np.float32), SR)
    final = lufs(mix)
    report = {'music_source': msrc, 'music_lufs_before_duck': A['music']['lufs'], 'mix_lufs': round(final, 2),
              'vo': rep, 'vo_fits_all': all(r['fits'] for r in rep) if rep else None}
    json.dump(report, open(os.path.join(OUT, 'audio_report.json'), 'w'), indent=2, ensure_ascii=False)
    print(f'✓ audio/{name}: {final:.1f} LUFS, music={msrc}')


if __name__ == '__main__':
    main()
