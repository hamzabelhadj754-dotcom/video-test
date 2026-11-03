"""Gains Dom #011 hero shots in Blender (Cycles).

Usage:
  blender -b -P scene.py -- SHOT OUTDIR [frame_start frame_end] [--res W H] [--samples N]

Shots (30 fps):
  plates  - a stack of black plates under one hard top light, dust in the beam, slow dolly-in
  rack    - a row of dumbbells, a light sweeps along them, camera trucks sideways
  statue  - a statue (Pinterest cut-out) behind a loaded barbell, rim light, push-in
"""

import math
import random
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
SHOT = argv[0]
OUT = argv[1]
F0 = int(argv[2]) if len(argv) > 2 and argv[2].isdigit() else 1
F1 = int(argv[3]) if len(argv) > 3 and argv[3].isdigit() else 75
RES = (1080, 1920)
SAMPLES = 48
if "--res" in argv:
    i = argv.index("--res")
    RES = (int(argv[i + 1]), int(argv[i + 2]))
if "--samples" in argv:
    SAMPLES = int(argv[argv.index("--samples") + 1])
ASSETS = __file__.rsplit("/", 2)[0] + "/assets/elements/"

rng = random.Random(11)

# ---------------------------------------------------------------- scene setup
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 6
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.resolution_percentage = 100
sc.render.fps = 30
sc.frame_start, sc.frame_end = F0, F1
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGB"
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "Medium High Contrast"
sc.render.filepath = OUT
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.5

world = bpy.data.worlds.new("w")
sc.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.004, 0.004, 0.005, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.0


def mat_black_lacquer(name="lacquer"):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.012, 0.012, 0.014, 1)
    b.inputs["Roughness"].default_value = 0.5
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Coat Roughness"].default_value = 0.035
    b.inputs["Specular IOR Level"].default_value = 0.0  # no rough base sheen: deep black, crisp coat lines
    return m


def mat_chrome(name="chrome"):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.9, 0.9, 0.9, 1)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Roughness"].default_value = 0.12
    return m


def mat_floor():
    m = bpy.data.materials.new("floor")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.02, 0.02, 0.022, 1)
    b.inputs["Roughness"].default_value = 0.22
    return m


def mat_emit(col, strength, name="emit"):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs[0].default_value = (*col, 1)
    e.inputs[1].default_value = strength
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(e.outputs[0], o.inputs[0])
    return m


LAC = mat_black_lacquer()
CHR = mat_chrome()


