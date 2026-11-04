"""Builds the three style-test variants from template.html.

  textured/  restrained texture (paper 5 %, grain 6 %, scan lines, dust, ink edges)
  clean/     almost no texture (grain 1.5 %, no scan lines, no dust, clean type edges)
  safe/      textured + the mobile safe-area overlay (preview only)
"""

import shutil
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE.parent  # first-10 project: fonts, gsap
TPL = (HERE / "template.html").read_text()

SAFE = """
      <div id="safeO" class="abs" style="width: 1080px; height: 1920px; z-index: 50">
        <div class="safe" style="left: 0; top: 0; width: 1080px; height: 240px">Top danger zone · 0–240</div>
        <div class="safe" style="left: 850px; top: 240px; width: 230px; height: 1330px; writing-mode: vertical-rl">Right side · like / comment / share</div>
        <div class="safe" style="left: 0; top: 1570px; width: 1080px; height: 350px">Bottom danger zone · caption / username · 1570–1920</div>
        <div style="position: absolute; left: 110px; top: 360px; width: 690px; height: 1040px; border: 2px solid #2fe3b4"></div>
        <div style="position: absolute; left: 118px; top: 366px; color: #2fe3b4; font: 600 22px Inter; letter-spacing: 0.12em">PRIMARY TEXT · x 110–800 · y 360–1400</div>
      </div>"""

VARIANTS = {
    "textured": {"vars": "--paper: 0.05; --grain: 0.06; --scan: 1; --dust: 1", "ink": "true", "safe": ""},
    "clean": {"vars": "--paper: 0.012; --grain: 0.015; --scan: 0; --dust: 0", "ink": "false", "safe": ""},
    "safe": {"vars": "--paper: 0.05; --grain: 0.06; --scan: 1; --dust: 1", "ink": "true", "safe": SAFE},
}

for name, v in VARIANTS.items():
    d = HERE / name
    d.mkdir(exist_ok=True)
    for f in ["hyperframes.json", "package.json", ".gitignore"]:
        shutil.copy(SRC / f, d / f)
    (d / "meta.json").write_text('{"id":"first-10-test-%s","name":"first-10-test-%s"}\n' % (name, name))
    if not (d / "assets").exists():
        (d / "assets").mkdir()
        shutil.copytree(SRC / "assets/fonts", d / "assets/fonts")
        shutil.copytree(SRC / "assets/lib", d / "assets/lib")
    html = TPL.replace("/*INK*/", v["ink"]).replace("<!--SAFE-->", v["safe"])
    html = html.replace('<div id="root" data-composition-id="main"', f'<div id="root" style="{v["vars"]}" data-composition-id="main"', 1)
    (d / "index.html").write_text(html)
    print("built", name)
