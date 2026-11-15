"""Refined level 1 towers, drawn in art pixels on the game's 36x48 tower
canvas (2 art px per game unit). Feet sit on row 39, centre column 18.
Shapes are shaded by one light from the top left with hue-shifted ramps,
parts are separated by inner contour lines, and the whole sprite gets a
2px coloured outline (lighter on the lit side) so towers read louder than
the scenery, whose props carry a 1px outline."""
import json, sys
import numpy as np
from pix import Layer, ramp, hx, mix, dil4, INK

CW, CHT, FEET, CX = 36, 48, 39, 18
R = dict(
    red=ramp('#d64a3c'), blue=ramp('#3f6fb8'), skin=ramp('#efbd94', vlight=0.5), beard=ramp('#e4ded2', hshift=10),
    boot=ramp('#6c4630'), wood=ramp('#9a6a43'), brass=ramp('#c9973a', hshift=14), iron=ramp('#5b6072', hshift=10),
    straw=ramp('#e2ad4a', hshift=14), glass=ramp('#86d8ef', vlight=0.8), water=ramp('#5cb4ea'), gold=ramp('#f2c23c'),
    leaf=ramp('#5fae55'),
)
EYE = hx('#1d1828'); WHITE = (255, 249, 238); CHEEK = hx('#f08a86'); CORE = (230, 252, 255)


def L():
    return Layer(0, 0, CW, CHT, 1)


def gnome():
    t = L()
    t.ell(15, 38.2, 3.0, 1.7, R['boot'], contour=True); t.ell(21.2, 38.2, 3.0, 1.7, R['boot'], contour=True)
    t.ell(18, 31.5, 6.6, 6.0, R['blue'], contour=True)                 # coat
    t.box(11.6, 32.0, 24.6, 33.4, R['boot'], mode='flat', flat=1)       # belt
    t.box(16.8, 31.8, 19.4, 33.6, R['brass'], mode='flat', flat=3)     # buckle
    t.ell(11.6, 30.0, 2.2, 3.4, R['blue'], contour=True)               # left arm
    t.ell(11.4, 33.2, 1.7, 1.5, R['skin'], contour=True)               # left hand
    # slingshot in the right hand: a forked stick with a band
    for (x0, y0, x1, y1) in ((25.6, 22.0, 26.6, 31.0), (23.6, 20.0, 24.6, 24.0), (27.6, 20.0, 28.6, 24.0)):
        t.box(x0, y0, x1, y1, R['wood'], contour=True)
    t.box(23.6, 23.4, 28.6, 24.4, R['wood'], mode='flat', flat=2)
    t.ell(25.0, 29.6, 2.2, 3.2, R['blue'], contour=True)                # right arm
    t.ell(26.2, 31.4, 1.7, 1.5, R['skin'], contour=True)                # right hand
    # beard: round top, a point below
    t.ell(18, 26.6, 5.2, 4.2, R['beard'], bias=0.1, contour=True)
    t.poly([(13.4, 27.5), (22.6, 27.5), (18.5, 34.2)], R['beard'], flat=2)
    for x, y in ((16.2, 28.0), (16.6, 30.0), (19.6, 28.4), (19.4, 30.6), (18.0, 32.0)):
        t.dot(x, y, R['beard'][1])
    t.ell(18, 22.6, 4.6, 2.6, R['skin'], contour=True)                 # face
    t.ell(18.6, 23.8, 1.7, 1.4, [R['skin'][1], mix(R['skin'][2], CHEEK, .35), mix(R['skin'][3], CHEEK, .3), R['skin'][4], WHITE], contour=True)
    t.dot(15.0, 22.2, EYE); t.dot(15.0, 23.2, EYE); t.dot(21.6, 22.2, EYE); t.dot(21.6, 23.2, EYE)
    t.dot(15.0, 22.2, WHITE); t.dot(21.6, 22.2, WHITE)                  # glints
    t.dot(14.0, 24.0, CHEEK); t.dot(22.8, 24.0, CHEEK)
    # hat: cone leaning right, brim, a crease, and the tip flopping over
    t.cone(18.2, 21.0, 6.6, 20.6, 10.6, R['red'], contour=True)
    t.ell(18.2, 21.0, 7.4, 1.7, R['red'], bias=-0.25, contour=True)
    for k in range(4): t.dot(19.0 + k * 0.5, 16.5 - k * 1.1, R['red'][1])
    t.ell(22.4, 10.8, 1.7, 1.4, R['red'], contour=True)
    return t


