import { world } from '@minecraft/server';

const KEY = 'mmnm:data';
const cache = new Map();

/** Per-player state, loaded once from a dynamic property and kept in memory. */
export function get(player) {
  let st = cache.get(player.id);
  if (st) return st;
  let d = {};
  try { const raw = player.getDynamicProperty(KEY); if (typeof raw === 'string') d = JSON.parse(raw); } catch { }
  st = {
    fruit: d.fruit ?? null, doriki: d.doriki ?? 0, belly: d.belly ?? 0, faction: d.faction ?? null, race: d.race ?? null, style: d.style ?? null,
    cd: new Map(), active: new Map(), gcd: 0, weak: false,
  };
  cache.set(player.id, st);
  return st;
}

export function save(player, st) {
  try {
    player.setDynamicProperty(KEY, JSON.stringify({ fruit: st.fruit, doriki: st.doriki, belly: st.belly, faction: st.faction, race: st.race, style: st.style }));
  } catch { }
}

export function forget(playerId) { cache.delete(playerId); }

export function syncTags(player, st) {
  try {
    for (const t of player.getTags()) if (t.startsWith('mmnm_f_')) player.removeTag(t);
    if (st.faction) player.addTag('mmnm_f_' + st.faction);
  } catch { }
}
