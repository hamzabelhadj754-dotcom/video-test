#!/usr/bin/env python3
"""Mine Mine no Mi (Java 1.21.1, v0.11.0) -> Minecraft Bedrock add-on converter.

usage: python3 tools/build.py <path-to-mine-mine-no-mi.jar> [out_dir]

Reads the original jar (textures, sounds, lang, recipes and the gameplay numbers
stored in its classes) and writes a behaviour pack + resource pack + .mcaddon.
Nothing from the jar is stored in this repository; you need your own copy of the mod.
"""
import json, os, re, shutil, sys, zipfile, hashlib
from PIL import Image
import extract

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
NS = 'mineminenomi'
VERSION = [0, 11, 0]
UUID = {'bp': '6f1d2c0e-8a53-4f0b-9c41-5a7be3d0a101', 'bp_data': '6f1d2c0e-8a53-4f0b-9c41-5a7be3d0a102',
        'bp_script': '6f1d2c0e-8a53-4f0b-9c41-5a7be3d0a103', 'rp': '6f1d2c0e-8a53-4f0b-9c41-5a7be3d0a201',
        'rp_res': '6f1d2c0e-8a53-4f0b-9c41-5a7be3d0a202'}
FMT = '1.21.60'

def jdump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: json.dump(obj, f, separators=(',', ':'), ensure_ascii=False)

