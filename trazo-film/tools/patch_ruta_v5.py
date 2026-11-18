"""v05: remove the departures board and the 2.6 s VO pause; shift every later literal time by -2.6 s."""
import re
p = 'src/film7.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:100]
    s = s.replace(a, b, 1)


# ---- remove board element, station dot, tweens, flap logic, hold, rider keys
a = s.index('    <div class="w board" id="board"'); b = s.index('    <!-- ===== 04 · SMART')
s = s[:a] + s[b:]
rep("  st += dot(9300, 300, 30, 'sd sdb');\n", "")
rep("  pop('.sdb', 45.7);\n", "")
s = re.sub(r"  tl\.fromTo\('#board'.*?\n", "", s)
s = re.sub(r"  \{ const col = \{\}; FLAPS\.forEach.*?\n", "", s)
rep("  leave(['#board'], 48.8);\n", "")
s = re.sub(r"    // split-flap board\n    if \(t > 45\.5 && t < 50\).*?\}\); \}\n", "", s, flags=re.S)
rep("    [46.1, 48.9, 9300, -60, .9, 9330, -60, .92, 0],\n", "")
rep("RK.push([46.0, Lat(9300, 300)], [48.9, Lat(9300, 300)], [V(45.84)", "RK.push([V(45.84)")
assert 'flapEls.forEach' not in s.split('window.seek')[1], 'flap code still in seek'

# ---- VO without pause
rep("const V = x => x < 42.9 ? x + 3.4 : x + 6.0;", "const V = x => x + 3.4;")

# ---- shift literal times >= 45.5 by -2.6 inside the script (only numbers used as times: decimal literals and the final 99)
head, script = s.split('<script>', 1)
SKIP = {'1.35'}  # RHO and friends are < 45 anyway


def shift(m):
    txt = m.group(0)
    v = float(txt)
    if 45.5 <= v <= 99.0:
        return f"{v - 2.6:.2f}".rstrip('0').rstrip('.')
    return txt


# time literals appear as: tl positions (", 76.2)"), holds ("[50.0, 51.2,"), keys ("[63.4, "), CH ("[49.08, "), comparisons ("t < 92.3"), DUR
pat = re.compile(r"(?<![\w.#(-])(\d{2}\.\d+)(?![\w%])")
lines = script.split('\n')
for i, ln in enumerate(lines):
    if any(k in ln for k in ('rgba', 'Lat(', 'createLinearGradient', 'letter-spacing')) and not ln.lstrip().startswith(('[', 'RK.push', '[V(')):
        continue
    lines[i] = pat.sub(lambda m: shift(m), ln)
script = '\n'.join(lines)
script = script.replace("[93.4, 99, 9900", "[90.8, 96.4, 9900").replace("[90.8, 99, 9900", "[90.8, 96.4, 9900")
script = script.replace("const DUR = 96.4;", "const DUR = 96.4;")
s = head + '<script>' + script

# ---- Gestión hold lasts until "garantías" lands; the last function exits with it
rep("FT[i + 1] ? FT[i + 1][0] - .9 : 45.1,", "FT[i + 1] ? FT[i + 1][0] - .9 : 45.9,")
rep("FT.forEach((f, i) => leave([`#fp${i}`], FT[i + 1] ? FT[i + 1][0] - 1.0 : 45.0));", "FT.forEach((f, i) => leave([`#fp${i}`], FT[i + 1] ? FT[i + 1][0] - 1.0 : 45.75));")
rep("RK.push([(FT[i + 1] ? FT[i + 1][0] - .9 : 45.1), Lat(STOPX[i], 300)]);", "RK.push([(FT[i + 1] ? FT[i + 1][0] - .9 : 45.9), Lat(STOPX[i], 300)]);")
open(p, 'w').write(s)
print('ok')