def sprinkler():
    t = L()
    t.ell(18, 39.0, 4.2, 1.4, R['wood'], bias=-0.3)                    # stake foot in the soil
    t.box(16.4, 21.0, 19.8, 39.4, R['wood'], contour=True)              # stake
    for y in (25.0, 34.0): t.box(16.0, y, 20.2, y + 1.4, R['iron'], contour=True)
    t.dot(17.2, 29.0, R['wood'][1]); t.dot(18.6, 31.4, R['wood'][1])  # grain
    t.ell(18, 21.0, 2.8, 1.6, R['iron'], contour=True)                  # clamp on the stake
    t.ell(18, 18.0, 3.0, 2.8, R['brass'], bias=0.1, contour=True)       # rotating head
    for side in (-1, 1):                                                 # arms rising to the nozzles
        for k in range(6):
            x = 18 + side * (2.4 + k); y = 16.6 - k * 0.7
            t.box(x, y, x + 1, y + 1.6, R['brass'], mode='flat', flat=3 if side < 0 else 2)
        t.ell(18 + side * 8.6, 12.2, 1.4, 1.3, R['brass'], contour=True)
    t.ell(18, 15.0, 1.2, 1.1, R['brass'], bias=0.2, contour=True)       # pivot cap
    t.dot(16.8, 16.8, WHITE)
    # spray: two arcs of droplets, brighter at the top of the arc
    import math
    for side in (-1, 1):
        for k in range(10):
            u = (k + 1) / 11
            x = 18 + side * (9.6 + u * 7.2); y = 11.4 - math.sin(u * math.pi) * 4 + u * 13
            t.fxdot(x, y, R['water'][4] if k % 3 == 0 else R['water'][3])
            if k % 3 == 1: t.fxdot(x + side, y + 1, R['water'][2])
    return t


def storm_lamp():
    t = L()
    t.ell(18, 39.0, 4.4, 1.6, R['iron'], contour=True)                 # foot
    t.box(16.6, 30.0, 19.6, 39.2, R['iron'], contour=True)              # post
    t.box(15.8, 33.0, 20.4, 34.2, R['iron'], bias=-0.3)
    t.box(12.0, 29.0, 24.2, 31.6, R['iron'], contour=True)              # base plate
    t.box(12.6, 16.0, 23.6, 29.2, R['glass'], bias=0.3, contour=True)  # glass
    t.ell(18.1, 22.6, 3.4, 4.6, [R['glass'][3], R['glass'][4], CORE, WHITE], bias=0.6)   # glow
    for k in range(5): t.dot(16.6 + k * 0.7, 23.4 + (k % 2) * -1.4, R['gold'][4])        # filament
    for x in (12.6, 25.6): t.box(x, 16.0, x + 1.0, 29.2, R['iron'], mode='flat', flat=2)  # frame
    t.dot(14.0, 18.0, WHITE); t.dot(14.0, 19.0, WHITE); t.dot(15.0, 17.6, WHITE)          # glint
    t.poly([(10.8, 16.4), (25.4, 16.4), (21.6, 11.6), (14.6, 11.6)], R['iron'], flat=2, contour=True)  # roof
    t.box(10.8, 15.6, 25.4, 16.8, R['iron'], mode='flat', flat=3)
    t.ell(18.1, 10.2, 1.8, 1.8, R['iron'], contour=True)                # ring
    t.dot(18.1, 10.2, hx('#2a2c38'))                                   # ring hole
    for x, y in ((9.0, 21.0), (27.2, 24.0), (26.0, 14.0)):              # little sparks
        t.fxdot(x, y, hx('#fff6b0')); t.fxdot(x + 1, y + 1, hx('#c8f6ff'))
    return t