def copy(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(src, dst)

class Build:
    def __init__(s, jar, out):
        s.out = out; s.tmp = os.path.join(out, '.jar'); s.bp = os.path.join(out, 'MineMineNoMi_BP'); s.rp = os.path.join(out, 'MineMineNoMi_RP')
        for d in (s.tmp, s.bp, s.rp): shutil.rmtree(d, ignore_errors=True)
        os.makedirs(s.tmp)
        with zipfile.ZipFile(jar) as z: z.extractall(s.tmp)
        s.A = os.path.join(s.tmp, 'assets', NS); s.D = os.path.join(s.tmp, 'data', NS)
        s.data = extract.run(s.tmp); s.lang = s.data['lang']
        s.texts = {}; s.item_tex = {}; s.terrain = {}; s.item_ids = set(); s.block_ids = set(); s.report = {}
        s.rev_lang = {v.lower(): k.split('.')[-1] for k, v in s.lang.items() if k.startswith('item.' + NS + '.') and k.count('.') == 2}

    # ------------------------------------------------------------------ items
    def model_texture(s, mid, depth=0):
        p = os.path.join(s.A, 'models', 'item', mid + '.json')
        if not os.path.exists(p) or depth > 3: return None
        m = json.load(open(p)); t = m.get('textures', {})
        if 'layer0' in t: return [t['layer0']] + ([t['layer1']] if 'layer1' in t else [])
        par = m.get('parent', '')
        if par.startswith(NS + ':item/'): return s.model_texture(par.split('/', 1)[1], depth + 1)
        return None

    def add_icon(s, key, layers, sub='items'):
        """composite java layers -> RP texture, register in item_texture.json"""
        img = None
        for l in layers:
            p = os.path.join(s.A, 'textures', l.split(':')[-1] + '.png')
            if not os.path.exists(p): continue
            im = Image.open(p).convert('RGBA')
            if im.height > im.width: im = im.crop((0, 0, im.width, im.width))  # animated strip -> first frame
            img = im if img is None else Image.alpha_composite(img, im.resize(img.size))
        if img is None: return False
        dst = os.path.join(s.rp, 'textures', 'mmnm', sub, key + '.png')
        os.makedirs(os.path.dirname(dst), exist_ok=True); img.save(dst, optimize=True)
        s.item_tex['mmnm_' + key] = {'textures': f'textures/mmnm/{sub}/{key}'}
        return True

    def item(s, iid, comps, name=None, category='items'):
        c = {'minecraft:icon': {'textures': {'default': 'mmnm_' + iid}}}
        c.update(comps)
        jdump(os.path.join(s.bp, 'items', iid + '.json'), {'format_version': FMT, 'minecraft:item': {
            'description': {'identifier': f'{NS}:{iid}', 'menu_category': {'category': category}}, 'components': c}})
        s.item_ids.add(iid)
        if name: s.texts[f'item.{NS}:{iid}'] = name

    def resolve_id(s, it):
        for c in it['ids'] + [s.rev_lang.get(it['name'].replace('\\', '').lower())]:
            if c and os.path.exists(os.path.join(s.A, 'models', 'item', c + '.json')): return c
        return None

    def build_items(s):
        FOOD = {'SeaKingMeatItem': (4, 0.6), 'CookedSeaKingMeatItem': (8, 1.2), 'ColaItem': (1, 0.1), 'UltraColaItem': (2, 0.2),
                'SakeBottleItem': (1, 0.2), 'BottleOfRumItem': (1, 0.2), 'TangerineItem': (4, 0.3), 'SakeCupItem': (1, 0.1)}
        DRINK = {'ColaItem', 'UltraColaItem', 'SakeBottleItem', 'BottleOfRumItem', 'SakeCupItem'}
        SWORDS = {'ModSwordItem', 'AbilitySwordItem', 'BlueSwordItem', 'WarabideSwordItem', 'ScissorsItem', 'ModSpearItem', 'TieredItem',
                  'ChakramItem', 'DoruPickaxeItem', 'ClimaTactItem'}
        GUNS = {'ModGunItem', 'PopGreenBowItem', 'KujaBowItem'}
        SLOT = {'helmet': ('slot.armor.head', 2), 'chestplate': ('slot.armor.chest', 5), 'leggings': ('slot.armor.legs', 4), 'boots': ('slot.armor.feet', 2)}
        guns, boxes, armor_vis, skipped = {}, [], 0, []
        for field, it in s.data['items'].items():
            iid = s.resolve_id(it); cls = it['cls']
            if not iid or cls == 'AbilityIconItem': skipped.append(it['name']); continue
            layers = s.model_texture(iid)
            if not layers or not s.add_icon(iid, layers): skipped.append(it['name']); continue
            name = s.lang.get(f'item.{NS}.{iid}', it['name'].replace('\\', ''))
            it['bid'] = iid
            if cls in SWORDS:
                dmg = int(round(it.get('damage', 3.0))) + 1
                s.item(iid, {'minecraft:max_stack_size': 1, 'minecraft:hand_equipped': True, 'minecraft:damage': max(1, dmg),
                             'minecraft:durability': {'max_durability': int(it.get('durability') or 500)},
                             'minecraft:can_destroy_in_creative': False, 'minecraft:enchantable': {'slot': 'sword', 'value': 14},
                             'minecraft:tags': {'tags': ['minecraft:is_sword']}}, name, 'equipment')
            elif cls in GUNS:
                cd = max(5, int(it.get('shotCooldown', 20)))
                s.item(iid, {'minecraft:max_stack_size': 1, 'minecraft:hand_equipped': True,
                             'minecraft:durability': {'max_durability': int(it.get('durability') or 300)},
                             'minecraft:cooldown': {'category': 'gun_' + iid, 'duration': cd / 20}}, name, 'equipment')
                guns[iid] = {'cd': cd, 'sp': min(4, it.get('bulletSpeed', 3.0)), 'dm': it.get('damageMultiplier', 1.0),
                             'bow': cls != 'ModGunItem'}
            elif 'slot' in it:
                slot, prot = SLOT[it['slot']]
                s.item(iid, {'minecraft:max_stack_size': 1, 'minecraft:wearable': {'slot': slot, 'protection': prot},
                             'minecraft:durability': {'max_durability': 400}, 'minecraft:enchantable': {'slot': 'armor_' + slot.split('.')[-1].replace('chest', 'torso'), 'value': 10}},
                       name, 'equipment')
                armor_vis += s.attachable(iid, it)
            elif cls in FOOD:
                n, sat = FOOD[cls]
                s.item(iid, {'minecraft:max_stack_size': 16, 'minecraft:food': {'nutrition': n, 'saturation_modifier': sat, 'can_always_eat': cls in DRINK},
                             'minecraft:use_modifiers': {'use_duration': 1.6, 'movement_modifier': 0.35},
                             'minecraft:use_animation': 'drink' if cls in DRINK else 'eat'}, name)
            elif cls == 'AkumaNoMiBoxItem':
                boxes.append(iid); s.item(iid, {'minecraft:max_stack_size': 16}, name)
            else:
                s.item(iid, {'minecraft:max_stack_size': 1 if cls in ('CharacterCreatorItem', 'DFEncyclopediaItem', 'BellyPouchItem', 'ExtolPouchItem') else 64}, name)
        s.guns, s.boxes = guns, boxes
        s.report['items'] = len(s.item_ids); s.report['items_skipped'] = skipped; s.report['armor_with_model'] = armor_vis

    def attachable(s, iid, it):
        """standard 2-layer armour textures map straight onto Bedrock's vanilla armour geometry."""
        mat = it.get('material', '')
        layer = 'bot' if it['slot'] == 'leggings' else 'top'
        src = os.path.join(s.A, 'textures', 'models', 'armor', f'{mat}_{layer}.png')
        if it['cls'] != 'ModArmorItem' or not os.path.exists(src): return 0
        w, h = Image.open(src).size
        if w != 2 * h: return 0
        copy(src, os.path.join(s.rp, 'textures', 'mmnm', 'armor', f'{mat}_{layer}.png'))
        part = it['slot']; var = {'helmet': 'helmet', 'chestplate': 'chest', 'leggings': 'leg', 'boots': 'boot'}[part]
        jdump(os.path.join(s.rp, 'attachables', iid + '.json'), {'format_version': '1.8.0', 'minecraft:attachable': {'description': {
            'identifier': f'{NS}:{iid}', 'materials': {'default': 'armor', 'enchanted': 'armor_enchanted'},
            'textures': {'default': f'textures/mmnm/armor/{mat}_{layer}', 'enchanted': 'textures/misc/enchanted_item_glint'},
            'geometry': {'default': 'geometry.humanoid.armor.' + part},
            'scripts': {'parent_setup': f'variable.{var}_layer_visible = 0.0;'}, 'render_controllers': ['controller.render.armor']}}})
        return 1

    # ------------------------------------------------------------- abilities
    EFFECTS = {  # java effect -> (bedrock effect, amplifier, on_self)
        'MOVEMENT_BLOCKED': ('slowness', 6, 0), 'MOVEMENT_SLOWDOWN': ('slowness', 1, 0), 'DIZZY': ('nausea', 0, 0), 'WEAKNESS': ('weakness', 1, 0),
        'POISON': ('poison', 0, 0), 'DIG_SLOWDOWN': ('mining_fatigue', 1, 0), 'CONFUSION': ('nausea', 0, 0), 'FROZEN': ('slowness', 6, 0),
        'UNCONSCIOUS': ('blindness', 0, 0), 'FROSTBITE': ('slowness', 2, 0), 'SMOKE': ('blindness', 0, 0), 'BLINDNESS': ('blindness', 0, 0),
        'VANISH': ('invisibility', 0, 1), 'NORO_SLOWNESS': ('slowness', 4, 0), 'NIGHT_VISION': ('night_vision', 0, 1), 'PARALYSIS': ('slowness', 6, 0),
        'REGENERATION': ('regeneration', 1, 1), 'ANTI_KNOCKBACK': ('resistance', 0, 1), 'DOKU_POISON': ('fatal_poison', 1, 0), 'GRABBED': ('slowness', 6, 0),
        'SUKE_INVISIBILITY': ('invisibility', 0, 1), 'MOVEMENT_SPEED': ('speed', 1, 1), 'CANDY_STUCK': ('slowness', 6, 0), 'CANDLE_LOCK': ('slowness', 6, 0),
        'STICKY': ('slowness', 3, 0), 'BIND': ('slowness', 6, 0), 'DEHYDRATION': ('weakness', 1, 0), 'BLEEDING': ('wither', 0, 0), 'LOVESTRUCK': ('slowness', 6, 0),
        'DAMAGE_RESISTANCE': ('resistance', 1, 1), 'TENSION_HORMONE': ('strength', 1, 1), 'HUNGER': ('hunger', 1, 0), 'REDUCED_FALL': ('slow_falling', 0, 1),
        'DAMAGE_BOOST': ('strength', 1, 1), 'DIG_SPEED': ('haste', 1, 1), 'DOA_INVISIBILITY': ('invisibility', 0, 1), 'CHIYU_HORMONE': ('regeneration', 2, 1),
        'HEALTH_BOOST': ('health_boost', 1, 1), 'WITHER': ('wither', 0, 0), 'LEVITATION': ('levitation', 1, 0), 'DRUNK': ('nausea', 0, 0),
        'NEGATIVE': ('weakness', 2, 0), 'MUMMY_VIRUS': ('wither', 0, 0), 'OIL_COVERED': ('slowness', 1, 0), 'LAUNCHED': ('levitation', 3, 0),
        'TOKUDAI_CANDLE_POISON': ('poison', 1, 0), 'GANMEN_SEICHO_HORMONE': ('slowness', 3, 0), 'WASHED': ('weakness', 1, 0), 'FATIGUE_EFFECT': ('mining_fatigue', 1, 0)}
    PARTICLE_PKG = {'yami': 'darkness', 'sabi': 'rust', 'doctor': 'medic', 'jiki': 'magnet', 'kage': 'darkness_static', 'suna': 'suna2', 'goro': 'goro2',
                    'ope': 'simple_circle', 'bari': 'double_circle', 'nikyu': 'circle', 'electro': 'goro2_yellow'}
    PARTICLE_EL = {'FIRE': 'minecraft:basic_flame_particle', 'MAGMA': 'minecraft:lava_particle', 'ICE': 'minecraft:snowflake_particle',
                   'LIGHTNING': 'minecraft:electric_spark_particle', 'LIGHT': 'minecraft:endrod', 'POISON': 'minecraft:villager_angry',
                   'WATER': 'minecraft:water_splash_particle', 'SMOKE': 'minecraft:basic_smoke_particle', 'EXPLOSION': 'minecraft:basic_smoke_particle',
                   'SHOCKWAVE': 'minecraft:basic_crit_particle', 'AIR': 'minecraft:basic_smoke_particle'}

    def classify(s, a):
        sup, comps, k = a['sup'], set(a['comps']), a['consts']
        def first(*names, default=None):
            for n in names:
                if n in k and k[n] is not None: return k[n]
                if n in a and a[n] is not None: return a[n]
            return default
        passive = sup in extract.PASSIVE_SUPERS or sup.endswith('ImmunityAbility') or a['id'].endswith(('_immunities', '_immunity', '_block_bypassing', '_passive_bonuses'))
        if passive: t = 'passive'
        elif sup == 'MorphAbility' or 'Morph' in comps: t = 'morph'
        elif sup == 'ItemAbility' and a.get('weapon'): t = 'item'
        elif 'Projectile' in comps or sup in ('WeatherBallAbility', 'RepeaterAbility', 'ChargedTempoAbility', 'TempoAbility'): t = 'proj'
        elif sup == 'PunchAbility' or 'GrabEntity' in comps: t = 'punch'
        elif sup == 'GuardAbility': t = 'guard'
        elif sup in ('FlyAbility', 'PropelledFlightAbility', 'RideableAbility') or a['id'].endswith(('_travel', '_flight')): t = 'fly'
        elif 'Teleport' in comps: t = 'tp'
        elif sup in ('DashAbility', 'RunningSmashAbility', 'SlidingAbility') or 'Dash' in comps: t = 'dash'
        elif sup == 'DropHitAbility': t = 'slam'
        elif 'Heal' in comps: t = 'heal'
        elif sup == 'WallAbility': t = 'wall'
        elif comps & {'DealDamage', 'Explosion', 'HitTracker'} or ('Range' in comps and 'ChangeStats' not in comps): t = 'aoe'
        elif comps & {'Continuous', 'ChangeStats', 'SkinOverlay'}: t = 'buff'
        else: t = 'util'
        o = {'n': a['name'], 't': t, 'g': a['pkg'], 'k': a['category'][0]}
        if t == 'passive': return o
        cd = first('COOLDOWN', 'MAX_COOLDOWN', 'NO_GEAR_COOLDOWN', 'LONG_COOLDOWN', 'NORMAL_COOLDOWN', 'MIN_COOLDOWN', default=100)
        o['cd'] = int(max(10, min(cd, 2400)))
        dmg = first('NO_GEAR_PROJ_DAMAGE', 'PROJECTILE_DAMAGE', 'DAMAGE', 'pdmg', 'MAX_DAMAGE', 'NORMAL_DAMAGE', 'mdmg', 'hdmg', 'EXPLOSION_DAMAGE')
        if t in ('proj', 'punch', 'aoe', 'dash', 'slam'): o['d'] = round(float(dmg if dmg and dmg > 0 else 8), 1)
        if t in ('aoe', 'slam', 'heal', 'wall', 'dash', 'punch'):
            r = first('RANGE', 'AREA_SIZE', 'RADIUS', 'RANGE_XZ', 'EXPLOSION_RADIUS', default=5 if t != 'punch' else 0)
            if r: o['r'] = round(max(2, min(float(r), 24)), 1)
        if t in ('buff', 'morph', 'guard', 'fly', 'item', 'wall', 'util'):
            du = first('HOLD_TIME', 'CONTINUITY', 'EFFECT_TIME', 'PROTECTION_TIME', default=300)
            o['du'] = int(1200 if du <= 0 else max(40, min(du, 2400)))
        ex = first('EXPLOSION_SIZE', 'EXPLOSION_RADIUS', 'EXPLOSION_RANGE')
        if ex is None and ('Explosion' in comps or a.get('pexplode')): ex = 2
        if ex: o['ex'] = round(max(1, min(float(ex), 6)), 1)
        if t == 'proj':
            n = first('TRIGGERS', 'REPEATER_TRIGGERS', default=5 if ('Repeater' in comps or sup == 'RepeaterAbility') else 1)
            if n > 1: o['c'] = int(min(n, 12)); o['iv'] = int(max(1, min(first('INTERVAL', 'REPEATER_INTERVAL', default=3), 10)))
            sp = max(1.0, min(float(a.get('pspeed') or 2.0), 4.0)); o['sp'] = round(sp, 2)
            o['lf'] = int(max(8, min(float(a.get('plife') or 40), 64 / sp)))
        ch = first('CHARGE_TIME')
        if ch and ch > 0: o['ch'] = int(min(ch, 30))
        tp = first('MAX_TELEPORT_DISTANCE', 'DISTANCE')
        if t == 'tp': o['r'] = round(min(float(tp or 30), 64), 1)
        if a['element'] != 'NONE': o['el'] = a['element'].lower()
        pk = s.PARTICLE_PKG.get(a['pkg'], a['pkg'])
        if pk in s.particles: o['p'] = f'{NS}:{pk}'
        elif a['element'] in s.PARTICLE_EL: o['p'] = s.PARTICLE_EL[a['element']]
        snd = [x.lower() for x in a['sounds'] if x.lower() in s.sounds]
        if snd: o['s'] = 'mmnm.' + snd[0]
        fx, seen = [], set()
        for e in a['effects']:
            m = s.EFFECTS.get(e)
            if m and m[0] not in seen:
                seen.add(m[0]); fx.append([m[0], m[1], m[2]])
        if fx: o['fx'] = fx[:4]
        if t == 'item':
            w = s.data['items'].get(a['weapon'], {}).get('bid')
            if not w: o['t'] = 'buff'
            else: o['w'] = w
        if t == 'wall':
            o['b'] = 'minecraft:packed_ice' if a['pkg'] == 'hie' else 'minecraft:glass' if a['pkg'] == 'bari' else 'minecraft:sandstone' if a['pkg'] == 'suna' else 'minecraft:stone'
        return o

    def build_abilities(s):
        ab, groups = {}, {}
        skip = {'test', 'command', 'dummy'}
        for aid, a in sorted(s.data['abilities'].items()):
            if aid in skip or a['category'] in ('FACTION', 'EQUIPMENT'): continue
            o = s.classify(a); ab[aid] = o
            if o['t'] == 'passive': continue
            icon = 'abilities/' + aid if os.path.exists(os.path.join(s.A, 'textures', 'abilities', aid + '.png')) else 'items/ability_icon' if False else None
            if not (icon and s.add_icon('ab_' + aid, [icon], 'ab')):
                s.item_tex['mmnm_ab_' + aid] = {'textures': 'textures/mmnm/ab/_default'}
            o['i'] = 1 if icon else 0
            s.item('ab_' + aid, {'minecraft:max_stack_size': 1, 'minecraft:hand_equipped': False, 'minecraft:can_destroy_in_creative': False,
                                 'minecraft:cooldown': {'category': 'ab_' + aid, 'duration': o['cd'] / 20},
                                 'minecraft:glint': False}, '§b' + o['n'], 'none')
            desc = a['desc'].replace("\\'", "'").replace('§', '')
            if desc: o['ds'] = re.sub(r'\s+', ' ', desc)[:160]
            if a['category'] != 'DEVIL_FRUITS': groups.setdefault(a['pkg'], []).append(aid)
        # default icon
        img = Image.new('RGBA', (32, 32), (40, 40, 60, 255)); img.paste((120, 200, 255, 255), (12, 6, 20, 22)); img.paste((120, 200, 255, 255), (12, 24, 20, 28))
        os.makedirs(os.path.join(s.rp, 'textures', 'mmnm', 'ab'), exist_ok=True); img.save(os.path.join(s.rp, 'textures', 'mmnm', 'ab', '_default.png'))
        fruits = {}
        TYPE = {'PARAMECIA': 'Paramecia', 'LOGIA': 'Logia', 'ZOAN': 'Zoan', 'ANCIENT_ZOAN': 'Ancient Zoan', 'MYTHICAL_ZOAN': 'Mythical Zoan'}
        for f in s.data['fruits']:
            fid = f['id']
            layers = s.model_texture(fid)
            if not layers or not s.add_icon(fid, layers): continue
            name = s.lang.get(f'item.{NS}.{fid}', f['name'])
            s.item(fid, {'minecraft:max_stack_size': 1, 'minecraft:food': {'nutrition': 1, 'saturation_modifier': 0.1, 'can_always_eat': True},
                         'minecraft:use_modifiers': {'use_duration': 1.6, 'movement_modifier': 0.35}, 'minecraft:use_animation': 'eat'}, name)
            ids = [x for x in f['abilities'] if x in ab]
            pas = set()
            for x in ids:
                if ab[x]['t'] != 'passive': continue
                if 'heat' in x or 'magu' in x or 'mera' in x: pas.add('fire_resistance')
                if 'night_vision' in x: pas.add('night_vision')
                if 'no_fall' in x or 'bouncy' in x: pas.add('nofall')
                if 'poison' in x or 'doku' in x: pas.add('poisonimmune')
            fruits[fid] = {'n': name, 'tier': int(f['tier']), 'type': TYPE.get(f['type'], 'Paramecia'), 'a': [x for x in ids if ab[x]['t'] != 'passive'],
                           'logia': f['type'] == 'LOGIA', 'pas': sorted(pas)}
        s.abilities, s.fruits, s.groups = ab, fruits, groups
        s.report['abilities_active'] = sum(1 for v in ab.values() if v['t'] != 'passive'); s.report['fruits'] = len(fruits)
        import collections; s.report['ability_types'] = dict(collections.Counter(v['t'] for v in ab.values()))

    # ----------------------------------------------------- particles / sounds
    def build_particles(s):
        s.particles = set()
        src = os.path.join(s.A, 'textures', 'particle')
        for f in sorted(os.listdir(src)):
            if not f.endswith('.png'): continue
            n = f[:-4]; w, h = Image.open(os.path.join(src, f)).size
            copy(os.path.join(src, f), os.path.join(s.rp, 'textures', 'mmnm', 'particle', f))
            frames = max(1, h // w)
            uv = {'texture_width': w, 'texture_height': h}
            if frames > 1: uv['flipbook'] = {'base_UV': [0, 0], 'size_UV': [w, w], 'step_UV': [0, w], 'max_frame': frames, 'stretch_to_lifetime': True}
            else: uv.update({'uv': [0, 0], 'uv_size': [w, h]})
            size = '0.10 + 0.22*(1 - variable.particle_age/variable.particle_lifetime)'
            jdump(os.path.join(s.rp, 'particles', n + '.json'), {'format_version': '1.10.0', 'particle_effect': {
                'description': {'identifier': f'{NS}:{n}', 'basic_render_parameters': {'material': 'particles_alpha', 'texture': f'textures/mmnm/particle/{n}'}},
                'components': {'minecraft:emitter_rate_instant': {'num_particles': 3}, 'minecraft:emitter_lifetime_once': {'active_time': 0.1},
                               'minecraft:emitter_shape_sphere': {'radius': 0.3, 'direction': 'outwards'},
                               'minecraft:particle_lifetime_expression': {'max_lifetime': 'math.random(0.35, 0.7)'},
                               'minecraft:particle_initial_speed': 0.7, 'minecraft:particle_motion_dynamic': {'linear_drag_coefficient': 2.5},
                               'minecraft:particle_appearance_billboard': {'size': [size, size], 'facing_camera_mode': 'lookat_xyz', 'uv': uv},
                               'minecraft:particle_appearance_lighting': {}}}})
            s.particles.add(n)

    def build_sounds(s):
        js = json.load(open(os.path.join(s.A, 'sounds.json'))); defs = {}
        for key, v in js.items():
            files = []
            for e in v.get('sounds', []):
                name = (e if isinstance(e, str) else e.get('name', '')).split(':')[-1]
                p = os.path.join(s.A, 'sounds', name + '.ogg')
                if os.path.exists(p):
                    copy(p, os.path.join(s.rp, 'sounds', 'mmnm', name.replace('/', '_') + '.ogg')); files.append('sounds/mmnm/' + name.replace('/', '_'))
            if files: defs['mmnm.' + key] = {'category': 'player', 'sounds': files}
        jdump(os.path.join(s.rp, 'sounds', 'sound_definitions.json'), {'format_version': '1.14.0', 'sound_definitions': defs})
        s.sounds = {k[5:] for k in defs}; s.report['sounds'] = len(defs)

    # ----------------------------------------------------------------- blocks
    def build_blocks(s):
        done, skipped = [], []
        for f in sorted(os.listdir(os.path.join(s.A, 'blockstates'))):
            bid = f[:-5]; bs = json.load(open(os.path.join(s.A, 'blockstates', f)))
            var = bs.get('variants')
            if not var: skipped.append(bid); continue
            v = next(iter(var.values())); v = v[0] if isinstance(v, list) else v
            mp = os.path.join(s.A, 'models', 'block', v['model'].split('/')[-1] + '.json')
            if not v['model'].startswith(NS) or not os.path.exists(mp): skipped.append(bid); continue
            m = json.load(open(mp)); par = (m.get('parent') or '').split('/')[-1]; t = m.get('textures', {})
            def tex(key):
                ref = t.get(key)
                if not ref or not ref.startswith(NS): return None
                p = os.path.join(s.A, 'textures', ref.split(':')[1] + '.png')
                if not os.path.exists(p): return None
                n = os.path.basename(p)[:-4]; im = Image.open(p)
                if im.height > im.width: im.crop((0, 0, im.width, im.width)).save(os.path.join(s.mk('textures/mmnm/blocks'), n + '.png'))
                else: copy(p, os.path.join(s.rp, 'textures', 'mmnm', 'blocks', n + '.png'))
                s.terrain['mmnm_' + n] = {'textures': f'textures/mmnm/blocks/{n}'}; return 'mmnm_' + n
            method = 'alpha_test' if par == 'leaves' else 'opaque'
            if par in ('cube_all', 'leaves') and tex('all'): mi = {'*': {'texture': tex('all'), 'render_method': method}}
            elif par in ('cube_column', 'cube_column_horizontal') and tex('side') and tex('end'):
                mi = {'*': {'texture': tex('side'), 'render_method': 'opaque'}, 'up': {'texture': tex('end'), 'render_method': 'opaque'}, 'down': {'texture': tex('end'), 'render_method': 'opaque'}}
            else: skipped.append(bid); continue
            hard = 50 if 'kairoseki_block' in bid or 'poneglyph' in bid else 3 if 'ore' in bid or 'kairoseki' in bid else 1.5 if 'mangrove' in bid else 0.8
            comps = {'minecraft:geometry': 'minecraft:geometry.full_block', 'minecraft:material_instances': mi,
                     'minecraft:destructible_by_mining': {'seconds_to_destroy': hard}, 'minecraft:destructible_by_explosion': {'explosion_resistance': 1200 if hard == 50 else 6}}
            if bid.endswith('kairoseki_ore'):
                comps['minecraft:loot'] = 'loot_tables/mmnm/kairoseki_ore.json'
            if 'leaves' in bid: comps['minecraft:light_dampening'] = 1
            jdump(os.path.join(s.bp, 'blocks', bid + '.json'), {'format_version': FMT, 'minecraft:block': {
                'description': {'identifier': f'{NS}:{bid}', 'menu_category': {'category': 'construction' if 'ore' not in bid else 'nature'}}, 'components': comps}})
            s.block_ids.add(bid); done.append(bid)
            s.texts[f'tile.{NS}:{bid}.name'] = s.lang.get(f'block.{NS}.{bid}', bid.replace('_', ' ').title())
        if 'kairoseki_ore' in s.block_ids and 'kairoseki' in s.item_ids:
            jdump(os.path.join(s.bp, 'loot_tables', 'mmnm', 'kairoseki_ore.json'), {'pools': [{'rolls': 1, 'entries': [{'type': 'item', 'name': f'{NS}:kairoseki', 'weight': 1,
                  'functions': [{'function': 'set_count', 'count': {'min': 1, 'max': 2}}]}]}]})
            rules = [{'places_block': f'{NS}:kairoseki_ore', 'may_replace': ['minecraft:stone']}]
            if 'deepslate_kairoseki_ore' in s.block_ids: rules.append({'places_block': f'{NS}:deepslate_kairoseki_ore', 'may_replace': ['minecraft:deepslate']})
            jdump(os.path.join(s.bp, 'features', 'kairoseki_ore_feature.json'), {'format_version': '1.13.0', 'minecraft:ore_feature': {
                'description': {'identifier': f'{NS}:kairoseki_ore_feature'}, 'count': 5, 'replace_rules': rules}})
            jdump(os.path.join(s.bp, 'feature_rules', 'overworld_kairoseki_ore.json'), {'format_version': '1.13.0', 'minecraft:feature_rules': {
                'description': {'identifier': f'{NS}:overworld_kairoseki_ore', 'places_feature': f'{NS}:kairoseki_ore_feature'},
                'conditions': {'placement_pass': 'underground_pass', 'minecraft:biome_filter': [{'any_of': [
                    {'test': 'has_biome_tag', 'operator': '==', 'value': 'overworld'}, {'test': 'has_biome_tag', 'operator': '==', 'value': 'overworld_generation'}]}]},
                'distribution': {'iterations': 3, 'coordinate_eval_order': 'zyx', 'x': {'distribution': 'uniform', 'extent': [0, 16]},
                                 'y': {'distribution': 'uniform', 'extent': [-40, 30]}, 'z': {'distribution': 'uniform', 'extent': [0, 16]}}}})
        s.report['blocks'] = done; s.report['blocks_skipped'] = skipped

    def mk(s, rel):
        p = os.path.join(s.rp, rel); os.makedirs(p, exist_ok=True); return p

    # ---------------------------------------------------------------- recipes
    def build_recipes(s):
        n = 0
        def ing(x):
            if isinstance(x, list): x = x[0] if x else {}
            i = x.get('item') if isinstance(x, dict) else x
            if not i or not isinstance(i, str): return None
            ns, _, name = i.partition(':')
            if ns == NS: return i if (name in s.item_ids or name in s.block_ids) else None
            return i if ns == 'minecraft' else None
        for f in sorted(os.listdir(os.path.join(s.D, 'recipe'))):
            r = json.load(open(os.path.join(s.D, 'recipe', f))); t = r.get('type', '').split(':')[-1]; rid = f[:-5]
            res = r.get('result', {}); out = res.get('id') or res.get('item') if isinstance(res, dict) else res
            if not out or not ing({'item': out}): continue
            result = {'item': out, 'count': res.get('count', 1) if isinstance(res, dict) else 1}
            desc = {'identifier': f'{NS}:{rid}'}; unlock = [{'context': 'AlwaysUnlocked'}]
            if t == 'crafting_shaped':
                key = {k: ing(v) for k, v in r['key'].items()}
                if None in key.values(): continue
                obj = {'minecraft:recipe_shaped': {'description': desc, 'tags': ['crafting_table'], 'pattern': r['pattern'],
                       'key': {k: {'item': v} for k, v in key.items()}, 'unlock': unlock, 'result': result}}
            elif t == 'crafting_shapeless':
                ings = [ing(v) for v in r['ingredients']]
                if None in ings: continue
                obj = {'minecraft:recipe_shapeless': {'description': desc, 'tags': ['crafting_table'], 'ingredients': [{'item': v} for v in ings], 'unlock': unlock, 'result': result}}
            elif t in ('smelting', 'smoking', 'campfire_cooking'):
                i = ing(r['ingredient'])
                if not i: continue
                obj = {'minecraft:recipe_furnace': {'description': desc, 'tags': {'smelting': ['furnace'], 'smoking': ['smoker'], 'campfire_cooking': ['campfire', 'soul_campfire']}[t],
                       'input': i, 'output': out}}
            else: continue
            obj['format_version'] = FMT; jdump(os.path.join(s.bp, 'recipes', rid + '.json'), obj); n += 1
        s.report['recipes'] = n

    # --------------------------------------------------------------- entities
    SKINS = {'marine_grunt': 'marine#5', 'marine_brute': 'marine#5', 'marine_sniper': 'marine#5', 'marine_captain': 'marine_captain#5', 'marine_trader': 'marine_trader#2',
             'marine_vice_admiral': 'marine_vice_admiral#3', 'pacifista': 'pacifista', 'celestial_dragon': 'celestial_dragon#2', 'pirate_grunt': 'pirate#8',
             'pirate_brute': 'pirate#8', 'pirate_captain': 'pirate_captain#8', 'pirate_trader': 'pirate_trader#2', 'pirate_notorious_captain': 'pirate_captain#8',
             'alvida2': 'alvida_slim', 'bandit_grunt': 'bandit#3', 'bandit_brute': 'bandit#3', 'bandit_sniper': 'bandit#3', 'bandit_leader': 'bandit#3',
             'swordsman_trainer': 'swordsman_trainer#3', 'sniper_trainer': 'bow_master#2', 'art_of_weather_trainer': 'weather_wizard#1', 'doctor_trainer': 'doctor#2',
             'brawler_trainer': 'brawler_trainer#2', 'black_leg_trainer': 'black_leg_trainer#2', 'skypiean_civilian': 'skypiean_civilian#3',
             'skypiean_trader': 'skypiean_trader#2', 'barkeeper': 'barkeeper#1', 'mr_5': 'mr5', 'mr_3': 'mr3', 'mr_1': 'mr1', 'mr_0': 'mr0'}
    def build_entities(s):
        geo = {'format_version': '1.12.0', 'minecraft:geometry': [{'description': {'identifier': 'geometry.mmnm.humanoid', 'texture_width': 64, 'texture_height': 64,
               'visible_bounds_width': 2, 'visible_bounds_height': 3, 'visible_bounds_offset': [0, 1, 0]}, 'bones': [
            {'name': 'root', 'pivot': [0, 0, 0]},
            {'name': 'body', 'parent': 'root', 'pivot': [0, 24, 0], 'cubes': [{'origin': [-4, 12, -2], 'size': [8, 12, 4], 'uv': [16, 16]}, {'origin': [-4, 12, -2], 'size': [8, 12, 4], 'uv': [16, 32], 'inflate': 0.25}]},
            {'name': 'head', 'parent': 'body', 'pivot': [0, 24, 0], 'cubes': [{'origin': [-4, 24, -4], 'size': [8, 8, 8], 'uv': [0, 0]}, {'origin': [-4, 24, -4], 'size': [8, 8, 8], 'uv': [32, 0], 'inflate': 0.5}]},
            {'name': 'rightArm', 'parent': 'body', 'pivot': [-5, 22, 0], 'cubes': [{'origin': [-8, 12, -2], 'size': [4, 12, 4], 'uv': [40, 16]}, {'origin': [-8, 12, -2], 'size': [4, 12, 4], 'uv': [40, 32], 'inflate': 0.25}]},
            {'name': 'rightItem', 'parent': 'rightArm', 'pivot': [-6, 15, 1], 'locators': {'lead_hold': [-6, 15, 1]}},
            {'name': 'leftArm', 'parent': 'body', 'pivot': [5, 22, 0], 'cubes': [{'origin': [4, 12, -2], 'size': [4, 12, 4], 'uv': [32, 48]}, {'origin': [4, 12, -2], 'size': [4, 12, 4], 'uv': [48, 48], 'inflate': 0.25}]},
            {'name': 'rightLeg', 'parent': 'root', 'pivot': [-1.9, 12, 0], 'cubes': [{'origin': [-3.9, 0, -2], 'size': [4, 12, 4], 'uv': [0, 16]}, {'origin': [-3.9, 0, -2], 'size': [4, 12, 4], 'uv': [0, 32], 'inflate': 0.25}]},
            {'name': 'leftLeg', 'parent': 'root', 'pivot': [1.9, 12, 0], 'cubes': [{'origin': [-0.1, 0, -2], 'size': [4, 12, 4], 'uv': [16, 48]}, {'origin': [-0.1, 0, -2], 'size': [4, 12, 4], 'uv': [0, 48], 'inflate': 0.25}]}]}]}
        jdump(os.path.join(s.rp, 'models', 'entity', 'mmnm_humanoid.geo.json'), geo)
        sw = 'math.cos(query.modified_distance_moved * 38.17) * math.min(query.modified_move_speed, 1.0) * 50'
        jdump(os.path.join(s.rp, 'animations', 'mmnm_npc.animation.json'), {'format_version': '1.8.0', 'animations': {
            'animation.mmnm.npc.walk': {'loop': True, 'bones': {'rightArm': {'rotation': [sw, 0, 0]}, 'leftArm': {'rotation': ['-(' + sw + ')', 0, 0]},
                                                               'rightLeg': {'rotation': ['-(' + sw + ')', 0, 0]}, 'leftLeg': {'rotation': [sw, 0, 0]}}},
            'animation.mmnm.npc.look': {'loop': True, 'bones': {'head': {'rotation': ['query.target_x_rotation', 'query.target_y_rotation', 0]}}},
            'animation.mmnm.npc.attack': {'loop': True, 'bones': {'rightArm': {'rotation': ['-math.sin(variable.attack_time * 180) * 90', 0, 0]}}}}})
        for n in range(1, 9):
            jdump(os.path.join(s.rp, 'render_controllers', f'mmnm_npc_{n}.render_controllers.json'), {'format_version': '1.8.0', 'render_controllers': {
                f'controller.render.mmnm_npc_{n}': {'arrays': {'textures': {'Array.skins': [f'Texture.t{i}' for i in range(n)]}}, 'geometry': 'Geometry.default',
                'materials': [{'*': 'Material.default'}], 'textures': ['Array.skins[query.variant]']}}})
        ROLE = {'grunt': (20, 3, 1.0, 0.25), 'brute': (40, 6, 1.2, 0.23), 'sniper': (20, 2, 1.0, 0.25), 'captain': (80, 8, 1.05, 0.28), 'leader': (80, 8, 1.05, 0.28),
                'vice_admiral': (200, 12, 1.1, 0.3), 'notorious': (140, 10, 1.1, 0.3), 'pacifista': (250, 14, 2.0, 0.22), 'boss': (150, 10, 1.05, 0.3), 'passive': (30, 0, 1.0, 0.25)}
        EGG = {'marine': ('#f4f4f4', '#2b4a9c'), 'pirate': ('#2a2a2a', '#b02020'), 'bandit': ('#6b4a2a', '#2a2a2a'), 'civilian': ('#c8a070', '#3a7a3a'),
               'worldgov': ('#f4f4f4', '#d0b040'), 'boss': ('#3a1a4a', '#d02020')}
        ENEMY = {'marine': ['mmnm_pirate', 'mmnm_bandit'], 'pirate': ['mmnm_marine', 'mmnm_bandit'], 'bandit': ['mmnm_marine', 'mmnm_pirate'], 'boss': ['mmnm_marine']}
        PTAG = {'marine': ['mmnm_f_pirate', 'mmnm_f_bandit', 'mmnm_f_revolutionary'], 'pirate': None, 'bandit': None, 'boss': None}
        made, skipped, spawns = [], [], 0
        for m in s.data['mobs']:
            eid, fac = m['id'], m['faction']
            spec = s.SKINS.get(eid, eid); base, _, cnt = spec.partition('#')
            names = [f'{base}{i}' for i in range(1, int(cnt) + 1)] if cnt else [base]
            srcs = [os.path.join(s.A, 'textures', 'models', n + '.png') for n in names]
            if fac == 'animal' or not all(os.path.exists(p) for p in srcs): skipped.append(m['name']); continue
            sz = Image.open(srcs[0]).size
            if sz[0] != sz[1]: skipped.append(m['name']); continue
            for n, p in zip(names, srcs): copy(p, os.path.join(s.rp, 'textures', 'mmnm', 'entity', n + '.png'))
            role = next((r for r in ('vice_admiral', 'notorious', 'pacifista', 'grunt', 'brute', 'sniper', 'captain', 'leader') if r in eid), None)
            if fac in ('civilian', 'worldgov') or 'trader' in eid or 'trainer' in eid: role = 'passive'
            role = role or 'boss'
            hp, atk, scale, speed = ROLE[role]; hostile = role != 'passive'
            fam = ['mmnm_npc', 'mmnm_' + fac, 'mob'] + (['mmnm_trainer'] if 'trainer' in eid else []) + (['mmnm_haki'] if role in ('vice_admiral', 'boss', 'notorious') else [])
            egg = EGG.get(fac, EGG['civilian'])
            jdump(os.path.join(s.rp, 'entity', eid + '.entity.json'), {'format_version': '1.10.0', 'minecraft:client_entity': {'description': {
                'identifier': f'{NS}:{eid}', 'materials': {'default': 'entity_alphatest'}, 'textures': {f't{i}': f'textures/mmnm/entity/{n}' for i, n in enumerate(names)},
                'geometry': {'default': 'geometry.mmnm.humanoid'}, 'render_controllers': [f'controller.render.mmnm_npc_{len(names)}'],
                'spawn_egg': {'base_color': egg[0], 'overlay_color': egg[1]},
                'animations': {'walk': 'animation.mmnm.npc.walk', 'look': 'animation.mmnm.npc.look', 'attack': 'animation.mmnm.npc.attack'},
                'scripts': {'animate': ['walk', 'look', {'attack': 'variable.attack_time > 0.0'}]}}}})
            c = {'minecraft:type_family': {'family': fam}, 'minecraft:collision_box': {'width': 0.6, 'height': 1.9},
                 'minecraft:health': {'value': hp, 'max': hp}, 'minecraft:movement': {'value': speed}, 'minecraft:navigation.walk': {'can_path_over_water': True, 'can_open_doors': True, 'avoid_water': True},
                 'minecraft:movement.basic': {}, 'minecraft:jump.static': {}, 'minecraft:can_climb': {}, 'minecraft:physics': {}, 'minecraft:pushable': {'is_pushable': True, 'is_pushable_by_piston': True},
                 'minecraft:nameable': {}, 'minecraft:breathable': {'total_supply': 15, 'suffocate_time': 0}, 'minecraft:conditional_bandwidth_optimization': {},
                 'minecraft:loot': {'table': f'loot_tables/mmnm/npc_{role}.json'}, 'minecraft:experience_reward': {'on_death': str(max(3, hp // 8)) if hostile else '0'},
                 'minecraft:behavior.float': {'priority': 0}, 'minecraft:behavior.random_stroll': {'priority': 7, 'speed_multiplier': 0.8},
                 'minecraft:behavior.look_at_player': {'priority': 8, 'look_distance': 6, 'probability': 0.02}, 'minecraft:behavior.random_look_around': {'priority': 9},
                 'minecraft:variant': {'value': 0}}
            if role in ('grunt', 'brute', 'sniper'):
                c['minecraft:despawn'] = {'despawn_from_distance': {'min_distance': 48, 'max_distance': 96}}
            else: c['minecraft:persistent'] = {}
            if hostile:
                targets = [{'filters': {'any_of': [{'test': 'is_family', 'subject': 'other', 'value': f} for f in ENEMY.get(fac, [])]}, 'max_dist': 20}]
                if fac == 'marine':
                    targets.append({'filters': {'all_of': [{'test': 'is_family', 'subject': 'other', 'value': 'player'}, {'any_of': [{'test': 'has_tag', 'subject': 'other', 'value': t} for t in PTAG['marine']]}]}, 'max_dist': 18})
                else:
                    targets.append({'filters': {'all_of': [{'test': 'is_family', 'subject': 'other', 'value': 'player'}, {'test': 'has_tag', 'subject': 'other', 'operator': '!=', 'value': 'mmnm_f_' + fac}]}, 'max_dist': 18})
                c['minecraft:attack'] = {'damage': atk}
                c['minecraft:behavior.hurt_by_target'] = {'priority': 1}
                c['minecraft:behavior.nearest_attackable_target'] = {'priority': 2, 'must_see': True, 'reselect_targets': True, 'within_radius': 20, 'scan_interval': 20, 'entity_types': targets}
                if role == 'sniper':
                    c['minecraft:shooter'] = {'def': 'minecraft:arrow'}
                    c['minecraft:behavior.ranged_attack'] = {'priority': 3, 'attack_interval_min': 2, 'attack_interval_max': 4, 'attack_radius': 16, 'speed_multiplier': 1.0}
                else:
                    c['minecraft:behavior.melee_attack'] = {'priority': 3, 'speed_multiplier': 1.2, 'track_target': True}
            else:
                c['minecraft:behavior.panic'] = {'priority': 1, 'speed_multiplier': 1.3}
            if scale != 1.0: c['minecraft:scale'] = {'value': scale}
            groups = {f'v{i}': {'minecraft:variant': {'value': i}} for i in range(len(names))}
            ev = {'minecraft:entity_spawned': {'randomize': [{'weight': 1, 'add': {'component_groups': [g]}} for g in groups]}}
            jdump(os.path.join(s.bp, 'entities', eid + '.json'), {'format_version': '1.21.0', 'minecraft:entity': {'description': {
                'identifier': f'{NS}:{eid}', 'is_spawnable': True, 'is_summonable': True}, 'component_groups': groups, 'components': c, 'events': ev}})
            nm = s.lang.get(f'entity.{NS}.{eid}', m['name'])
            s.texts[f'entity.{NS}:{eid}.name'] = nm; s.texts[f'item.spawn_egg.entity.{NS}:{eid}.name'] = nm + ' Spawn Egg'
            made.append(eid)
            if role in ('grunt', 'brute', 'sniper', 'captain', 'leader') and fac in ('marine', 'pirate', 'bandit'):
                biome = {'marine': ['plains', 'beach', 'savanna'], 'pirate': ['beach', 'jungle', 'taiga', 'mesa'], 'bandit': ['forest', 'plains', 'desert']}[fac]
                weight = {'grunt': 6, 'brute': 2, 'sniper': 2, 'captain': 1, 'leader': 1}[role]
                jdump(os.path.join(s.bp, 'spawn_rules', eid + '.json'), {'format_version': '1.8.0', 'minecraft:spawn_rules': {'description': {'identifier': f'{NS}:{eid}', 'population_control': 'monster'},
                      'conditions': [{'minecraft:spawns_on_surface': {}, 'minecraft:brightness_filter': {'min': 7, 'max': 15, 'adjust_for_weather': False},
                                      'minecraft:difficulty_filter': {'min': 'easy', 'max': 'hard'}, 'minecraft:weight': {'default': weight},
                                      'minecraft:density_limit': {'surface': 2}, 'minecraft:herd': {'min_size': 1, 'max_size': 3 if role == 'grunt' else 1},
                                      'minecraft:biome_filter': {'any_of': [{'test': 'has_biome_tag', 'operator': '==', 'value': b} for b in biome]}}]}})
                spawns += 1
        # loot
        def entry(name, w, lo=1, hi=1): return {'type': 'item', 'name': name, 'weight': w, 'functions': [{'function': 'set_count', 'count': {'min': lo, 'max': hi}}]}
        has = lambda i: i in s.item_ids
        def pool(chance_entries, rolls=1):
            return {'rolls': rolls, 'entries': chance_entries}
        box = lambda t: f'{NS}:{s.boxes[t]}' if len(s.boxes) > t else None
        for role, (emp, pouch, b1, b2, b3) in {'grunt': (70, 28, 2, 0, 0), 'brute': (55, 40, 5, 0, 0), 'sniper': (65, 32, 3, 0, 0), 'captain': (20, 55, 18, 7, 0), 'leader': (20, 55, 18, 7, 0),
                                               'notorious': (0, 50, 25, 20, 5), 'vice_admiral': (0, 40, 25, 25, 10), 'pacifista': (0, 50, 20, 20, 10), 'boss': (0, 40, 25, 25, 10), 'passive': (100, 0, 0, 0, 0)}.items():
            e = [{'type': 'empty', 'weight': emp}] if emp else []
            if pouch and has('belly_pouch'): e.append(entry(f'{NS}:belly_pouch', pouch))
            for t, w in enumerate((b1, b2, b3)):
                if w and box(t): e.append(entry(box(t), w))
            pools = [pool(e)] if e else []
            if role != 'passive' and has('bullet'): pools.append(pool([{'type': 'empty', 'weight': 60}, entry(f'{NS}:bullet', 40, 1, 4)]))
            jdump(os.path.join(s.bp, 'loot_tables', 'mmnm', f'npc_{role}.json'), {'pools': pools})
        s.report['entities'] = len(made); s.report['entities_skipped'] = skipped; s.report['spawn_rules'] = spawns

    # ------------------------------------------------------------------ final
    def finish(s):
        jdump(os.path.join(s.rp, 'textures', 'item_texture.json'), {'resource_pack_name': 'mmnm', 'texture_name': 'atlas.items', 'texture_data': s.item_tex})
        jdump(os.path.join(s.rp, 'textures', 'terrain_texture.json'), {'resource_pack_name': 'mmnm', 'texture_name': 'atlas.terrain', 'padding': 8, 'num_mip_levels': 4, 'texture_data': s.terrain})
        jdump(os.path.join(s.rp, 'blocks.json'), {'format_version': '1.21.40', **{f'{NS}:{b}': {'sound': 'wood' if 'mangrove' in b else 'stone'} for b in sorted(s.block_ids)}})
        s.texts['pack.name'] = 'Mine Mine no Mi (Bedrock port)'; s.texts['itemGroup.name.mmnm'] = 'Mine Mine no Mi'
        os.makedirs(os.path.join(s.rp, 'texts'), exist_ok=True)
        LOC = {'en_us': 'en_US', 'de_de': 'de_DE', 'es_es': 'es_ES', 'fr_fr': 'fr_FR', 'ja_jp': 'ja_JP', 'pt_br': 'pt_BR', 'ru_ru': 'ru_RU', 'zh_cn': 'zh_CN'}
        for jl, bl in LOC.items():
            p = os.path.join(s.A, 'lang', jl + '.json')
            if not os.path.exists(p): continue
            tr = json.load(open(p, encoding='utf-8')); lines = []
            for k, v in sorted(s.texts.items()):
                m = re.match(r'(item|tile|entity)\.' + NS + r':([a-z0-9_]+)(\.name)?$', k)
                if m and jl != 'en_us':
                    jk = {'item': 'item', 'tile': 'block', 'entity': 'entity'}[m.group(1)] + f'.{NS}.' + m.group(2)
                    if m.group(2).startswith('ab_'): jk = f'ability.{NS}.' + m.group(2)[3:]; v = '§b' + tr[jk] if jk in tr else v
                    elif jk in tr: v = tr[jk]
                lines.append(f'{k}={v}'.replace('\n', ' '))
            open(os.path.join(s.rp, 'texts', bl + '.lang'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
        jdump(os.path.join(s.rp, 'texts', 'languages.json'), list(LOC.values()))
        # scripts
        sd = os.path.join(s.bp, 'scripts'); shutil.copytree(os.path.join(ROOT, 'src', 'scripts'), sd)
        data = {'ABILITIES': s.abilities, 'FRUITS': s.fruits, 'GROUPS': s.groups, 'GUNS': s.guns, 'BOXES': s.boxes,
                'ITEMS': {k: 1 for k in ('character_creator', 'belly_pouch', 'bullet', 'kairoseki_bullet', 'kairoseki', 'dense_kairoseki', 'devil_fruit_encyclopedia', 'pop_green') if k in s.item_ids}}
        with open(os.path.join(sd, 'data.js'), 'w', encoding='utf-8') as f:
            f.write('// GENERATED by tools/build.py from the Mine Mine no Mi jar - do not edit.\n')
            for k, v in data.items(): f.write(f'export const {k} = ' + json.dumps(v, separators=(',', ':'), ensure_ascii=False) + ';\n')
        icon = os.path.join(s.tmp, 'mine-mine-no-mi.png')
        for pack, kind in ((s.bp, 'bp'), (s.rp, 'rp')):
            if os.path.exists(icon): Image.open(icon).convert('RGBA').resize((256, 256)).save(os.path.join(pack, 'pack_icon.png'))
            man = {'format_version': 2, 'header': {'name': 'Mine Mine no Mi ' + ('BP' if kind == 'bp' else 'RP'),
                   'description': 'Unofficial Bedrock port of Mine Mine no Mi 0.11.0 (original mod by Wynd, FGpisces, Varian, Kaiyo). Personal use only.',
                   'uuid': UUID[kind], 'version': VERSION, 'min_engine_version': [1, 21, 90]}}
            if kind == 'bp':
                man['modules'] = [{'type': 'data', 'uuid': UUID['bp_data'], 'version': VERSION},
                                  {'type': 'script', 'language': 'javascript', 'uuid': UUID['bp_script'], 'version': VERSION, 'entry': 'scripts/main.js'}]
                man['dependencies'] = [{'uuid': UUID['rp'], 'version': VERSION}, {'module_name': '@minecraft/server', 'version': '2.0.0'},
                                       {'module_name': '@minecraft/server-ui', 'version': '2.0.0'}]
            else:
                man['modules'] = [{'type': 'resources', 'uuid': UUID['rp_res'], 'version': VERSION}]
                man['dependencies'] = [{'uuid': UUID['bp'], 'version': VERSION}]
            jdump(os.path.join(pack, 'manifest.json'), man)
        shutil.rmtree(s.tmp, ignore_errors=True)
        addon = os.path.join(s.out, 'MineMineNoMi-Bedrock.mcaddon')
        with zipfile.ZipFile(addon, 'w', zipfile.ZIP_DEFLATED) as z:
            for pack in (s.bp, s.rp):
                for d, _, fs in os.walk(pack):
                    for f in fs:
                        p = os.path.join(d, f); z.write(p, os.path.relpath(p, s.out))
        s.report['mcaddon'] = addon; s.report['size_mb'] = round(os.path.getsize(addon) / 1e6, 2)

    def run(s):
        s.build_particles(); s.build_sounds(); s.build_items(); s.build_abilities(); s.build_blocks(); s.build_recipes(); s.build_entities(); s.finish()
        return s.report

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'dist')
    os.makedirs(out, exist_ok=True)
    rep = Build(sys.argv[1], out).run()
    for k, v in rep.items(): print(f'{k}: {v}')
