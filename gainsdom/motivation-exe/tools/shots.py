"""Cut, frame and grade every footage shot of the film into a JPEG sequence the canvas can draw (assets/shots/<name>/NNN.jpg)
and write assets/shots/shots.js (frame counts and sizes for film.js).

Look (Brand Bible v2, 11.3, matched to the reference pins: dark gym, crushed blacks, blown practical lights, grain):
black & white, high contrast, crushed blacks, soft highlights. Action shots add a long-exposure ghost trail (a running
average of the last frames, kept only where it is brighter: the "drag shutter" look).
Sources: Mixkit (free license, commercial use, no attribution needed) — see assets/LICENSES.md.
Usage (from the film folder): python3 tools/shots.py [name ...]
"""
import json, os, subprocess, sys, shutil

FPS = 30
# name: (source id, in (s), duration in film (s), box, fit, focus x, focus y, brightness, speed, trail)
#   box  'full' = 1080x1920 · 'view' = 828x466 (the installer's viewport)
#   fit  'cover' fills the box (crop at focus) · 'fitw:<w>' scales the frame to width w on black (black-background clips)
SHOTS = {
    'phone':  (14669, 1.5, 1.35, 'full', 'cover', .60, .5, -.10, 1.0, False),
    'clock':  (28900, 3.63, .70, 'full', 'fitw:1560', .5, .5, -.02, 1.0, False),
    'rain':   (2846, 6.0, .40, 'full', 'cover', .45, .5, -.06, 1.0, False),
    'glass':  (28901, 3.0, .90, 'full', 'cover', .5, .5, -.02, .6, False),
    'dial':   (28886, 2.0, 1.35, 'full', 'cover', .55, .5, -.12, 1.0, False),
    'vlamp':  (1793, 1.0, 1.35, 'view', 'cover', .5, .78, -.04, 1.0, False),
    'valarm': (28883, 1.0, .70, 'view', 'cover', .5, .40, -.02, 1.0, False),
    'vpush':  (11765, 9.6, .70, 'view', 'cover', .5, .45, -.02, 1.0, False),
    'vwatch': (32808, 1.0, 1.35, 'view', 'cover', .5, .42, -.04, 1.0, False),
    'vgym':   (52092, 3.0, 1.35, 'view', 'cover', .5, .5, .02, 1.0, False),
    'a1':     (47891, 2.0, .40, 'full', 'cover', .55, .5, -.04, 1.0, True),
    'a2':     (45874, 3.0, .40, 'full', 'cover', .42, .5, .00, 1.0, True),
    'a3':     (8987, 2.0, .40, 'full', 'cover', .52, .5, -.06, 1.0, True),
    'a4':     (52094, 4.0, .45, 'full', 'cover', .42, .5, .04, 1.0, True),
}
BOX = {'full': (1080, 1920), 'view': (828, 466)}
GRADE = "hue=s=0,eq=contrast=1.28:brightness={b}:gamma=0.92,curves=all='0/0 0.12/0.03 0.5/0.47 0.9/0.86 1/0.94'"

def probe(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path]).decode()
    w, h = out.strip().split(',')[:2]
    return int(w), int(h)

def build(name):
    sid, tin, dur, box, fit, fx, fy, b, speed, trail = SHOTS[name]
    src = f'assets/src/{sid}.mp4'; W, H = BOX[box]; sw, sh = probe(src)
    if fit == 'cover':
        k = max(W / sw, H / sh); vw, vh = round(sw * k / 2) * 2, round(sh * k / 2) * 2
        x = min(max(0, round(vw * fx - W / 2)), vw - W); y = min(max(0, round(vh * fy - H / 2)), vh - H)
        frame = f"scale={vw}:{vh}:flags=lanczos,crop={W}:{H}:{x}:{y}"
    else:
        tw = int(fit.split(':')[1]); th = round(sh * tw / sw / 2) * 2
        frame = f"scale={tw}:{th}:flags=lanczos,pad=max({tw}\\,{W}):max({th}\\,{H}):(ow-iw)/2:(oh-ih)/2:black,crop={W}:{H}"
    mix = 'colorchannelmixer=rr=1:rg=0:rb=0:gr=1:gg=0:gb=0:br=1:bg=0:bb=0,' if name == 'clock' else ''   # red LED digits: luminance from red
    chain = f"setpts=PTS/{speed},fps={FPS},{mix}{frame},{GRADE.format(b=b)}"
    if trail:   # long-exposure ghost: the average of the last 8 frames, kept where it is brighter than the live frame
        chain += ",split[a][b];[b]tmix=frames=8[t];[a][t]blend=all_expr='max(A\\,B*0.92)',unsharp=5:5:0.4"
    lead = 8 / FPS if trail else 0          # start earlier so the trail is already built on the first frame
    out = f'assets/shots/{name}'; shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    n = round(dur * FPS)
    subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-ss', str(max(0, tin - lead * speed)), '-i', src, '-t', str((dur + lead) * speed + .2),
                           '-filter_complex', chain, '-q:v', '3', '-start_number', '0', f'{out}/%03d.jpg'])
    if trail:   # drop the lead-in frames
        k0 = round(lead * FPS); files = sorted(os.listdir(out))
        for f in files[:k0]: os.remove(f'{out}/{f}')
        for i, f in enumerate(sorted(os.listdir(out))): os.rename(f'{out}/{f}', f'{out}/{i:03d}.jpg')
    files = sorted(os.listdir(out))
    for f in files[n:]: os.remove(f'{out}/{f}')
    return dict(n=min(n, len(files)), w=W, h=H, fps=FPS)

if __name__ == '__main__':
    names = sys.argv[1:] or list(SHOTS)
    meta_path = 'assets/shots/shots.js'
    meta = {}
    if os.path.exists(meta_path): meta = json.loads(open(meta_path).read().split('=', 1)[1].rstrip(';\n'))
    for n in names:
        meta[n] = build(n); print(n, meta[n])
    open(meta_path, 'w').write('var SHOTS = ' + json.dumps(meta) + ';\n')
