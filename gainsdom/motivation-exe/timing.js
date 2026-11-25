// GAINSDOM · Protocol 01 · MOTIVATION.EXE: every time in the film, on a 96 BPM grid (beat 0.625 s, first hit at 0.05).
// Shared by film.js (picture) and tools/audio.py (sound, read through tools/events.js), so picture and sound never drift.
var BPM = 96, BEAT = 60 / BPM, B0 = 0.05;
function b(k) { return +(B0 + BEAT * k).toFixed(4); }
var TL = {
  DUR: 15,
  // 1 · HOOK: motivation loads to 99% and stops
  hook: b(0), sprint0: b(0) + .05, sprint1: b(0) + .95,
  wait1: b(2), wait2: b(3), wait3: b(3.5), dayEnd: b(4),
  // 2 · crash: error window, cursor hits END TASK
  win: b(4), cur0: b(4) + .17, click: 3.0, glitch1: 3.02, black1: 3.07,
  // 3 · TRUTH
  diag: b(5), you: b(5), notLazy: b(5.5), roll: b(7) - .095, waiting: b(7),
  strike0: b(8.5), strike1: b(8.5) + .24, glitch2: b(9), morph0: b(9) + .05, morph1: b(9) + .375, frame1: b(10),
  // 4 · TOOL: DISCIPLINE.EXE installs (no motivation needed)
  install: b(10), requires: b(10) + .15, check1: b(12), check2: b(13), check3: b(14), done: b(16), prompt: b(16) + .5,
  // 5 · silence, then ACTION
  collapse: b(18), start: b(19), now: b(19.5), glitch3: b(21),
  // 6 · sign-off (loops back into frame 0)
  sign: b(21) + .125, tag: b(23), end: 14.95,
};
// sound events (type, time, extra): the audio script turns these into cues
var EV = [
  ['slam', TL.hook, { big: 1 }], ['roll', TL.sprint0, { dur: .85 }],
  ['slamS', TL.wait1], ['slamS', TL.wait2], ['slamS', TL.wait3], ['cutfx', TL.wait1], ['cutfx', TL.wait2], ['cutfx', TL.wait3],
  ['error', TL.win], ['slamS', TL.win], ['move', TL.cur0, { dur: .3 }], ['click', TL.click], ['glitch', TL.glitch1, { dur: .05 }], ['cut', TL.black1],
  ['type', TL.diag, { n: 12, cps: 60 }], ['slam', TL.you], ['slam', TL.notLazy],
  ['whoosh', TL.roll, { dur: .25 }], ['slam', TL.waiting, { accent: 1 }],
  ['strike', TL.strike0, { dur: .24 }], ['glitch', TL.glitch2, { dur: .05 }], ['whoosh', TL.morph0, { dur: .35 }],
  ['slamS', TL.install], ['type', TL.requires, { n: 22 }],
  ['check', TL.check1], ['check', TL.check2], ['check', TL.check3], ['complete', TL.done], ['type', TL.prompt, { n: 28 }],
  ['off', TL.collapse], ['slam', TL.start, { big: 2 }], ['slam', TL.now, { big: 1, accent: 1 }],
  ['glitch', TL.glitch3, { dur: .05 }], ['type', TL.sign, { n: 33, cps: 40 }], ['tag', TL.tag],
];
if (typeof module !== 'undefined') module.exports = { TL: TL, EV: EV, BEAT: BEAT, B0: B0, b: b };
