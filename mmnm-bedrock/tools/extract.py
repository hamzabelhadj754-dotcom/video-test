"""Pulls gameplay data out of the Mine Mine no Mi jar (classes are not obfuscated):
abilities (cooldown/damage/range/type), devil fruits, items, weapons, mobs."""
import json, os, re
import jclass

P = 'xyz.pixelatedw.mineminenomi.'
PASSIVE_SUPERS = {'PassiveAbility', 'EffectImmunityAbility', 'PassiveStatBonusAbility', 'LogiaInvulnerabilityAbility',
                  'LogiaBlockBypassingAbility', 'SourceImmunityAbility', 'NoFallDamageAbility', 'LogiaImmunityAbility'}

def slug(name):
    s = name.lower().replace("'", '').replace('.', '').replace(',', '').replace(':', '').replace('-', '_')
    return re.sub(r'_+', '_', re.sub(r'[^a-z0-9_]+', '_', s)).strip('_')

BOOT = {}
def _lam(cls, name):
    if name.startswith('@'): return [jclass.Ins('new', '', 'class ' + name[1:])]
    return cls.methods.get(name, [])
def registry(cls, methods=None):
    bm = BOOT.get(cls.name, {})
    """yield (display, alt_id, FIELD, lambda_ins, reg_method) for `ldc name; indy; registerX; putstatic F` runs."""
    strs, lam, reg = [], None, None
    for i in cls.methods.get('<clinit>', []):
        if i.string is not None: strs.append(i.string)
        elif i.lambda_idx is not None: lam = i.lambda_idx
        elif i.op == 'invokestatic' and i.method and i.method.startswith('register'): reg = i.method
        elif i.op == 'putstatic':
            if reg and strs and (methods is None or reg in methods):
                yield strs[0], (strs[1] if len(strs) > 1 else None), i.field[1], _lam(cls, bm.get(lam, f'lambda$static${lam}')), reg
            strs, lam, reg = [], None, None

def prev_nums(ins, idx, n):
    out = []
    j = idx - 1
    while j >= 0 and len(out) < n:
        v = ins[j].num
        if v is None: break
        out.insert(0, v); j -= 1
    return out

def call_arg(cls_or_ins, method, n=1, default=None):
    ins = cls_or_ins if isinstance(cls_or_ins, list) else list(cls_or_ins.all_ins())
    for k, i in enumerate(ins):
        if i.method == method:
            v = prev_nums(ins, k, n)
            if len(v) == n: return v if n > 1 else v[0]
    return default

