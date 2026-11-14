// Tweak these and re-import the pack. Everything here is read once at load.
export const CFG = {
  damageScale: 0.4,        // Java numbers assume doriki-boosted HP pools; Bedrock players have 20 HP
  griefing: false,         // true = ability explosions break blocks (slower, destructive)
  maxDoriki: 10000,
  globalCooldown: 6,       // ticks between any two ability casts
  maxProjectiles: 40,      // hard cap on simulated projectiles in the whole world
  maxTargets: 12,          // entities damaged per cast
  waterWeakness: true,     // fruit users are weakened in water / by kairoseki
  secondFruitKills: true,  // eating a second devil fruit is fatal, as in the mod
  loseFruitOnDeath: false,
};

export const FACTIONS = { pirate: 'Pirate', marine: 'Marine', bandit: 'Bandit', revolutionary: 'Revolutionary' };
// race / style -> ability groups (package names in the original mod)
export const RACES = {
  human: { n: 'Human', g: ['rokushiki'] }, fishman: { n: 'Fishman', g: ['fishmankarate'] },
  cyborg: { n: 'Cyborg', g: ['cyborg'] }, mink: { n: 'Mink', g: ['electro'] },
};
export const STYLES = {
  swordsman: { n: 'Swordsman', g: ['ittoryu', 'santoryu'] }, sniper: { n: 'Sniper', g: ['sniper'] },
  doctor: { n: 'Doctor', g: ['doctor'] }, art_of_weather: { n: 'Art of Weather', g: ['artofweather', 'tempos'] },
  brawler: { n: 'Brawler', g: ['brawler'] }, black_leg: { n: 'Black Leg', g: ['blackleg'] },
};
// doriki needed for the n-th ability of a group
export const UNLOCK = { S: 250, R: 400, H: 1200, hakiBase: 2000 };
