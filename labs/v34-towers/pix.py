"""Tiny shape-shaded pixel renderer for Sprout Siege fidelity mocks.

Everything is described in logical (game) units and rasterised on an art grid
of S pixels per unit, so the same scene renders at 1x and 2x density. Shading
comes from one light (top left) and hue-shifted ramps; no alpha, no blur, no
rotation, so every output pixel sits on the one art grid.
"""
import colorsys, math
import numpy as np
from PIL import Image, ImageDraw

LIGHT = np.array([-0.5, -0.65, 0.57]); LIGHT = LIGHT / np.linalg.norm(LIGHT)
INK = (29, 24, 40)          # deep purple-brown every outline leans toward


def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def tohex(c): return '#%02x%02x%02x' % tuple(int(v) for v in c)


def mix(a, b, t): return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))


def _toward(h, target, amt):
    d = ((target - h + 180) % 360) - 180
    return (h + math.copysign(min(abs(d), amt), d)) % 360


def ramp(base, n=5, hshift=16, vdark=0.42, vlight=0.55, sdark=0.10, slight=0.28):
    """Dark to light. Shadows lean blue-violet, highlights lean warm yellow."""
    r, g, b = [c / 255 for c in hx(base)]
    h, s, v = colorsys.rgb_to_hsv(r, g, b); h *= 360
    mid = (n - 1) / 2; out = []
    for k in range(n):
        t = (k - mid) / mid
        if t < 0:
            hh = _toward(h, 250, hshift * -t); vv = v * (1 + vdark * t); ss = min(1, s + sdark * -t)
        else:
            hh = _toward(h, 55, hshift * t); vv = v + (1 - v) * vlight * t; ss = s * (1 - slight * t)
        rr, gg, bb = colorsys.hsv_to_rgb(hh / 360, ss, vv)
        out.append((round(rr * 255), round(gg * 255), round(bb * 255)))
    return out


TH = {5: [-0.25, 0.30, 0.72, 0.93], 4: [-0.2, 0.38, 0.85], 3: [0.0, 0.7], 2: [0.2]}


def shade_idx(I, n):
    return np.clip(np.digitize(I, TH[n]), 0, n - 1)


def outline_of(R): return mix(R[0], INK, 0.55)


def dil4(m):
    o = m.copy()
    o[1:] |= m[:-1]; o[:-1] |= m[1:]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]
    return o


def ero4(m):
    o = m.copy()
    o[1:] &= m[:-1]; o[:-1] &= m[1:]; o[:, 1:] &= m[:, :-1]; o[:, :-1] &= m[:, 1:]
    o[0] = False; o[-1] = False; o[:, 0] = False; o[:, -1] = False
    return o