def extract_abilities(C, lang):
    proj = {c.simple: c for c in C.values() if '.projectiles.' in c.name}
    out = {}
    for c in C.values():
        if '.abilities.' not in c.name or '$' in c.simple: continue
        ci = c.methods.get('<clinit>')
        if not ci: continue
        strs, aid = [], None
        for i in ci:
            if i.string is not None: strs.append(i.string)
            if i.method == 'registerAbility': aid = strs[-2] if len(strs) >= 2 else None; name = strs[-1]; break
        if not aid: continue
        aid = slug(aid)
        ins = list(c.all_ins())
        comps = sorted({t.split('.')[-1].replace('Component', '') for t in c.fields.values() if 'components.' in t and t.endswith('Component')})
        sup = c.sup.split('.')[-1]
        pkg = c.pkg if c.pkg != 'abilities' else ''
        a = {'id': aid, 'name': lang.get(f'ability.mineminenomi.{aid}', name), 'pkg': pkg, 'sup': sup, 'comps': comps,
             'consts': {k: v for k, v in c.consts.items() if isinstance(v, (int, float))}}
        desc = [i.string for i in ins if i.string and len(i.string) > 25 and ' ' in i.string]
        a['desc'] = lang.get(f'ability.mineminenomi.{aid}.description', desc[0] if desc else '')
        def stat(owner):
            return [i.field[1] for i in ins if i.op == 'getstatic' and i.field and i.field[0] == owner]
        a['element'] = (stat('SourceElement') or ['NONE'])[0]
        a['category'] = (stat('AbilityCategory') or ['DEVIL_FRUITS'])[0]
        a['sounds'] = stat('ModSounds'); a['effects'] = stat('ModEffects') + stat('MobEffects')
        a['weapon'] = (stat('ModWeapons') or [None])[0]
        a['blocks'] = stat('ModBlocks') + stat('Blocks')
        pcs = [i.owner.split('/')[-1] for i in ins if i.op == 'new' and i.owner and '/projectiles/' in i.owner]
        if pcs:
            pc = proj.get(pcs[0]); a['proj'] = pcs[0]
            if pc:
                a['pconsts'] = {k: v for k, v in pc.consts.items() if isinstance(v, (int, float))}
                for m, key in (('setDamage', 'pdmg'), ('setMaxLife', 'plife'), ('setArmorPiercing', 'ppierce')):
                    v = call_arg(pc, m)
                    if v is not None: a[key] = v
                a['effects'] += [i.field[1] for i in pc.all_ins() if i.op == 'getstatic' and i.field and i.field[0] in ('ModEffects', 'MobEffects')]
                a['pexplode'] = any(i.method in ('explode', 'createExplosion') or (i.owner or '').endswith('ExplosionComponent') or (i.owner or '').endswith('AbilityExplosion') for i in pc.all_ins())
        sh = call_arg(ins, 'shoot', 2)
        if sh: a['pspeed'] = sh[0]
        for m in ('getPunchDamage', 'getDamage'):
            if m in c.methods:
                v = [i.num for i in c.methods[m] if i.num is not None]
                if v: a['mdmg'] = v[0]
        v = call_arg(ins, 'hurtTarget') 
        if v is not None: a['hdmg'] = v
        out[aid] = a
    return out

def extract_fruits(C, lang):
    c = C[P + 'init.ModFruits']; out = []
    for disp, alt, field, lam, reg in registry(c, {'registerFruitItem'}):
        nums, ftype, abil = [], None, []
        for i in lam:
            if i.field and i.field[0] == 'FruitType': ftype = i.field[1]
            elif i.field and i.field[1] == 'INSTANCE': abil.append(i.owner.split('/')[-1])
            elif i.num is not None and ftype is None: nums.append(i.num)
        out.append({'id': slug(disp), 'name': disp, 'tier': nums[0] if nums else 1, 'type': ftype or 'PARAMECIA', 'classes': abil})
    return out

def extract_items(C):
    """id -> {name, kind, damage, speed, durability, armor slot/material, food...}"""
    tiers = {}
    ins = C[P + 'init.ModTiers'].methods['<clinit>']
    for k, i in enumerate(ins):
        if i.op == 'putstatic' and k >= 3 and ins[k-1].op == 'invokestatic':
            v = prev_nums(ins, k - 2, 1)
            if v: tiers[i.field[1]] = v[0]
    foods = {}
    ins = C[P + 'init.ModFoods'].methods['<clinit>']; cur = {}
    for k, i in enumerate(ins):
        if i.method == 'nutrition': cur['nutrition'] = prev_nums(ins, k, 1)[0]
        elif i.method == 'saturationModifier': cur['saturation'] = prev_nums(ins, k, 1)[0]
        elif i.method == 'alwaysEdible': cur['always'] = True
        elif i.op == 'putstatic': foods[i.field[1]] = cur; cur = {}
    items = {}
    for cn in ('ModItems', 'ModWeapons', 'ModArmors'):
        for disp, alt, field, lam, reg in registry(C[P + 'init.' + cn]):
            if reg not in ('registerItem', 'registerSpawnEggItem', 'registerItemWithModel'): 
                if not reg.startswith('registerItem'): continue
            it = {'name': disp, 'field': field, 'src': cn, 'cls': '', 'ids': [slug(alt) if alt else None, slug(disp), field.lower()]}
            for k, i in enumerate(lam):
                if i.op == 'new' and not it['cls'] and 'Properties' not in (i.owner or ''): it['cls'] = i.owner.split('/')[-1]
                if i.field and i.field[0] == 'ModTiers': it['durability'] = tiers.get(i.field[1])
                if i.field and i.field[0] == 'ModFoods': it['food'] = foods.get(i.field[1], {})
                if i.field and i.field[0] == 'ModMaterials': it['material'] = i.field[1].replace('_MATERIAL', '').lower()
                if i.field and i.field[0] == 'ArmorItem$Type': it['slot'] = i.field[1].lower()
                if i.field and i.field[0] == 'ModEffects': it.setdefault('effects', []).append(i.field[1])
                if i.field and i.field[1] == 'INSTANCE' and '/abilities/' in (i.owner or ''): it['ability_cls'] = i.owner.split('/')[-1]
                if i.method == 'of' and 'AttributesBuilder' in (i.owner or ''):
                    v = prev_nums(lam, k, 2)
                    if v: it['damage'] = v[0]; it['speed'] = v[1] if len(v) > 1 else -2.4
                if i.method == 'stacksTo': it['stack'] = prev_nums(lam, k, 1)[0]
                for m in ('setShotCooldown', 'setReloadCooldown', 'setBulletSpeed', 'setDamageMultiplier', 'setInaccuracy'):
                    if i.method == m: it[m[3].lower() + m[4:]] = prev_nums(lam, k, 1)[0]
                if i.method == '<init>' and it['cls'] in ('ModGunItem', 'PopGreenBowItem') and 'durability' not in it:
                    v = prev_nums(lam, k, 1)
                    if v: it['durability'] = v[0]
            items[field] = it
    return items

