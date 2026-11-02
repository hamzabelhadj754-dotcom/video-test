"""Mixes the voiceover with sound effects placed on the visual events.

Each cue is (effect, the moment its peak must land, gain dB, optional lowpass Hz).
Peak offsets were measured from the files, so the loudest part of each effect
sits exactly on the cut, landing or counter it belongs to. Usage: python3 mix.py
"""

import json
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
SFX = HERE / "assets/audio/sfx"
W = [w[0] for w in json.loads((HERE / "sfx/words.json").read_text())]
DUR = 46.0

PEAK = {
    "air-woosh": 0.71, "wind-swoosh": 0.30, "air-zoom": 0.45, "air-sweep": 0.32,
    "cinematic-wind": 0.43, "short-bass-hit": 0.08, "whoosh-deep-impact": 0.55,
    "drum-deep-impact": 0.16, "movie-impact-intro": 1.17, "trailer-riser": 2.53,
    "logo-intro-impact": 4.44, "tape-rewind": 1.35, "click-box-check": 0.10,
    "classic-click": 0.13,
}

CUES = [
    # hook: low drift under the opening, riser into "Here's why", then the flight
    ("cinematic-wind", 0.55, -20, 2500),
    ("short-bass-hit", W[8], -13, 1200),
    ("air-zoom", 4.62, -14, None),
    ("drum-deep-impact", W[10], -17, 1800),
    # 01: counters and fills get tiny ticks
    ("click-box-check", W[11] - 0.05, -22, None),
    ("classic-click", W[16] + 0.1, -21, None),
    ("click-box-check", W[17], -20, None),
    ("air-sweep", W[18] + 0.25, -24, 6000),
    ("classic-click", W[20], -22, None),
    ("short-bass-hit", W[29], -16, 1500),
    # flight to 02 (swing right)
    ("air-woosh", 14.12, -15, None),
    ("drum-deep-impact", W[32] + 0.05, -17, 1800),
    ("click-box-check", W[33], -22, None),
    ("click-box-check", W[36], -22, None),
    ("click-box-check", W[37], -22, None),
    ("click-box-check", W[38], -21, None),
    ("air-sweep", W[46] + 0.4, -24, 5000),  # the progress collapses
    ("wind-swoosh", W[52] + 0.2, -19, 7000),  # push to the mirror
    # flight to 03 (crane up)
    ("air-zoom", 23.45, -15, None),
    ("drum-deep-impact", W[57] + 0.05, -17, 1800),
    ("classic-click", W[62] + 0.75, -20, None),
    ("air-sweep", W[69] + 0.6, -25, 6000),
    # flight to 04 (swing left)
    ("air-woosh", 30.66, -15, None),
    ("drum-deep-impact", W[72] + 0.05, -17, 1800),
    ("wind-swoosh", W[73], -21, 6000),
    ("classic-click", W[76], -21, None),
    ("click-box-check", W[88], -20, None),
    # finale
    ("air-zoom", 37.15, -15, None),
    ("short-bass-hit", W[94], -17, 1200),
    ("short-bass-hit", W[95], -15, 900),
    ("wind-swoosh", 44.95, -18, 7000),
    ("short-bass-hit", 45.08, -15, 1200),
]


def main() -> None:
    inputs = ["-i", str(HERE / "assets/audio/voiceover.mp3")]
    chains = ["[0:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0dB[v]"]
    labels = ["[v]"]
    for n, (name, at, gain, lp) in enumerate(CUES, start=1):
        start = at - PEAK[name]
        trim = 0.0
        if start < 0:
            trim, start = -start, 0.0
        inputs += ["-i", str(SFX / f"{name}.mp3")]
        f = f"[{n}:a]aformat=sample_rates=44100:channel_layouts=stereo"
        if trim:
            f += f",atrim=start={trim:.3f},asetpts=PTS-STARTPTS"
        if lp:
            f += f",lowpass=f={lp}"
        f += f",volume={gain}dB,afade=t=out:st=3.5:d=1.5,adelay={int(start * 1000)}|{int(start * 1000)}[s{n}]"
        chains.append(f)
        labels.append(f"[s{n}]")
    graph = ";".join(chains)
    graph += f";{''.join(labels)}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,"
    graph += f"apad,atrim=0:{DUR},loudnorm=I=-15:TP=-1.5:LRA=9[out]"
    out = HERE / "renders/mix.m4a"
    out.parent.mkdir(exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-loglevel", "error", *inputs, "-filter_complex", graph,
         "-map", "[out]", "-ar", "44100", "-c:a", "aac", "-b:a", "256k", str(out)],
        check=True,
    )
    print(f"{len(CUES)} cues -> {out}")


if __name__ == "__main__":
    main()
