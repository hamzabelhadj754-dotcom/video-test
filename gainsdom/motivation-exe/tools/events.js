// dumps timing.js (TL, EV, BEAT) as JSON for tools/audio.py
const t = require('../timing.js'); process.stdout.write(JSON.stringify({ TL: t.TL, EV: t.EV, BEAT: t.BEAT, B0: t.B0 }));
