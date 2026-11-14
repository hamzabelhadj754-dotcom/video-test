# Mine Mine no Mi → Minecraft Bedrock converter

Builds an unofficial Bedrock add-on (behaviour pack + resource pack) from your own copy of the
Java mod **Mine Mine no Mi 0.11.0** (1.21.1) by Wynd, FGpisces, Varian and Kaiyo.

The original mod is **All Rights Reserved**. This repository contains only the converter and the
Bedrock script engine; none of the mod's textures, sounds or data are stored here. The generated
packs include the mod's assets, so keep them for personal use and do not redistribute them.

## Build

```bash
pip install pillow          # plus a JDK (javap) on PATH
python3 tools/build.py /path/to/mine-mine-no-mi-1.21.1-0.11.0.jar
```

Output goes to `dist/`: `MineMineNoMi-Bedrock.mcaddon` plus the two unpacked pack folders.
Open the `.mcaddon` with Minecraft, then enable both packs on a world. Requires Bedrock 1.21.90+.
No experimental toggles are needed.

## What is converted

| Area | Status |
| --- | --- |
| Devil fruits | all 71, eaten like food; eating a second one is fatal |
| Abilities | 454 active abilities, cooldown / damage / range / duration read from the mod's classes |
| Haki, races, fighting styles | unlocked by doriki through the Character Creator menu |
| Items | 205 (swords, guns, food, clothing, boxes, kairoseki...) with original icons and names |
| Armour | 62 pieces render on the player; hats, capes and glasses with custom Java models are wearable but invisible |
| NPCs | 48 humanoids (marines, pirates, bandits, bosses, trainers) with faction AI and natural spawns |
| Blocks | 23 full-cube blocks, kairoseki ore generation |
| Recipes, sounds, particles, 8 languages | converted |

Not converted: animals and other non-humanoid models, zoan transformation models, structures,
the Java GUI/keybinds, quests, challenges, crews, bounties, trading.

## How it plays on Bedrock

Bedrock has no custom keybinds, so each ability is an item with the mod's icon. Use the
**Character Creator** (given on first join) to pick faction, race and style and to move abilities
in and out of your inventory; use the ability item to cast it. Ability behaviour is approximated
by archetype (projectile, punch, area, dash, buff, ...) — `src/scripts/overrides.js` holds hand
tuning for individual abilities.

Operator commands: `/scriptevent mmnm:fruit <id>`, `mmnm:doriki <n>`, `mmnm:ability <id>`, `mmnm:reset`.

## Performance

- No per-tick script work while idle: one pass per second over players, and a shared ticker that
  only exists while a projectile or dash is in flight.
- Projectiles are simulated rays with a world-wide cap, not entities.
- Ability explosions do not break blocks unless `griefing` is enabled in `src/scripts/config.js`.
- NPC spawns are capped by density limits and grunts despawn at distance.