def hive():
    t = L()
    for x0 in (12.4, 21.6): t.box(x0, 33.0, x0 + 2.2, 39.6, R['wood'], contour=True)   # legs
    t.box(9.6, 31.4, 26.6, 34.4, R['wood'], contour=True)                           # plank
    t.box(9.6, 31.4, 26.6, 32.2, R['wood'], mode='flat', flat=4)
    rings = [(30.0, 8.6, 2.8), (26.6, 8.6, 2.9), (23.2, 8.0, 2.8), (19.9, 6.8, 2.7), (16.9, 5.2, 2.4), (14.3, 3.2, 1.9)]
    for cy, rx, ry in rings: t.ell(18, cy, rx, ry, R['straw'], bias=0.05, contour=True)
    t.ell(18, 12.6, 1.6, 1.2, R['straw'], bias=0.2, contour=True)               # top knot
    for cy, rx, ry in rings[:4]:                                                  # straw stitches
        for k in (-0.55, 0.0, 0.55): t.dot(18 + k * rx, cy + ry * 0.35, R['straw'][1])
    t.ell(18, 29.6, 2.4, 1.7, [mix(R['straw'][0], (20, 12, 8), .6)] * 2, flat=0)  # entrance
    t.box(15.0, 30.8, 21.0, 31.6, R['wood'], mode='flat', flat=2)                 # landing board
    for bx, by in ((27.6, 16.0), (8.0, 21.0), (25.0, 9.0)):                       # bees
        t.fxdot(bx, by, R['gold'][3]); t.fxdot(bx + 1, by, EYE); t.fxdot(bx + 2, by, R['gold'][3])
        t.fxdot(bx + 1, by - 1, WHITE); t.fxdot(bx + 2, by - 1, (210, 236, 255))
    return t


def bake(t):
    """2px coloured outline (selout), then fx; returns rgb array and alpha."""
    rgb = t.rgb.copy(); A = t.a.copy()
    out = dil4(A) & ~A; col = np.zeros_like(rgb)
    for (dy, dx), lit in (((1, 0), True), ((0, 1), True), ((-1, 0), False), ((0, -1), False)):
        sa = np.roll(A, (-dy, -dx), (0, 1)); sc = np.roll(t.ol2 if lit else t.ol, (-dy, -dx), (0, 1))
        take = out & sa; col[take] = sc[take]
    rgb[out] = col[out]; A = A | out
    out2 = dil4(A) & ~A; col2 = np.zeros_like(rgb)
    for (dy, dx) in ((1, 0), (0, 1), (-1, 0), (0, -1)):
        sa = np.roll(A, (-dy, -dx), (0, 1)); sc = np.roll(rgb, (-dy, -dx), (0, 1))
        take = out2 & sa; col2[take] = sc[take]
    rgb[out2] = col2[out2]; A = A | out2
    for i, j, c, n in t.fx:
        if 0 <= i < CW and 0 <= j < CHT: rgb[j:j + n, i:i + n] = c; A[j:j + n, i:i + n] = True
    return rgb, A


CH = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=?@^~!'
def rows(rgb, A):
    cols = {}; out = []
    for y in range(CHT):
        r = ''
        for x in range(CW):
            if not A[y, x]: r += '.'; continue
            k = '#%02x%02x%02x' % tuple(rgb[y, x])
            if k not in cols: cols[k] = CH[len(cols)]
            r += cols[k]
        out.append(r)
    return out, {v: k for k, v in cols.items()}


TOWERS = dict(gnome=gnome, sprink=sprinkler, zap=storm_lamp, hive=hive)
if __name__ == '__main__':
    res = {}
    for k, f in TOWERS.items():
        rgb, A = bake(f())
        r, p = rows(rgb, A)
        res[k] = [r, p]
        np.save(f'/tmp/tw_{k}.npy', np.dstack([rgb, A.astype(np.uint8) * 255]))
        print(k, 'colours', len(p), file=sys.stderr)
    json.dump(res, open('/tmp/towers2.json', 'w'))
