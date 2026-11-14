import { world, system, ItemStack, ItemLockMode, EntityDamageCause, EquipmentSlot, GameMode } from '@minecraft/server';
import { ABILITIES, FRUITS, GROUPS } from './data.js';
import { OVERRIDES } from './overrides.js';
import { CFG, RACES, STYLES, UNLOCK } from './config.js';
import { get, save } from './state.js';

for (const id in OVERRIDES) if (ABILITIES[id]) Object.assign(ABILITIES[id], OVERRIDES[id]);

export const NS = 'mineminenomi:';
const IGNORE = ['minecraft:item', 'minecraft:xp_orb', 'minecraft:arrow', 'minecraft:painting', 'minecraft:armor_stand', 'minecraft:npc'];
const TOGGLE = { buff: 1, morph: 1, guard: 1, item: 1 };
const DEFAULT_FX = {
  buff: [['strength', 0, 1], ['speed', 1, 1]],
  morph: [['strength', 1, 1], ['speed', 1, 1], ['resistance', 0, 1], ['jump_boost', 1, 1]],
  guard: [['resistance', 3, 1], ['slowness', 3, 1]],
};

// ---------------------------------------------------------------- utilities
const add = (a, b, k = 1) => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function particle(dim, id, loc) {
  if (!id) return;
  try { dim.spawnParticle(id, loc); } catch { }
}
export function sound(dim, id, loc, volume = 1) {
  if (!id) return;
  try { dim.playSound(id, loc, { volume }); } catch { }
}
export function bar(player, text) {
  try { player.onScreenDisplay.setActionBar(text); } catch { }
}
function effect(entity, id, ticks, amp) {
  try { entity.addEffect(id, ticks, { amplifier: amp, showParticles: false }); } catch { }
}

/** One shared ticker that only exists while something is in flight - idle cost is zero. */
const tasks = [];
let ticker;
function addTask(fn) {
  tasks.push(fn);
  if (ticker === undefined) ticker = system.runInterval(step, 1);
}
function step() {
  for (let i = tasks.length - 1; i >= 0; i--) {
    let done = true;
    try { done = tasks[i](); } catch { done = true; }
    if (done) tasks.splice(i, 1);
  }
  if (!tasks.length && ticker !== undefined) { system.clearRun(ticker); ticker = undefined; }
}
let projectiles = 0;

/** entity ids hit by an ability during the last ticks - these bypass logia intangibility */
export const specialHits = new Set();

function nearby(src, loc, radius) {
  let list;
  try { list = src.dimension.getEntities({ location: loc, maxDistance: radius, excludeTypes: IGNORE, excludeFamilies: ['inanimate'] }); } catch { return []; }
  const pvp = world.gameRules.pvp;
  const out = [];
  for (const e of list) {
    if (e.id === src.id) continue;
    if (!pvp && e.typeId === 'minecraft:player' && src.typeId === 'minecraft:player') continue;
    out.push(e);
    if (out.length >= CFG.maxTargets) break;
  }
  return out;
}

function hit(src, target, ab, dmg, dir) {
  if (!target.isValid) return;
  specialHits.add(target.id);
  if (dmg > 0) {
    try { target.applyDamage(dmg, { cause: EntityDamageCause.entityAttack, damagingEntity: src }); } catch { }
  }
  if (!target.isValid) return;
  switch (ab.el) {
    case 'fire': try { target.setOnFire(4, true); } catch { } break;
    case 'magma': try { target.setOnFire(8, true); } catch { } break;
    case 'ice': effect(target, 'slowness', 60, 2); break;
    case 'lightning': effect(target, 'slowness', 20, 4); break;
    case 'poison': effect(target, 'poison', 100, 0); break;
    case 'gravity': effect(target, 'slowness', 60, 3); break;
  }
  if (ab.fx) for (const f of ab.fx) if (!f[2]) effect(target, f[0], f[0] === 'slowness' && f[1] >= 6 ? 60 : 100, f[1]);
  if (dir) { try { target.applyKnockback({ x: dir.x * 0.9, z: dir.z * 0.9 }, 0.3); } catch { } }
}

function blast(src, ab, loc, dmg) {
  const dim = src.dimension, r = ab.ex;
  if (CFG.griefing) {
    try { dim.createExplosion(loc, Math.min(r, 5), { breaksBlocks: true, causesFire: ab.el === 'fire' || ab.el === 'magma', source: src }); } catch { }
    return;
  }
  particle(dim, r >= 4 ? 'minecraft:huge_explosion_emitter' : 'minecraft:large_explosion', loc);
  sound(dim, 'random.explode', loc, 0.8);
  for (const e of nearby(src, loc, r + 1)) hit(src, e, ab, dmg * 0.5, null);
}

