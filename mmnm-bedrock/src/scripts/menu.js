import { ActionFormData } from '@minecraft/server-ui';
import { ABILITIES, FRUITS } from './data.js';
import { CFG, FACTIONS, RACES, STYLES } from './config.js';
import { get, save, syncTags } from './state.js';
import { NS, listAbilities, abilityItem, hasItem, removeItems, give, bar } from './engine.js';

async function pick(player, title, body, options) {
  const f = new ActionFormData().title(title).body(body);
  for (const o of options) f.button(o.label, o.icon);
  const r = await f.show(player);
  return r.canceled ? undefined : options[r.selection];
}

async function creation(player, st) {
  const fac = await pick(player, 'Character Creator', 'Choose your faction.\nMarines hunt pirates, bandits and revolutionaries.',
    Object.entries(FACTIONS).map(([id, n]) => ({ id, label: n })));
  if (!fac) return false;
  const race = await pick(player, 'Character Creator', 'Choose your race. Each race learns its own techniques as your doriki grows.',
    Object.entries(RACES).map(([id, r]) => ({ id, label: r.n })));
  if (!race) return false;
  const style = await pick(player, 'Character Creator', 'Choose your fighting style.',
    Object.entries(STYLES).map(([id, s]) => ({ id, label: s.n })));
  if (!style) return false;
  st.faction = fac.id; st.race = race.id; st.style = style.id;
  save(player, st); syncTags(player, st);
  player.sendMessage(`§6You are now a §f${RACES[st.race].n} ${STYLES[st.style].n}§6 of the §f${FACTIONS[st.faction]}s§6. Use the Character Creator again to manage abilities.`);
  return true;
}

function stats(st) {
  const f = st.fruit && FRUITS[st.fruit];
  return `§7Faction: §f${FACTIONS[st.faction] ?? '-'}\n§7Race: §f${RACES[st.race]?.n ?? '-'}\n§7Style: §f${STYLES[st.style]?.n ?? '-'}\n` +
    `§7Devil Fruit: §f${f ? `${f.n} §8(${f.type})` : 'none'}\n§7Doriki: §f${st.doriki} §8/ ${CFG.maxDoriki}\n§7Belly: §f${st.belly}`;
}

export async function abilitiesMenu(player) {
  const st = get(player);
  const list = listAbilities(st);
  if (!list.length) { bar(player, '§7You have no abilities yet'); return; }
  const f = new ActionFormData().title('Abilities').body(`§7Tap an ability to put it in / take it out of your inventory. Use the item to cast.\n§7Doriki: §f${st.doriki}`);
  for (const e of list) {
    const ab = ABILITIES[e.id], locked = st.doriki < e.need;
    const tag = locked ? `§c${e.need} doriki` : hasItem(player, NS + 'ab_' + e.id) ? '§2equipped' : `§8${(ab.cd / 20).toFixed(0)}s cooldown`;
    f.button(`${locked ? '§8' : ''}${ab.n}\n${tag}`, ab.i ? `textures/mmnm/ab/ab_${e.id}` : 'textures/mmnm/ab/_default');
  }
  const r = await f.show(player);
  if (r.canceled) return;
  const e = list[r.selection];
  if (st.doriki < e.need) { bar(player, `§cNeeds ${e.need} doriki`); return; }
  const type = NS + 'ab_' + e.id;
  if (hasItem(player, type)) removeItems(player, (t) => t === type); else give(player, abilityItem(e.id));
  abilitiesMenu(player);
}

export async function mainMenu(player) {
  const st = get(player);
  if (!st.faction && !(await creation(player, st))) return;
  const c = await pick(player, 'Mine Mine no Mi', stats(st), [{ id: 'ab', label: 'Abilities' }, { id: 'close', label: 'Close' }]);
  if (c?.id === 'ab') abilitiesMenu(player);
}

export async function trainerMenu(player, styleId) {
  const st = get(player);
  if (!st.faction) { mainMenu(player); return; }
  const s = STYLES[styleId];
  if (!s || st.style === styleId) { abilitiesMenu(player); return; }
  const c = await pick(player, s.n + ' Trainer', `Train as a §f${s.n}§r? Your current style (${STYLES[st.style]?.n ?? 'none'}) will be replaced.`,
    [{ id: 'y', label: 'Train' }, { id: 'n', label: 'Not now' }]);
  if (c?.id !== 'y') return;
  if (st.style) removeItems(player, (t) => t.startsWith(NS + 'ab_') && STYLES[st.style].g.includes(ABILITIES[t.slice(NS.length + 3)]?.g));
  st.style = styleId; save(player, st);
  player.sendMessage(`§6You are now training as a §f${s.n}§6.`);
}

export async function encyclopedia(player) {
  const ids = Object.keys(FRUITS).sort((a, b) => FRUITS[a].tier - FRUITS[b].tier || a.localeCompare(b));
  const f = new ActionFormData().title('Devil Fruit Encyclopedia').body('§7Every known devil fruit.');
  for (const id of ids) f.button(`${FRUITS[id].n}\n§8${FRUITS[id].type} · tier ${FRUITS[id].tier}`, `textures/mmnm/items/${id}`);
  const r = await f.show(player);
  if (r.canceled) return;
  const fr = FRUITS[ids[r.selection]];
  await new ActionFormData().title(fr.n).body(`§7Type: §f${fr.type}\n§7Tier: §f${fr.tier}\n\n§7Abilities:\n§f` + fr.a.map((a) => ' - ' + ABILITIES[a].n).join('\n')).button('Back').show(player);
}
