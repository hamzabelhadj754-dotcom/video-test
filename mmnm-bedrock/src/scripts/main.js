import { world, system, ItemStack, EquipmentSlot } from '@minecraft/server';
import { FRUITS, GUNS, BOXES, ITEMS, ABILITIES } from './data.js';
import { CFG, STYLES } from './config.js';
import { get, save, forget, syncTags } from './state.js';
import { NS, useAbility, fireGun, setFruit, specialHits, hasItem, give, consumeHeld, bar, particle, sound, isCreative, clearAbilityItems, abilityItem } from './engine.js';
import { mainMenu, trainerMenu, encyclopedia } from './menu.js';

const AB = NS + 'ab_';
const TRAINER = { swordsman_trainer: 'swordsman', sniper_trainer: 'sniper', doctor_trainer: 'doctor', art_of_weather_trainer: 'art_of_weather',
  brawler_trainer: 'brawler', black_leg_trainer: 'black_leg' };

// ------------------------------------------------------------- item usage
world.afterEvents.itemUse.subscribe((ev) => {
  const player = ev.source, type = ev.itemStack?.typeId;
  if (!type || !type.startsWith(NS) || player.typeId !== 'minecraft:player') return;
  if (type.startsWith(AB)) { useAbility(player, type.slice(AB.length)); return; }
  const id = type.slice(NS.length);
  if (id === 'character_creator') { mainMenu(player); return; }
  if (id === 'devil_fruit_encyclopedia') { encyclopedia(player); return; }
  if (id === 'belly_pouch') {
    const st = get(player), n = 50 + Math.floor(Math.random() * 450);
    st.belly += n; save(player, st); consumeHeld(player); bar(player, `§6+${n} belly §7(${st.belly})`); return;
  }
  const tier = BOXES.indexOf(id);
  if (tier >= 0) {
    const pool = Object.keys(FRUITS).filter((f) => FRUITS[f].tier === tier + 1);
    if (!pool.length) return;
    consumeHeld(player);
    give(player, new ItemStack(NS + pool[Math.floor(Math.random() * pool.length)], 1));
    sound(player.dimension, 'random.chestopen', player.location);
    return;
  }
  const gun = GUNS[id];
  if (gun) {
    const st = get(player), now = system.currentTick;
    if ((st.cd.get(type) ?? 0) > now) return;
    let kairoseki = false;
    if (!isCreative(player)) {
      const ammo = gun.bow ? ['minecraft:arrow'] : [NS + 'kairoseki_bullet', NS + 'bullet'];
      const found = ammo.find((a) => hasItem(player, a));
      if (!found) { bar(player, '§cNo ammo'); return; }
      kairoseki = found.includes('kairoseki');
      try { player.runCommand(`clear @s ${found} 0 1`); } catch { }
    }
    st.cd.set(type, now + gun.cd);
    try { player.startItemCooldown('gun_' + id, gun.cd); } catch { }
    fireGun(player, gun, kairoseki);
  }
});

world.afterEvents.itemCompleteUse.subscribe((ev) => {
  const player = ev.source, type = ev.itemStack?.typeId;
  if (!type || !type.startsWith(NS)) return;
  const id = type.slice(NS.length), fruit = FRUITS[id];
  if (!fruit) return;
  const st = get(player);
  if (st.fruit) {
    if (CFG.secondFruitKills && !isCreative(player)) { player.sendMessage('§4Two devil fruits cannot share one body...'); player.kill(); }
    else bar(player, '§cYou already ate a devil fruit');
    return;
  }
  setFruit(player, id);
  player.sendMessage(`§6You ate the §f${fruit.n}§6 - a §f${fruit.type}§6 devil fruit. You can no longer swim.`);
  try { player.onScreenDisplay.setTitle('§6' + fruit.n, { subtitle: fruit.type, fadeInDuration: 5, stayDuration: 50, fadeOutDuration: 10 }); } catch { }
  sound(player.dimension, 'random.levelup', player.location);
});

// ------------------------------------------------------ logia / doriki
world.afterEvents.entityHurt.subscribe((ev) => {
  const victim = ev.hurtEntity;
  if (victim.typeId !== 'minecraft:player' || !victim.isValid) return;
  const st = get(victim), fruit = st.fruit && FRUITS[st.fruit];
  if (!fruit || !fruit.logia || st.weak) return;
  const cause = ev.damageSource.cause;
  if (cause !== 'entityAttack' && cause !== 'projectile') return;
  if (specialHits.has(victim.id)) return;
  const attacker = ev.damageSource.damagingEntity;
  try { if (attacker && (attacker.hasTag('mmnm_haki') || attacker.matches({ families: ['mmnm_haki'] }))) return; } catch { }
  const h = victim.getComponent('minecraft:health');
  if (!h || h.currentValue <= 0) return;
  h.setCurrentValue(Math.min(h.effectiveMax, h.currentValue + ev.damage));
  particle(victim.dimension, ABILITIES[fruit.a[0]]?.p, victim.getHeadLocation());
});