function scaled(st, d) {
  return d ? Math.max(1, Math.round(d * CFG.damageScale * (1 + st.doriki / CFG.maxDoriki))) : 0;
}

// --------------------------------------------------------------- ownership
function groupsOf(st) {
  const g = ['haki'];
  if (st.race && RACES[st.race]) g.push(...RACES[st.race].g);
  if (st.style && STYLES[st.style]) g.push(...STYLES[st.style].g);
  return g;
}
export function requirement(id) {
  const ab = ABILITIES[id];
  if (!ab || ab.k === 'D') return 0;
  const idx = Math.max(0, (GROUPS[ab.g] ?? []).indexOf(id));
  return ab.k === 'H' ? UNLOCK.hakiBase + idx * UNLOCK.H : idx * (UNLOCK[ab.k] ?? 300);
}
/** [{id, locked}] for the abilities menu */
export function listAbilities(st) {
  const out = [];
  if (st.fruit && FRUITS[st.fruit]) for (const id of FRUITS[st.fruit].a) out.push({ id, need: 0 });
  for (const g of groupsOf(st)) for (const id of GROUPS[g] ?? []) {
    if (ABILITIES[id] && ABILITIES[id].t !== 'passive') out.push({ id, need: requirement(id) });
  }
  return out;
}
function owns(st, id, ab) {
  if (ab.k === 'D') return !!st.fruit && !!FRUITS[st.fruit] && FRUITS[st.fruit].a.includes(id);
  return groupsOf(st).includes(ab.g) && st.doriki >= requirement(id);
}

// -------------------------------------------------------------------- items
export function abilityItem(id) {
  const ab = ABILITIES[id];
  const item = new ItemStack(NS + 'ab_' + id, 1);
  item.lockMode = ItemLockMode.inventory;
  item.keepOnDeath = true;
  const lore = [];
  if (ab.ds) for (const line of wrap(ab.ds, 34)) lore.push('§7' + line);
  lore.push(`§8Cooldown §f${(ab.cd / 20).toFixed(1)}s` + (ab.d ? `  §8Damage §f${ab.d}` : ''));
  try { item.setLore(lore.slice(0, 8)); } catch { }
  return item;
}
function wrap(text, n) {
  const out = []; let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).length > n && line) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}
export function hasItem(player, typeId) {
  const c = player.getComponent('minecraft:inventory')?.container;
  if (!c) return false;
  for (let i = 0; i < c.size; i++) if (c.getItem(i)?.typeId === typeId) return true;
  return false;
}
export function removeItems(player, test) {
  const c = player.getComponent('minecraft:inventory')?.container;
  if (!c) return;
  for (let i = 0; i < c.size; i++) { const it = c.getItem(i); if (it && test(it.typeId)) c.setItem(i, undefined); }
}
export function give(player, item) {
  const c = player.getComponent('minecraft:inventory')?.container;
  const left = c?.addItem(item);
  if (left) bar(player, '§cYour inventory is full');
  return !left;
}
export function consumeHeld(player) {
  try {
    const slot = player.getComponent('minecraft:equippable').getEquipmentSlot(EquipmentSlot.Mainhand);
    if (slot.amount > 1) slot.amount -= 1; else slot.setItem(undefined);
  } catch { }
}

// --------------------------------------------------------------------- cast
function startCooldown(player, st, id, ticks) {
  st.cd.set(id, system.currentTick + ticks);
  try { player.startItemCooldown('ab_' + id, ticks); } catch { }
}

export function useAbility(player, id) {
  const ab = ABILITIES[id];
  if (!ab || ab.t === 'passive') return;
  const st = get(player), now = system.currentTick;
  if (!owns(st, id, ab)) {
    bar(player, '§cYou cannot use ' + ab.n);
    removeItems(player, (t) => t === NS + 'ab_' + id);
    return;
  }
  if (st.gcd > now) return;
  if (TOGGLE[ab.t] && st.active.has(id)) { st.gcd = now + CFG.globalCooldown; endBuff(player, st, id, ab, true); return; }
  const ready = st.cd.get(id) ?? 0;
  if (ready > now) { bar(player, `§7${ab.n} §f${((ready - now) / 20).toFixed(1)}s`); return; }
  if (st.weak && ab.k === 'D') { bar(player, '§9Your devil fruit powers are sealed'); return; }
  st.gcd = now + CFG.globalCooldown;
  startCooldown(player, st, id, TOGGLE[ab.t] ? ab.cd + (ab.du ?? 0) : ab.cd);
  const dim = player.dimension;
  sound(dim, ab.s, player.location);
  if (ab.ch) {
    particle(dim, ab.p, player.getHeadLocation());
    system.runTimeout(() => { if (player.isValid) run(player, st, id, ab); }, ab.ch);
  } else run(player, st, id, ab);
}

