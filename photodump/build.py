"""Gains Dom "photo dump": the rapid aesthetic slideshow format.

Dozens of dark photos, each on screen for a few frames, one tiny lowercase
line of text the whole time, and a last photo that equals the first, so the
loop is invisible and people rewatch to catch the images.

Usage:
  python3 photodump/build.py LIST.txt OUT.mp4 --text "winter arc. see you in spring."

LIST.txt holds one image path per line, in order (# comments allowed). The
first image is appended again at the end to close the loop.
"""

import argparse
import random
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1080, 1920
FONT = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"


def frame_for(path: Path, rng: random.Random, brightness: float = 0.8) -> Image.Image:
    img = Image.open(path).convert("RGB")
    a = img.width / img.height
    canvas = Image.new("RGB", (W, H), (0, 0, 0))
    if a <= 0.7:
        # Portrait photos fill the frame (cover, centre crop).
        s = max(W / img.width, H / img.height)
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
        x = (img.width - W) // 2
        y = (img.height - H) // 2
        canvas.paste(img.crop((x, y, x + W, y + H)))
    else:
        # Wider photos keep their shape, full width, centred on black.
        h = round(W / a)
        img = img.resize((W, h), Image.LANCZOS)
        canvas.paste(img, (0, (H - h) // 2))
    # Dark, desaturated grade.
    canvas = ImageEnhance.Color(canvas).enhance(0.35)
    canvas = ImageEnhance.Brightness(canvas).enhance(brightness)
    canvas = ImageEnhance.Contrast(canvas).enhance(1.08)
    # Fine grain, seeded, so every build is identical.
    noise = Image.frombytes("L", (W // 2, H // 2), rng.randbytes((W // 2) * (H // 2)))
    noise = noise.resize((W, H)).filter(ImageFilter.GaussianBlur(0.6))
    grain = Image.merge("RGB", (noise, noise, noise))
    canvas = Image.blend(canvas, grain, 0.035 + rng.random() * 0.01)
    return canvas


def draw_text(img: Image.Image, text: str, size: int, y: float) -> None:
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, size)
    tw = d.textlength(text, font=font)
    x = (W - tw) / 2
    ty = H * y - size / 2
    d.text((x + 1, ty + 2), text, font=font, fill=(0, 0, 0))
    d.text((x, ty), text, font=font, fill=(245, 245, 245))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("list")
    ap.add_argument("out")
    ap.add_argument("--text", default="")
    ap.add_argument("--text-size", type=int, default=30)
    ap.add_argument("--text-y", type=float, default=0.5)
    ap.add_argument("--frames", type=int, default=3, help="frames per photo at 30 fps")
    ap.add_argument("--brightness", type=float, default=0.8, help="grade brightness (darker photo sets want ~0.9)")
    args = ap.parse_args()

    paths = [
        Path(line.strip())
        for line in Path(args.list).read_text().splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    paths.append(paths[0])  # close the loop
    rng = random.Random(7)
    with tempfile.TemporaryDirectory() as tmp:
        for i, p in enumerate(paths):
            f = frame_for(p, rng, args.brightness)
            if args.text:
                draw_text(f, args.text, args.text_size, args.text_y)
            f.save(f"{tmp}/{i:04d}.png")
        fps_in = 30 / args.frames
        subprocess.run(
            [
                "ffmpeg", "-nostdin", "-y", "-loglevel", "error",
                "-framerate", f"{fps_in}", "-i", f"{tmp}/%04d.png",
                "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "16",
                "-preset", "slow", "-movflags", "+faststart", args.out,
            ],
            check=True,
        )
    print(f"{len(paths)} photos ({len(paths) - 1} + loop) -> {args.out}")


if __name__ == "__main__":
    main()
