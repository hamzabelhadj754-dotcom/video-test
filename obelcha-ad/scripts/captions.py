#!/usr/bin/env python3
"""Export SRT captions (ES/EN/FR) from timeline.json -> out/captions/."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, 'timeline.json')))
out = os.path.join(ROOT, 'out', 'captions'); os.makedirs(out, exist_ok=True)
ts = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round((s % 1) * 1000)):03d}"
for lang in ('es', 'en', 'fr'):
    rows = []
    for i, c in enumerate(TL['captions']['cues'], 1):
        text = c.get('text', {}).get(lang) or TL['copy'][lang][c['id']]
        text = ' '.join(text.split('\n'))
        rows.append(f"{i}\n{ts(c['in'])} --> {ts(c['out'])}\n{text}\n")
    fn = os.path.join(out, f'obelcha_ad_{lang.upper()}.srt')
    open(fn, 'w', encoding='utf-8').write('\n'.join(rows))
    print('✓', os.path.relpath(fn, ROOT))