function run(player, st, id, ab) {
  try { CAST[ab.t](player, st, id, ab, scaled(st, ab.d)); } catch (e) { console.warn('[mmnm] ' + id + ': ' + e); }
}

function shoot(src, ab, dmg, origin, dir) {
  if (projectiles >= CFG.maxProjectiles) return;
  projectiles++;
  const dim = src.dimension, sp = ab.sp ?? 2;
  let pos = origin, life = ab.lf ?? 32;
  addTask(() => {
    let end = false, victim;
    try {
      if (!src.isValid) { projectiles--; return true; }
      let d = sp;
      const bh = dim.getBlockFromRay(pos, dir, { maxDistance: sp, includeLiquidBlocks: false, includePassableBlocks: false });
      if (bh) { d = Math.min(sp, dist(pos, add(bh.block.location, bh.faceLocation))); end = true; }
      for (const h of dim.getEntitiesFromRay(pos, dir, { maxDistance: d + 0.6, excludeTypes: IGNORE })) {
        const e = h.entity;
        if (e.id === src.id || !e.isValid) continue;
        if (e.typeId === 'minecraft:player' && src.typeId === 'minecraft:player' && !world.gameRules.pvp) continue;
        victim = e; d = h.distance; break;
      }
      pos = add(pos, dir, d);
    } catch { end = true; }
    particle(dim, ab.p ?? 'minecraft:basic_crit_particle', pos);
    if (victim || end || --life <= 0) {
      projectiles--;
      if (victim) hit(src, victim, ab, dmg, dir);
      if (ab.ex && (victim || end)) blast(src, ab, pos, dmg);
      return true;
    }
    return false;
  });
}

function aoe(player, ab, dmg, center, radius) {
  const dim = player.dimension;
  for (let i = 0; i < 10; i++) {
    const a = i * 0.628;
    particle(dim, ab.p ?? 'minecraft:basic_crit_particle', { x: center.x + Math.cos(a) * radius * 0.6, y: center.y + 0.6, z: center.z + Math.sin(a) * radius * 0.6 });
  }
  for (const e of nearby(player, center, radius)) {
    if (ab.stun) { const h = e.getComponent('minecraft:health'); if (h && h.effectiveMax > 60) continue; }
    const l = e.location, dx = l.x - center.x, dz = l.z - center.z, n = Math.hypot(dx, dz) || 1;
    hit(player, e, ab, dmg, ab.stun ? null : { x: dx / n, y: 0, z: dz / n });
  }
  if (ab.ex) blast(player, ab, center, dmg);
}

function applySelf(player, ab, ticks) {
  const list = (ab.fx ?? []).filter((f) => f[2]);
  const fx = list.length ? list : DEFAULT_FX[ab.t] ?? [];
  for (const f of fx) effect(player, f[0], ticks, f[1]);
  return fx;
}

function endBuff(player, st, id, ab, early) {
  const info = st.active.get(id);
  if (!info) return;
  st.active.delete(id);
  system.clearRun(info.handle);
  if (!player.isValid) return;
  for (const f of info.fx) { try { player.removeEffect(f[0]); } catch { } }
  if (ab.haki) { let other = false; for (const k of st.active.keys()) if (ABILITIES[k].haki) other = true; if (!other) { try { player.removeTag('mmnm_haki'); } catch { } } }
  if (ab.w) removeItems(player, (t) => t === NS + ab.w);
  if (early) startCooldown(player, st, id, ab.cd);
  bar(player, `§7${ab.n} ended`);
}

function toggleOn(player, st, id, ab) {
  const du = ab.du ?? 300;
  const fx = applySelf(player, ab, du);
  if (ab.haki) { try { player.addTag('mmnm_haki'); } catch { } }
  const handle = system.runTimeout(() => { if (player.isValid) endBuff(player, st, id, ab, false); else st.active.delete(id); }, du);
  st.active.set(id, { handle, fx });
  particle(player.dimension, ab.p, player.getHeadLocation());
  bar(player, `§b${ab.n} §7(${Math.round(du / 20)}s)`);
}