class Layer:
    def __init__(self, ox, oy, w, h, S):
        self.ox, self.oy, self.S = ox, oy, S
        self.W, self.H = int(round(w * S)), int(round(h * S))
        xs = (np.arange(self.W) + 0.5) / S + ox
        ys = (np.arange(self.H) + 0.5) / S + oy
        self.X, self.Y = np.meshgrid(xs, ys)
        self.rgb = np.zeros((self.H, self.W, 3), np.uint8)
        self.a = np.zeros((self.H, self.W), bool)
        self.ol = np.zeros((self.H, self.W, 3), np.uint8)    # outline colour per pixel
        self.ol2 = np.zeros((self.H, self.W, 3), np.uint8)   # lighter outline (lit side)
        self.fx = []    # art-pixel effects drawn after the outline (spray, sparks)

    # -- core put
    def put(self, m, idx, R, contour=False, ol=True):
        if not m.any(): return
        Rc = np.array(R, np.uint8)
        if contour:
            nb_out = ~ero4(m) & m
            # only where the shape meets something already drawn
            prev = self.a
            touch = np.zeros_like(m)
            touch[1:] |= prev[:-1] & ~m[:-1]; touch[:-1] |= prev[1:] & ~m[1:]
            touch[:, 1:] |= prev[:, :-1] & ~m[:, :-1]; touch[:, :-1] |= prev[:, 1:] & ~m[:, 1:]
            idx = idx.copy() if hasattr(idx, 'copy') else np.full(m.shape, idx)
            if np.ndim(idx) == 0: idx = np.full(m.shape, idx)
            idx[nb_out & touch] = 0
        if np.ndim(idx) == 0: idx = np.full(m.shape, idx)
        self.rgb[m] = Rc[idx[m]]
        self.a |= m
        if ol:
            self.ol[m] = outline_of(R); self.ol2[m] = R[0]

    def ell(self, cx, cy, rx, ry, R, bias=0.0, flat=None, contour=False, ol=True):
        dx = (self.X - cx) / rx; dy = (self.Y - cy) / ry
        r2 = dx * dx + dy * dy; m = r2 <= 1
        if flat is not None:
            self.put(m, flat, R, contour, ol); return m
        nz = np.sqrt(np.clip(1 - r2, 0, 1))
        I = dx * LIGHT[0] + dy * LIGHT[1] + nz * LIGHT[2] + bias
        self.put(m, shade_idx(I, len(R)), R, contour, ol); return m

    def cone(self, bx, by, rb, tx, ty, R, bias=0.0, contour=False):
        t = (self.Y - ty) / (by - ty)
        cx = tx + (bx - tx) * t; hw = np.maximum(rb * t, 1e-3)
        u = (self.X - cx) / hw
        m = (t >= 0) & (t <= 1) & (np.abs(u) <= 1)
        n = np.stack([u * 0.9, np.full_like(u, -0.45), np.sqrt(np.clip(1 - u * u, 0, 1)) * 0.9], -1)
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        I = n @ LIGHT + bias
        self.put(m, shade_idx(I, len(R)), R, contour); return m

    def box(self, x0, y0, x1, y1, R, mode='cyl', flat=2, bias=0.0, contour=False, ol=True):
        m = (self.X >= x0) & (self.X < x1) & (self.Y >= y0) & (self.Y < y1)
        if mode == 'flat':
            self.put(m, flat, R, contour, ol); return m
        u = np.clip((self.X - (x0 + x1) / 2) / ((x1 - x0) / 2), -1, 1)
        I = u * LIGHT[0] + np.sqrt(np.clip(1 - u * u, 0, 1)) * LIGHT[2] + bias + 0.1
        self.put(m, shade_idx(I, len(R)), R, contour, ol); return m

    def poly(self, pts, R, flat=2, contour=False, ol=True):
        im = Image.new('1', (self.W, self.H), 0)
        ImageDraw.Draw(im).polygon([((x - self.ox) * self.S, (y - self.oy) * self.S) for x, y in pts], fill=1)
        m = np.array(im, bool)
        self.put(m, flat, R, contour, ol); return m

    def mask_put(self, m, col, ol_col=None):
        self.rgb[m] = col; self.a |= m
        if ol_col is not None: self.ol[m] = ol_col; self.ol2[m] = ol_col

    def apx(self, i, j, col, n=1):
        i, j = int(i), int(j)
        if 0 <= i < self.W and 0 <= j < self.H:
            self.rgb[j:j + n, i:i + n] = col; self.a[j:j + n, i:i + n] = True

    def dot(self, lx, ly, col, n=1):
        self.apx(math.floor((lx - self.ox) * self.S), math.floor((ly - self.oy) * self.S), col, n)

    def fxdot(self, lx, ly, col, n=1):
        self.fx.append((math.floor((lx - self.ox) * self.S), math.floor((ly - self.oy) * self.S), col, n))

    def art(self, lx, ly):
        return math.floor((lx - self.ox) * self.S), math.floor((ly - self.oy) * self.S)


class Canvas:
    def __init__(self, w, h, S, bg=(0, 0, 0)):
        self.S = S; self.W, self.H = w * S, h * S
        self.rgb = np.zeros((self.H, self.W, 3), np.uint8); self.rgb[:] = bg

    def comp(self, L, outline=True, selout=True):
        x0 = int(round(L.ox * self.S)); y0 = int(round(L.oy * self.S))
        rgb = L.rgb.copy(); a = L.a.copy()
        if outline:
            out = dil4(L.a) & ~L.a
            col = np.zeros_like(L.rgb)
            # neighbour inside the sprite: below or right means this outline
            # pixel is on the lit (top-left) side
            for (dy, dx), lit in (((1, 0), True), ((0, 1), True), ((-1, 0), False), ((0, -1), False)):
                src_a = np.roll(L.a, (-dy, -dx), (0, 1))
                src_c = np.roll(L.ol2 if (lit and selout) else L.ol, (-dy, -dx), (0, 1))
                take = out & src_a
                col[take] = src_c[take]
            rgb[out] = col[out]; a |= out
        H, W = a.shape
        ya, yb = max(0, y0), min(self.H, y0 + H); xa, xb = max(0, x0), min(self.W, x0 + W)
        if ya >= yb or xa >= xb: return
        sub_a = a[ya - y0:yb - y0, xa - x0:xb - x0]
        dst = self.rgb[ya:yb, xa:xb]
        dst[sub_a] = rgb[ya - y0:yb - y0, xa - x0:xb - x0][sub_a]
        for i, j, col, n in L.fx:
            X, Y = x0 + i, y0 + j
            if 0 <= X < self.W and 0 <= Y < self.H: self.rgb[Y:Y + n, X:X + n] = col

    def img(self): return Image.fromarray(self.rgb)
