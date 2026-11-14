"""Tiny reader for `javap -p -c -constants` output. Used to pull game data
(cooldowns, damage, fruit->ability tables...) out of the mod jar at build time."""
import os, re, subprocess, tempfile

INS = re.compile(r'^\s+(\d+): (\w+)\s*(.*?)\s*(?://\s*(.*))?$')
CLS = re.compile(r'^(?:public |final |abstract |static |private |protected )*(?:class|interface|enum) ([\w.$]+)(?: extends ([\w.$<>?, ]+?))?(?: implements .*)?\s*\{')
FLD = re.compile(r'^  (?:[\w]+ )*?([\w.$<>?\[\], ]+) (\w+)(?: = (.+))?;$')
MTH = re.compile(r'^  (?:[\w]+ )*?(?:[\w.$<>?\[\], ]+ )?([\w$<>]+)\(.*\).*;$|^  static \{\};$')

class Ins:
    __slots__ = ('op', 'arg', 'c')
    def __init__(s, op, arg, c): s.op, s.arg, s.c = op, arg, c or ''
    def __repr__(s): return f'{s.op} {s.arg} //{s.c}'
    @property
    def num(s):
        """numeric value pushed by this instruction, else None"""
        o = s.op
        if o.startswith(('iconst_', 'fconst_', 'dconst_', 'lconst_')):
            v = o.split('_')[1]
            return -1 if v == 'm1' else float(v) if o[0] in 'fd' else int(v)
        if o in ('bipush', 'sipush'): return int(s.arg)
        if o.startswith('ldc'):
            m = re.match(r'(?:float|int|double|long) (-?[\d.Ee+-]+|-?Infinity|NaN)[fdl]?$', s.c)
            if m:
                try: return float(m.group(1)) if ('.' in m.group(1) or 'E' in m.group(1)) else int(m.group(1))
                except ValueError: return None
        return None
    @property
    def string(s):
        return s.c[7:] if s.op.startswith('ldc') and s.c.startswith('String ') else None
    @property
    def field(s):
        """(owner simple name, field name) for get/putstatic"""
        m = re.match(r'Field (?:([\w/$]+)\.)?(\w+):', s.c)
        return ((m.group(1) or '').split('/')[-1], m.group(2)) if m else None
    @property
    def owner(s):
        m = re.match(r'(?:Field|Method|InterfaceMethod|class) "?([\w/$]+)', s.c)
        return m.group(1) if m else None
    @property
    def method(s):
        m = re.match(r'(?:Interface)?Method (?:([\w/$]+)\.)?"?([\w$<>]+)"?:', s.c)
        return m.group(2) if m else None
    @property
    def lambda_idx(s):
        m = re.match(r'InvokeDynamic #(\d+):', s.c)
        return int(m.group(1)) if m else None

class JClass:
    def __init__(s, name, sup):
        s.name, s.sup, s.fields, s.consts, s.methods = name, sup, {}, {}, {}
    @property
    def simple(s): return s.name.split('.')[-1]
    @property
    def pkg(s): return s.name.split('.')[-2]
    def all_ins(s):
        for m in s.methods.values(): yield from m

def parse(text):
    out, cur, meth = {}, None, None
    for line in text.splitlines():
        if not line.startswith(' '):
            m = CLS.match(line)
            if m:
                cur = JClass(m.group(1), (m.group(2) or '').split('<')[0]); out[cur.name] = cur; meth = None
            continue
        if cur is None: continue
        m = INS.match(line)
        if m and meth is not None:
            meth.append(Ins(m.group(2), m.group(3), m.group(4))); continue
        if line.startswith('  ') and not line.startswith('   '):
            if line.strip() == 'static {};':
                meth = cur.methods.setdefault('<clinit>', []); continue
            if '(' in line:
                m = MTH.match(line)
                nm = m.group(1) if m and m.group(1) else line.strip()
                while nm in cur.methods: nm += "'"
                meth = cur.methods[nm] = []; continue
            m = FLD.match(line)
            if m:
                cur.fields[m.group(2)] = m.group(1); meth = None
                if m.group(3):
                    v = m.group(3).rstrip('fdlFDL')
                    try: cur.consts[m.group(2)] = float(v) if '.' in v or 'E' in v else int(v)
                    except ValueError: pass
    return out

def load(jar_dir, packages):
    """javap every class under the given package dirs (relative to mod root)."""
    root = 'xyz/pixelatedw/mineminenomi/'
    names = []
    for p in packages:
        for d, _, fs in os.walk(os.path.join(jar_dir, root, p)):
            for f in fs:
                if f.endswith('.class'):
                    names.append(os.path.relpath(os.path.join(d, f), jar_dir)[:-6])
    env = dict(os.environ); env.pop('JAVA_TOOL_OPTIONS', None)
    text = ''
    for i in range(0, len(names), 400):
        r = subprocess.run(['javap', '-p', '-c', '-constants', '-cp', jar_dir] + names[i:i+400],
                           capture_output=True, text=True, env=env)
        text += r.stdout
    return parse(text)

def bootstrap(jar_dir, cls):
    """indy index -> lambda method name (needs javap -v)."""
    env = dict(os.environ); env.pop('JAVA_TOOL_OPTIONS', None)
    t = subprocess.run(['javap', '-v', '-p', '-cp', jar_dir, cls], capture_output=True, text=True, env=env).stdout
    out, cur = {}, None
    for line in t[t.find('BootstrapMethods:'):].splitlines():
        m = re.match(r'\s+(\d+): #\d+ REF_', line)
        if m: cur = int(m.group(1)); continue
        m = re.search(r'REF_\w+ ([\w/$]+)\."?([\w$<>]+)"?:', line)
        if m and cur is not None and cur not in out:
            out[cur] = m.group(2) if m.group(2) != '<init>' else '@' + m.group(1)
    return out