const CAST = {
  proj(player, st, id, ab, dmg) {
    const n = ab.c ?? 1, iv = ab.iv ?? 3;
    const fire = () => {
      if (!player.isValid) return;
      const dir = player.getViewDirection();
      if (n > 1) { dir.x += (Math.random() - 0.5) * 0.12; dir.y += (Math.random() - 0.5) * 0.08; dir.z += (Math.random() - 0.5) * 0.12; }
      shoot(player, ab, dmg, add(player.getHeadLocation(), dir, 0.8), dir);
    };
    fire();
    for (let i = 1; i < n; i++) system.runTimeout(fire, i * iv);
  },
  punch(player, st, id, ab, dmg) {
    const reach = Math.max(4.5, ab.r ?? 0);
    let target;
    for (const h of player.getEntitiesFromViewDirection({ maxDistance: reach, excludeTypes: IGNORE })) if (h.entity.id !== player.id) { target = h.entity; break; }
    const dir = player.getViewDirection();
    if (!target) { particle(player.dimension, ab.p, add(player.getHeadLocation(), dir, 2)); startCooldown(player, st, id, Math.min(ab.cd, 20)); return; }
    particle(player.dimension, ab.p ?? 'minecraft:basic_crit_particle', target.getHeadLocation());
    if (ab.pull) { try { target.applyKnockback({ x: -dir.x * 2, z: -dir.z * 2 }, 0.3); } catch { } hit(player, target, ab, dmg, null); }
    else hit(player, target, ab, dmg, dir);
    if (ab.ex) blast(player, ab, target.location, dmg);
  },
  aoe(player, st, id, ab, dmg) { aoe(player, ab, dmg, player.location, ab.r ?? 5); },
  dash(player, st, id, ab, dmg) {
    const dir = player.getViewDirection();
    try { player.applyKnockback({ x: dir.x * 2.6, z: dir.z * 2.6 }, Math.max(0.12, dir.y * 0.7)); } catch { }
    if (!dmg) { particle(player.dimension, ab.p ?? 'minecraft:basic_smoke_particle', player.location); return; }
    const seen = new Set(); let t = 0;
    addTask(() => {
      if (!player.isValid || ++t > 10) return true;
      if (t % 2) return false;
      particle(player.dimension, ab.p ?? 'minecraft:basic_crit_particle', player.location);
      for (const e of nearby(player, player.location, ab.r ? Math.min(ab.r, 3) : 2.2)) if (!seen.has(e.id)) { seen.add(e.id); hit(player, e, ab, dmg, dir); }
      return false;
    });
  },
  slam(player, st, id, ab, dmg) {
    const dir = player.getViewDirection();
    try { player.applyKnockback({ x: dir.x * 1.1, z: dir.z * 1.1 }, 0.95); } catch { }
    effect(player, 'resistance', 60, 4);
    let t = 0;
    addTask(() => {
      if (!player.isValid) return true;
      if (++t < 6 || (!player.isOnGround && t < 50)) return false;
      aoe(player, ab, dmg, player.location, ab.r ?? 4);
      return true;
    });
  },
  buff: toggleOn, morph: toggleOn, guard: toggleOn,
  item(player, st, id, ab) {
    if (!hasItem(player, NS + ab.w)) {
      const it = new ItemStack(NS + ab.w, 1); it.lockMode = ItemLockMode.inventory;
      give(player, it);
    }
    toggleOn(player, st, id, ab);
  },
  fly(player, st, id, ab) {
    const dir = player.getViewDirection();
    try { player.applyKnockback({ x: dir.x * 2.0, z: dir.z * 2.0 }, 0.85 + Math.max(0, dir.y) * 0.6); } catch { }
    effect(player, 'slow_falling', 80, 0);
    particle(player.dimension, ab.p ?? 'minecraft:basic_smoke_particle', player.location);
  },
  tp(player, st, id, ab) {
    const r = ab.r ?? 30, dim = player.dimension, from = player.location;
    const bh = player.getBlockFromViewDirection({ maxDistance: r, includeLiquidBlocks: false, includePassableBlocks: false });
    const dir = player.getViewDirection();
    const to = bh ? add(add(bh.block.location, bh.faceLocation), dir, -0.6) : add(player.getHeadLocation(), dir, r);
    particle(dim, ab.p ?? 'minecraft:endrod', from);
    if (!player.tryTeleport(to, { checkForBlocks: true })) player.tryTeleport(add(to, { x: 0, y: 1, z: 0 }), { checkForBlocks: true });
    particle(dim, ab.p ?? 'minecraft:endrod', player.location);
  },
  swap(player, st, id, ab) {
    let target;
    for (const h of player.getEntitiesFromViewDirection({ maxDistance: ab.r ?? 24, excludeTypes: IGNORE })) if (h.entity.id !== player.id) { target = h.entity; break; }
    if (!target) { startCooldown(player, st, id, 20); return; }
    const a = player.location, b = target.location;
    particle(player.dimension, ab.p, a); particle(player.dimension, ab.p, b);
    target.tryTeleport(a); player.tryTeleport(b);
  },
  strike(player, st, id, ab, dmg) {
    const r = ab.r ?? 40, dim = player.dimension;
    const bh = player.getBlockFromViewDirection({ maxDistance: r, includeLiquidBlocks: true });
    const at = bh ? add(bh.block.location, { x: 0.5, y: 1, z: 0.5 }) : add(player.getHeadLocation(), player.getViewDirection(), 12);
    for (let i = 0; i < 8; i++) particle(dim, ab.p ?? 'minecraft:electric_spark_particle', { x: at.x, y: at.y + i * 1.5, z: at.z });
    sound(dim, 'ambient.weather.thunder', at, 1);
    for (const e of nearby(player, at, 3)) hit(player, e, ab, dmg, null);
    blast(player, ab, at, dmg);
  },
  heal(player, st, id, ab) {
    const targets = [player];
    for (const e of nearby(player, player.location, ab.r ?? 5)) if (e.typeId === 'minecraft:player') targets.push(e);
    for (const e of targets) {
      effect(e, 'regeneration', 100, 2);
      const h = e.getComponent('minecraft:health');
      if (h) h.setCurrentValue(Math.min(h.effectiveMax, h.currentValue + 6));
      particle(e.dimension, ab.p ?? 'minecraft:villager_happy', e.getHeadLocation());
    }
  },
  wall(player, st, id, ab) {
    const dim = player.dimension, v = player.getViewDirection();
    const n = Math.hypot(v.x, v.z) || 1, fx = v.x / n, fz = v.z / n;
    const base = player.location, placed = [];
    for (let w = -2; w <= 2; w++) for (let h = 0; h < 3; h++) {
      const loc = { x: Math.floor(base.x + fx * 2.5 - fz * w), y: Math.floor(base.y) + h, z: Math.floor(base.z + fz * 2.5 + fx * w) };
      try { const b = dim.getBlock(loc); if (b && b.isAir) { b.setType(ab.b); placed.push(loc); } } catch { }
    }
    system.runTimeout(() => {
      for (const loc of placed) { try { const b = dim.getBlock(loc); if (b && b.typeId === ab.b) b.setType('minecraft:air'); } catch { } }
    }, Math.min(ab.du ?? 200, 300));
  },
  util(player, st, id, ab) {
    applySelf(player, ab, ab.du ?? 200);
    particle(player.dimension, ab.p ?? 'minecraft:basic_smoke_particle', player.getHeadLocation());
    if (ab.fx?.some((f) => !f[2])) for (const e of nearby(player, player.location, 6)) hit(player, e, ab, 0, null);
  },
};

/** guns / bows: a plain projectile through the same simulation */
export function fireGun(player, gun, kairoseki) {
  const dir = player.getViewDirection();
  const ab = { sp: gun.sp, lf: 28, p: 'minecraft:basic_crit_particle', kairoseki };
  shoot(player, ab, Math.max(2, Math.round(6 * gun.dm)), add(player.getHeadLocation(), dir, 0.8), dir);
  sound(player.dimension, gun.bow ? 'random.bow' : 'mmnm.pistol_shoot', player.location, 1);
}

export function isCreative(player) {
  try { return player.getGameMode() === GameMode.Creative; } catch { return false; }
}

export function clearAbilityItems(player) { removeItems(player, (t) => t.startsWith(NS + 'ab_')); }

export function setFruit(player, fruitId) {
  const st = get(player);
  for (const [id] of st.active) endBuff(player, st, id, ABILITIES[id], false);
  if (st.fruit && FRUITS[st.fruit]) removeItems(player, (t) => FRUITS[st.fruit].a.some((a) => t === NS + 'ab_' + a));
  st.fruit = fruitId; save(player, st);
  if (fruitId && FRUITS[fruitId]) for (const a of FRUITS[fruitId].a) give(player, abilityItem(a));
}