def plate(radius, thick, loc, rot=(math.pi / 2, 0, 0)):
    """A bumper plate: bevelled cylinder with a chrome hub."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=radius, depth=thick, location=loc, rotation=rot)
    p = bpy.context.object
    p.data.materials.append(LAC)
    bev = p.modifiers.new("bev", "BEVEL")
    bev.width = thick * 0.18
    bev.segments = 4
    bpy.ops.object.shade_smooth()
    import mathutils
    rq = mathutils.Euler(rot).to_matrix()
    for side in (-1, 1):
        off = rq @ Vector((0, 0, side * thick / 2))
        bpy.ops.mesh.primitive_torus_add(major_radius=radius * 0.9, minor_radius=thick * 0.09, major_segments=96, minor_segments=12, location=Vector(loc) + off, rotation=rot)
        t = bpy.context.object
        t.data.materials.append(LAC)
        bpy.ops.object.shade_smooth()
        bpy.ops.mesh.primitive_torus_add(major_radius=radius * 0.34, minor_radius=thick * 0.06, major_segments=64, minor_segments=10, location=Vector(loc) + off, rotation=rot)
        t2 = bpy.context.object
        t2.data.materials.append(CHR)
        bpy.ops.object.shade_smooth()
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius * 0.22, depth=thick * 1.06, location=loc, rotation=rot)
    h = bpy.context.object
    h.data.materials.append(CHR)
    b2 = h.modifiers.new("bev", "BEVEL")
    b2.width = thick * 0.08
    b2.segments = 3
    bpy.ops.object.shade_smooth()
    return p, h


def bar(length, loc, rot=(0, math.pi / 2, 0), r=0.028):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r, depth=length, location=loc, rotation=rot)
    o = bpy.context.object
    o.data.materials.append(CHR)
    bpy.ops.object.shade_smooth()
    return o


def dumbbell(loc, scale=1.0, rot_z=0.0):
    objs = []
    s = scale
    objs.append(bar(0.36 * s, loc, rot=(0, math.pi / 2, rot_z), r=0.022 * s))
    for side in (-1, 1):
        for k, (rad, th, off) in enumerate([(0.11, 0.05, 0.13), (0.095, 0.04, 0.175)]):
            c = Vector(loc) + Vector((math.cos(rot_z), math.sin(rot_z), 0)) * side * off * s
            p, h = plate(rad * s, th * s, c, rot=(0, math.pi / 2, rot_z))
            objs += [p, h]
    return objs


def floor():
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    f = bpy.context.object
    f.data.materials.append(mat_floor())
    return f


def area_light(loc, size, power, color=(1, 1, 1), target=(0, 0, 0), shape="RECTANGLE", size_y=None):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.object
    L.data.shape = shape
    L.data.size = size
    if size_y:
        L.data.size_y = size_y
    L.data.energy = power
    L.data.color = color
    # studio strips light only the reflections: black stays black, edges get crisp lines
    L.data.diffuse_factor = 0.0
    direction = Vector(target) - Vector(loc)
    L.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return L


def spot(loc, power, angle, blend, color=(1, 1, 1), target=(0, 0, 0)):
    bpy.ops.object.light_add(type="SPOT", location=loc)
    L = bpy.context.object
    L.data.energy = power
    L.data.spot_size = angle
    L.data.spot_blend = blend
    L.data.color = color
    L.data.shadow_soft_size = 0.05
    direction = Vector(target) - Vector(loc)
    L.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return L


def beam(top, bottom_r, height, color, strength):
    """A fake volumetric light cone: emission that fades towards the bottom."""
    bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=bottom_r, radius2=0.02, depth=height, location=(top[0], top[1], top[2] - height / 2))
    c = bpy.context.object
    m = bpy.data.materials.new("beam")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    add = nt.nodes.new("ShaderNodeAddShader")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = (*color, 1)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs[0].default_value = 0.35
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul2 = nt.nodes.new("ShaderNodeMath")
    mul2.operation = "MULTIPLY"
    mul2.inputs[1].default_value = strength
    inv = nt.nodes.new("ShaderNodeMath")
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], mul.inputs[0])  # brighter near the top
    nt.links.new(lw.outputs["Facing"], inv.inputs[1])  # soft edges
    nt.links.new(inv.outputs[0], mul.inputs[1])
    nt.links.new(mul.outputs[0], mul2.inputs[0])
    nt.links.new(mul2.outputs[0], em.inputs[1])
    nt.links.new(tr.outputs[0], add.inputs[0])
    nt.links.new(em.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], out.inputs[0])
    m.blend_method = "BLEND" if hasattr(m, "blend_method") else None
    c.data.materials.append(m)
    c.visible_shadow = False
    return c


def dust(center, spread, n, size, color, strength, drift):
    """Tiny emissive motes floating in the light, animated slowly (deterministic)."""
    em = mat_emit(color, strength, "dust")
    for i in range(n):
        loc = Vector(center) + Vector((rng.uniform(-spread[0], spread[0]), rng.uniform(-spread[1], spread[1]), rng.uniform(-spread[2], spread[2])))
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=size * rng.uniform(0.5, 1.4), location=loc)
        d = bpy.context.object
        d.data.materials.append(em)
        d.visible_shadow = False
        d.keyframe_insert("location", frame=F0)
        d.location = loc + Vector((rng.uniform(-1, 1) * drift, rng.uniform(-1, 1) * drift, rng.uniform(0.2, 1) * drift))
        d.keyframe_insert("location", frame=F1)
        for fc in d.animation_data.action.fcurves if hasattr(d.animation_data.action, "fcurves") else []:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def image_plane(path, loc, height, rot=(math.pi / 2, 0, 0), brightness=1.0, emission=0.0):
    img = bpy.data.images.load(path)
    w, h = img.size
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    p = bpy.context.object
    p.scale = (height * w / h, height, 1)
    m = bpy.data.materials.new("img")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = img
    bc = nt.nodes.new("ShaderNodeBrightContrast")
    bc.inputs["Bright"].default_value = brightness - 1.0
    nt.links.new(t.outputs["Color"], bc.inputs["Color"])
    nt.links.new(bc.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    b.inputs["Roughness"].default_value = 0.6
    if emission:
        nt.links.new(bc.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emission
    p.data.materials.append(m)
    return p


def camera(path, look, lens=50, dof=None):
    bpy.ops.object.camera_add(location=path[0])
    cam = bpy.context.object
    cam.data.lens = lens
    sc.camera = cam
    tgt = bpy.data.objects.new("tgt", None)
    sc.collection.objects.link(tgt)
    tgt.location = look[0]
    con = cam.constraints.new("TRACK_TO")
    con.target = tgt
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    for (fr, p) in zip((F0, F1), path):
        cam.location = p
        cam.keyframe_insert("location", frame=fr)
    for (fr, p) in zip((F0, F1), look):
        tgt.location = p
        tgt.keyframe_insert("location", frame=fr)
    if dof:
        cam.data.dof.use_dof = True
        cam.data.dof.focus_object = dof[0]
        cam.data.dof.aperture_fstop = dof[1]
    return cam


# ---------------------------------------------------------------- hero stills
# Transparent-background stills of each object; the floor only catches shadows.
# Depth, camera push, parallax, dust and light sweeps are animated in HyperFrames.
sc.render.film_transparent = True
sc.render.image_settings.color_mode = "RGBA"
sc.frame_start = sc.frame_end = 1
f = floor()
f.is_shadow_catcher = True


def studio(rim_col, key_power=420, rim_power=520):
    # Black lacquer only looks black if almost nothing reflects in it. So: no
    # big lights at all. A few narrow strips far away give thin crisp edge lines;
    # their reflections cover only a sliver of each face.
    def strip_light(loc, power, color, target, length, width=0.03):
        L = area_light(loc, width, power, color=color, target=target, size_y=length)
        return L

    strip_light((0.4, -0.3, 4.2), key_power * 1.6, (1.0, 0.96, 0.92), (0, 0, 0.1), 1.6)        # thin top strip
    strip_light((-3.2, 2.2, 1.2), rim_power * 1.6, rim_col, (0, 0, 0.25), 2.4)                 # coloured rim, left-back
    strip_light((3.2, 2.0, 1.0), rim_power * 1.1, rim_col, (0, 0, 0.2), 2.4)                   # coloured rim, right-back
    strip_light((-1.8, -2.4, 2.6), 480, (1, 1, 1), (0, 0, 0.2), 2.0)                           # front-left white line
def still_camera(loc, look, lens):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    cam.data.lens = lens
    sc.camera = cam
    d = Vector(look) - Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return cam


if SHOT == "plates":
    ys = 0.0
    for i, (r, t) in enumerate([(0.45, 0.07), (0.45, 0.07), (0.40, 0.06), (0.34, 0.05), (0.28, 0.045)]):
        plate(r, t, (rng.uniform(-0.015, 0.015), rng.uniform(-0.015, 0.015), ys + t / 2), rot=(0, 0, rng.uniform(0, 3)))
        ys += t + 0.002
    studio((1.0, 0.33, 0.26))
    still_camera((0, -2.4, 1.55), (0, 0, 0.18), 52)
elif SHOT == "rack":
    for i in range(5):
        dumbbell((i * 0.42 - 0.84, i * 0.06, 0.12), scale=1.0, rot_z=math.radians(90))
    studio((1.0, 0.6, 0.22))
    still_camera((-1.45, -1.55, 0.62), (0.05, 0.1, 0.1), 42)
elif SHOT == "barbell":
    bar(2.2, (0, 0, 0.225), r=0.028)
    for side in (-1, 1):
        for k, (r, t) in enumerate([(0.225, 0.06), (0.225, 0.06), (0.19, 0.05)]):
            plate(r, t, (side * (0.62 + k * 0.065), 0, 0.225), rot=(0, math.pi / 2, 0))
    studio((0.42, 0.58, 1.0))
    still_camera((0.9, -2.3, 0.32), (0, 0, 0.24), 40)
elif SHOT == "hero":
    objs = dumbbell((0, 0, 0.14), scale=1.6, rot_z=math.radians(24))
    studio((0.3, 1.0, 0.78), key_power=1100, rim_power=520)
    still_camera((0.25, -1.85, 0.78), (0, 0, 0.14), 50)

bpy.ops.render.render(write_still=True)