world.afterEvents.entityDie.subscribe((ev) => {
  const dead = ev.deadEntity, killer = ev.damageSource.damagingEntity;
  if (dead.typeId === 'minecraft:player') {
    if (CFG.loseFruitOnDeath) { const st = get(dead); if (st.fruit) { st.fruit = null; save(dead, st); clearAbilityItems(dead); } }
  }
  if (!killer || killer.typeId !== 'minecraft:player' || !killer.isValid) return;
  let max = 10;
  try { max = dead.getComponent('minecraft:health')?.effectiveMax ?? 10; } catch { }
  const st = get(killer);
  if (st.doriki >= CFG.maxDoriki) return;
  const gain = Math.max(1, Math.min(60, Math.round(max / 4)));
  st.doriki = Math.min(CFG.maxDoriki, st.doriki + gain); save(killer, st);
  bar(killer, `§a+${gain} doriki §7(${st.doriki})`);
});

// ------------------------------------------------------------ lifecycle
world.afterEvents.playerSpawn.subscribe((ev) => {
  const player = ev.player, st = get(player);
  syncTags(player, st);
  try { player.removeTag('mmnm_haki'); } catch { }
  if (ev.initialSpawn && !st.faction && ITEMS.character_creator && !hasItem(player, NS + 'character_creator')) {
    give(player, new ItemStack(NS + 'character_creator', 1));
    player.sendMessage('§6Mine Mine no Mi: §fuse the Character Creator to begin.');
  }
});
world.afterEvents.playerLeave.subscribe((ev) => forget(ev.playerId));

world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
  const type = ev.target.typeId;
  if (!type.startsWith(NS)) return;
  const style = TRAINER[type.slice(NS.length)];
  if (!style) return;
  const player = ev.player;
  system.run(() => { if (player.isValid) trainerMenu(player, style); });
});

// one light pass per second over the players - nothing here touches the world
let pass = 0;
system.runInterval(() => {
  pass++;
  if (specialHits.size) specialHits.clear();
  for (const player of world.getPlayers()) {
    const st = get(player);
    if (st.fruit && CFG.waterWeakness) {
      let weak = player.isInWater;
      if (!weak) {
        try { weak = !!player.getComponent('minecraft:equippable')?.getEquipment(EquipmentSlot.Mainhand)?.typeId.includes('kairoseki'); } catch { }
      }
      if (weak) {
        player.addEffect('slowness', 40, { amplifier: 2, showParticles: false });
        player.addEffect('weakness', 40, { amplifier: 2, showParticles: false });
        if (!st.weak) bar(player, '§9Your strength drains away...');
      }
      st.weak = weak;
    } else st.weak = false;
    if (pass % 10 === 0) {
      const fruit = st.fruit && FRUITS[st.fruit];
      if (fruit) for (const p of fruit.pas) {
        if (p === 'fire_resistance' || p === 'night_vision') player.addEffect(p, 400, { amplifier: 0, showParticles: false });
      }
      const tier = Math.floor(st.doriki / 2000);
      if (tier > 0) player.addEffect('health_boost', 400, { amplifier: tier - 1, showParticles: false });
    }
    if (st.fruit && FRUITS[st.fruit]?.pas.includes('poisonimmune')) { try { player.removeEffect('poison'); } catch { } }
  }
}, 20);

// ------------------------------------------------------- operator tools
// /scriptevent mmnm:fruit mera_mera_no_mi | mmnm:reset | mmnm:doriki 5000 | mmnm:ability hiken
system.afterEvents.scriptEventReceive.subscribe((ev) => {
  const player = ev.sourceEntity;
  if (!player || player.typeId !== 'minecraft:player') return;
  const st = get(player), arg = ev.message.trim(), say = (m) => /** @type {any} */ (player).sendMessage(m);
  switch (ev.id) {
    case 'mmnm:fruit': if (FRUITS[arg]) { setFruit(player, arg); say('§aFruit set: ' + FRUITS[arg].n); } else say('§cUnknown fruit id'); break;
    case 'mmnm:reset': setFruit(player, null); clearAbilityItems(player); st.doriki = 0; st.faction = st.race = st.style = null; save(player, st); syncTags(player, st); say('§aCharacter reset'); break;
    case 'mmnm:doriki': st.doriki = Math.max(0, Math.min(CFG.maxDoriki, parseInt(arg) || 0)); save(player, st); say('§aDoriki: ' + st.doriki); break;
    case 'mmnm:style': if (STYLES[arg]) { st.style = arg; save(player, st); } break;
    case 'mmnm:ability': if (ABILITIES[arg] && ABILITIES[arg].t !== 'passive') give(player, abilityItem(arg)); break;
  }
}, { namespaces: ['mmnm'] });
