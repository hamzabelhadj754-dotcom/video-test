"""Preview one scene fast: mounts compositions/<scene>.html in a bare page (same head scripts as index.html),
seeks its timeline with events on, and screenshots each requested GLOBAL time into a contact sheet.
usage: python tools/scene_shot.py s3-fibre s3 12.097 12.2,13.9,16 out.png   (needs: python -m http.server 8765 in this folder)"""
import sys, os, json, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scene, key, start, times, out = sys.argv[1:6]
head = open(os.path.join(ROOT, 'index.html')).read().split('<style>')[0]
inner = open(os.path.join(ROOT, f'compositions/{scene}.html')).read().replace('<template>', '').replace('</template>', '')
page = head + '<style>html,body{margin:0;background:#08090B}</style></head><body><script>window.__timelines={};</script><div id="stage" style="position:relative;width:1080px;height:1920px;overflow:hidden">' + inner + '</div></body></html>'
open(os.path.join(ROOT, f'_shot-{scene}.html'), 'w').write(page)
js = r'''
const { chromium } = require('playwright');
(async () => { const [url, key, start, times, out] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(url, { waitUntil: 'load' }); await p.evaluate(async () => { await document.fonts.ready; await Promise.all(Object.values((window.__hf||{}).buildReady||{})); });
  const files = [];
  for (const t of times.split(',')) { await p.evaluate(([k, lt]) => { window.__timelines[k].seek(lt, false); return null; }, [key, +t - +start]);
    const f = out.replace('.png', `_${t}.png`); await (await p.$('#stage')).screenshot({ path: f }); files.push(f); }
  console.log(files.join('\n')); await b.close(); })();
'''
jsf = '/tmp/_scene_shot.js'; open(jsf, 'w').write(js)
res = subprocess.run(['node', jsf, f'http://127.0.0.1:8765/_shot-{scene}.html', key, start, times, out], capture_output=True, text=True, env={**os.environ, 'NODE_PATH': subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()})
print(res.stderr[-2000:]); files = [l for l in res.stdout.split('\n') if l.endswith('.png')]
n = len(files); cols = min(n, 6)
inputs = sum([['-i', f] for f in files], [])
layout = '|'.join(f'{(i % cols) * 360}_{(i // cols) * 640}' for i in range(n))
flt = ''.join(f'[{i}]scale=360:640[v{i}];' for i in range(n)) + ''.join(f'[v{i}]' for i in range(n)) + (f'xstack=inputs={n}:layout={layout}' if n > 1 else 'null')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', flt, out])
for f in files: os.remove(f)
os.remove(os.path.join(ROOT, f'_shot-{scene}.html'))
print(out)