def extract_mobs(C):
    out = []
    for disp, alt, field, lam, reg in registry(C[P + 'init.ModMobs']):
        fac = {'registerMarineWithSpawnEgg': 'marine', 'registerWorldGovWithSpawnEgg': 'worldgov', 'registerPirateWithSpawnEgg': 'pirate',
               'registerBanditWithSpawnEgg': 'bandit', 'registerFactionlessWithSpawnEgg': 'civilian', 'registerAnimalWithSpawnEgg': 'animal'}.get(reg, 'boss')
        cls = next((i.owner.split('/')[-1] for i in lam if i.owner and '/entities/' in i.owner and 'Entity' in i.owner), '')
        out.append({'id': slug(alt or disp), 'name': disp, 'field': field, 'faction': fac, 'cls': cls})
    return out

def run(jar_dir):
    lang = json.load(open(os.path.join(jar_dir, 'assets/mineminenomi/lang/en_us.json')))
    C = jclass.load(jar_dir, ['init', 'abilities', 'entities/projectiles'])
    for n in ('ModFruits', 'ModItems', 'ModWeapons', 'ModArmors', 'ModMobs', 'ModBlocks'):
        BOOT[P + 'init.' + n] = jclass.bootstrap(jar_dir, P + 'init.' + n)
    ab = extract_abilities(C, lang)
    by_cls = {}
    for c in C.values():
        if '.abilities.' in c.name:
            for i in c.methods.get('<clinit>', []):
                pass
    cls2id = {}
    for c in C.values():
        if '.abilities.' not in c.name or '<clinit>' not in c.methods: continue
        strs = []
        for i in c.methods['<clinit>']:
            if i.string is not None: strs.append(i.string)
            if i.method == 'registerAbility' and len(strs) >= 2: cls2id[c.simple] = slug(strs[-2]); break
    fruits = extract_fruits(C, lang)
    for f in fruits: f['abilities'] = [cls2id[x] for x in f.pop('classes') if x in cls2id]
    items = extract_items(C)
    for it in items.values():
        if 'ability_cls' in it: it['ability'] = cls2id.get(it.pop('ability_cls'))
    return {'abilities': ab, 'fruits': fruits, 'items': items, 'mobs': extract_mobs(C), 'lang': lang}

if __name__ == '__main__':
    import sys, collections
    d = run(sys.argv[1])
    json.dump(d, open(sys.argv[2], 'w'), indent=1)
    print(len(d['abilities']), 'abilities', len(d['fruits']), 'fruits', len(d['items']), 'items', len(d['mobs']), 'mobs')
