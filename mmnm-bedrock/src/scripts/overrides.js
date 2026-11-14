// Hand tuning on top of the auto-converted ability table (data.js).
// t: proj | punch | aoe | dash | slam | buff | morph | guard | fly | tp | heal | item | wall | util | swap | strike
export const OVERRIDES = {
  geppo: { t: 'fly', cd: 30 }, soru: { t: 'dash', d: 0, cd: 100, r: 2 }, kamie: { t: 'buff', fx: [['speed', 2, 1], ['resistance', 1, 1]] },
  tekkai: { t: 'guard' }, rankyaku: { t: 'proj', d: 20, sp: 2.5, lf: 20 }, shigan: { t: 'punch', d: 20 }, rokuogan: { t: 'punch', d: 60, ex: 2 },
  kamisori: { t: 'tp', r: 16 },
  shambles: { t: 'swap', r: 24, cd: 60 }, room: { t: 'buff', fx: [['resistance', 0, 1]] },
  el_thor: { t: 'strike', d: 50, ex: 4, r: 40 }, raigo: { t: 'strike', d: 80, ex: 6, r: 48 }, sango: { t: 'proj', d: 20 },
  ice_age: { r: 10, d: 12 }, hibashira: { t: 'aoe', r: 5, d: 30 }, dai_enkai_entei: { t: 'proj', d: 80, ex: 6, sp: 1.5, lf: 40, ch: 30 },
  gear_second: { fx: [['speed', 2, 1], ['strength', 1, 1], ['jump_boost', 1, 1]] },
  gear_third: { t: 'buff', fx: [['strength', 2, 1], ['slowness', 0, 1]] },
  gear_fourth: { t: 'buff', fx: [['strength', 3, 1], ['resistance', 1, 1], ['jump_boost', 2, 1]] },
  gear_fifth: { t: 'buff', fx: [['strength', 4, 1], ['resistance', 2, 1], ['speed', 2, 1], ['jump_boost', 3, 1]] },
  busoshoku_haki_hardening: { t: 'buff', du: 1200, cd: 100, haki: 1, fx: [['strength', 0, 1]] },
  busoshoku_haki_imbuing: { t: 'buff', du: 1200, cd: 100, haki: 1, fx: [['strength', 0, 1]] },
  busoshoku_haki_full_body_hardening: { t: 'buff', du: 600, cd: 300, haki: 1, fx: [['strength', 1, 1], ['resistance', 1, 1]] },
  busoshoku_haki_emission: { t: 'punch', d: 30, r: 3 }, busoshoku_haki_internal_destruction: { t: 'punch', d: 45 },
  kenbunshoku_haki_aura: { t: 'buff', du: 1200, cd: 100, fx: [['night_vision', 0, 1], ['speed', 0, 1]] },
  kenbunshoku_haki_future_sight: { t: 'buff', du: 300, cd: 600, fx: [['resistance', 2, 1], ['speed', 1, 1]] },
  haoshoku_haki: { t: 'aoe', d: 0, r: 12, cd: 600, stun: 1, fx: [['slowness', 6, 0], ['blindness', 0, 0], ['weakness', 3, 0]] },
  haoshoku_haki_infusion: { t: 'buff', du: 400, cd: 600, haki: 1, fx: [['strength', 2, 1]] },
  yami_yami_black_hole: { t: 'aoe' }, kurouzu: { t: 'punch', r: 16, pull: 1, d: 10 },
  gura_gura_no_mi_kaishin: { t: 'proj' }, pika_pika_no_mi_travel: { t: 'tp', r: 48 },
};
