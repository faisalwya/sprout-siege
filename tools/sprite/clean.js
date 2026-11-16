// Sprite cleanup: turns an image-model picture that only looks like pixel art
// into a real sprite on the game's grid and palette.
//
//   node tools/sprite/clean.js picture.png [--out sprite.png] [options]
//
// Steps, in this order (the order matters):
//   1. grid      find the size of the picture's fake pixels and read one
//                colour per cell
//   2. downscale only if the figure is too big for the tower canvas
//   3. palette   move every colour to the nearest master palette colour
//   4. background remove the flat backdrop and the soft fringe it leaves
//   5. outline   rebuild the outer ring as a coloured outline, lit top left
//   6. place     centred, feet on the canvas's feet row
//
// Options:
//   --out FILE        where to write (default: tools/out/sprite/<name>.png)
//   --canvas WxH      tower canvas (default from the palette file: 36x48)
//   --bottom N        row the feet stand on (default from the palette file)
//   --tall N          make the figure N art pixels tall (default: keep its
//                     size, shrink only if it does not fit)
//   --cell N          size of one fake pixel, if the guess is wrong
//   --cells N         or: how many fake pixels span the picture's width
//   --bg #rrggbb      backdrop colour, if the guess is wrong
//   --outline MODE    inner (default: recolour the outer ring), outer (add a
//                     ring outside), keep (leave it alone)
//   --speck N         drop loose bits smaller than N pixels (default 0: keep)
//   --strip           the picture holds several figures side by side; each
//                     becomes its own sprite, all at one scale
//   --palette FILE    another palette file
//
// Writes the sprite one art pixel per pixel, plus <name>.json with what was
// detected and how it scored, so a result can be reproduced later.

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const KEY = [255, 0, 255];      // stand-in backdrop when the input is already see-through

/* ------------------------------------------------------------------ grid */
// How strongly colours change between column i-1 and column i, summed down
// the picture (or between rows, for axis 'y'). Fake pixels put these changes
// on evenly spaced lines.
function edges(img, axis) {
  const { w, h, data: d } = img, n = axis === 'x' ? w : h, m = axis === 'x' ? h : w, out = new Float64Array(n);
  const st = axis === 'x' ? 4 : w * 4;
  for (let i = 1; i < n; i++) {
    let s = 0;
    for (let j = 0; j < m; j++) {
      const k = (axis === 'x' ? j * w + i : i * w + j) * 4;
      s += Math.abs(d[k] - d[k - st]) + Math.abs(d[k + 1] - d[k + 1 - st]) + Math.abs(d[k + 2] - d[k + 2 - st]);
    }
    out[i] = s;
  }
  return out;
}
// Fake pixels put nearly all of a picture's colour changes on evenly spaced
// lines. For each spacing p this asks: what share of all the change lies within
// a small window round the lines of the best comb with that spacing? The true
// spacing catches nearly all of it. So do its halves and thirds, and its
// doubles catch about half, so the answer is the largest spacing that still
// catches nearly everything. Returns {p, ph: where a line falls, score}.
function detectAxis(prof) {
  const n = prof.length, sorted = Float64Array.from(prof).sort(), floor = sorted[n >> 1];
  const e = prof.map(v => Math.max(0, v - floor));
  const total = e.reduce((a, b) => a + b, 0);
  if (!total || n < 96) return { p: 1, ph: 0, score: 0 };
  const pre = new Float64Array(n + 1); for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + e[i];
  const catchOf = (p, ph, tol) => { let s = 0; for (let x = ph; x < n + tol; x += p) { const i = Math.round(x); s += pre[Math.min(n, Math.max(0, i + tol + 1))] - pre[Math.min(n, Math.max(0, i - tol))]; } return s / total; };
  const cands = [];
  for (let p = 4; p <= Math.min(96, n / 6); p += 0.05) {
    const tol = Math.max(1, Math.round(p * 0.15)); if ((2 * tol + 1) / p > 0.6) continue;   // a window that wide catches anything
    let b = 0, bph = 0;
    for (let ph = 0; ph < p; ph += 0.5) { const s = catchOf(p, ph, tol); if (s > b) { b = s; bph = ph; } }
    cands.push({ p, ph: bph, score: b });
  }
  const top = Math.max(0, ...cands.map(c => c.score));
  if (top < 0.7) return { p: 1, ph: 0, score: top };            // no comb explains it: already one pixel per cell
  let hi = cands.length - 1; while (cands[hi].score < top * 0.9) hi--;          // the largest such spacing
  let lo = hi; while (lo > 0 && cands[lo - 1].score >= top * 0.9 && cands[lo].p - cands[lo - 1].p < 0.06) lo--;
  const pick = cands[hi];
  let fine = { p: pick.p, ph: pick.ph, score: 0 };
  // The windows forgive, so a run of spacings all score well. Sharpen inside
  // that run: lines that hit the changes dead on score best.
  for (let p = cands[lo].p - 0.05; p <= pick.p + 0.05; p += 0.005) for (let ph = 0; ph < p; ph += 0.25) {
    const s = catchOf(p, ph, 0) + 0.5 * catchOf(p, ph, 1); if (s > fine.score) fine = { p, ph, score: s };
  }
  return { p: fine.p, ph: fine.ph, score: pick.score };
}
function detectGrid(img, o) {
  if (o.cell) return { px: +o.cell, py: +o.cell, phx: 0, phy: 0, score: 0, given: true };
  if (o.cells) { const p = img.w / +o.cells; return { px: p, py: p, phx: 0, phy: 0, score: 0, given: true }; }
  const gx = detectAxis(edges(img, 'x')), gy = detectAxis(edges(img, 'y'));
  // a real grid is square: if one direction is unsure, trust the other
  if (gx.p === 1 && gy.p > 1) { gx.p = gy.p; gx.ph = 0; } else if (gy.p === 1 && gx.p > 1) { gy.p = gx.p; gy.ph = 0; }
  return { px: gx.p, py: gy.p, phx: gx.ph, phy: gy.ph, score: Math.min(gx.score, gy.score) };
}
// One colour per cell: the middle value of the cell's inner part, so soft
// edges between cells do not leak in. Also says how flat each cell was.
function sampleCells(img, g) {
  const cells = (n, p, ph) => { const x0 = ph - Math.ceil(ph / p) * p, out = []; for (let i = 0; x0 + (i + 0.5) * p < n; i++) if (x0 + (i + 0.5) * p >= 0) out.push(x0 + i * p); return out; };
  const xs = cells(img.w, g.px, g.phx), ys = cells(img.h, g.py, g.phy);
  const out = L.blank(xs.length, ys.length), flat = new Uint8Array(xs.length * ys.length);
  const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
  ys.forEach((y0, j) => xs.forEach((x0, i) => {
    const ax = Math.max(0, Math.round(x0 + g.px * 0.25)), bx = Math.min(img.w - 1, Math.max(ax, Math.round(x0 + g.px * 0.75) - 1));
    const ay = Math.max(0, Math.round(y0 + g.py * 0.25)), by = Math.min(img.h - 1, Math.max(ay, Math.round(y0 + g.py * 0.75) - 1));
    const r = [], gg = [], b = [];
    for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) { const k = (y * img.w + x) * 4; r.push(img.data[k]); gg.push(img.data[k + 1]); b.push(img.data[k + 2]); }
    const c = [med(r), med(gg), med(b)];
    let dev = 0; for (let k = 0; k < r.length; k++) dev += Math.abs(r[k] - c[0]) + Math.abs(gg[k] - c[1]) + Math.abs(b[k] - c[2]);
    flat[j * xs.length + i] = dev / r.length / 3 < 10 ? 1 : 0;
    L.put(out, i, j, c);
  }));
  return { img: out, flat };
}

/* ------------------------------------------------------------- the steps */
function guessBg(cells) {
  const tally = new Map(), { w, h } = cells;
  const see = (x, y) => { const c = L.px(cells, x, y), k = (c[0] >> 3) << 10 | (c[1] >> 3) << 5 | (c[2] >> 3); const t = tally.get(k) || { n: 0, s: [0, 0, 0] }; t.n++; t.s[0] += c[0]; t.s[1] += c[1]; t.s[2] += c[2]; tally.set(k, t); };
  for (let x = 0; x < w; x++) { see(x, 0); see(x, h - 1); }
  for (let y = 0; y < h; y++) { see(0, y); see(w - 1, y); }
  const top = [...tally.values()].sort((a, b) => b.n - a.n)[0];
  return top.s.map(v => Math.round(v / top.n));
}
// boxes of the figures in a cell picture: one, or one per run of occupied
// columns when the picture is a strip
function findFigures(cells, bg, strip) {
  const { w, h } = cells, on = (x, y) => L.dist(L.px(cells, x, y), bg) >= 0.10;
  const cols = []; for (let x = 0; x < w; x++) { let n = 0; for (let y = 0; y < h; y++) if (on(x, y)) n++; cols.push(n); }
  const runs = []; let start = -1, gap = 0;
  for (let x = 0; x <= w; x++) {
    const full = x < w && cols[x] > 0;
    if (full) { if (start < 0) start = x; gap = 0; }
    else if (start >= 0 && (++gap >= (strip ? 3 : 1e9) || x === w)) { runs.push([start, x - gap]); start = -1; gap = 0; }
  }
  const boxes = runs.map(([l, r]) => { let t = 1e9, b = -1; for (let y = 0; y < h; y++) for (let x = l; x <= r; x++) if (on(x, y)) { if (y < t) t = y; if (y > b) b = y; } return { l, r, t, b, w: r - l + 1, h: b - t + 1 }; });
  return boxes.filter(b => b.w * b.h >= 16);
}
function crop(cells, b, s, bg) {           // box plus a one cell rim, resampled nearest-neighbour by s
  const w = Math.max(1, Math.round(b.w * s)), h = Math.max(1, Math.round(b.h * s)), out = L.blank(w + 2, h + 2, bg.concat(255));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(b.r, b.l + Math.floor((x + 0.5) / s)), sy = Math.min(b.b, b.t + Math.floor((y + 0.5) / s));
    L.put(out, x + 1, y + 1, L.px(cells, sx, sy));
  }
  return out;
}
function cleanFigure(raw, bg, P, o) {
  const { w, h } = raw, N = w * h, on = new Uint8Array(N), out = L.blank(w, h);
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && on[y * w + x];
  const stats = { far: 0, farMax: 0, fringe: 0, specks: 0 };
  // 3. palette, with the backdrop as one more colour, and 4. drop the backdrop
  let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = L.px(raw, x, y), dbg = L.dist(c, bg), near = L.nearest(P, c);
    if (dbg < near.d && dbg < 0.16) continue;
    on[y * w + x] = 1; L.put(out, x, y, near.rgb); stats.far += near.d; stats.farMax = Math.max(stats.farMax, near.d); n++;
  }
  stats.far = n ? stats.far / n : 0;
  // 4b. the fringe: an edge pixel whose colour is a blend of the figure and the
  // backdrop, more backdrop than figure, belongs to the backdrop
  const open = (x, y) => !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
  for (let pass = 0; pass < 2; pass++) {
    const kill = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!at(x, y) || !open(x, y)) continue;
      let inner = null, far = -1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(x + dx, y + dy) && !open(x + dx, y + dy)) {
        const c = L.px(raw, x + dx, y + dy), d = L.dist(c, bg); if (d > far) { far = d; inner = c; }
      }
      if (!inner) continue;
      const c = L.px(raw, x, y), v = [0, 1, 2].map(k => bg[k] - inner[k]), u = [0, 1, 2].map(k => c[k] - inner[k]);
      const vv = v[0] * v[0] + v[1] * v[1] + v[2] * v[2]; if (vv < 900) continue;
      const t = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / vv;
      const res = Math.hypot(u[0] - t * v[0], u[1] - t * v[1], u[2] - t * v[2]) / Math.sqrt(vv);
      if (t > 0.45 && res < 0.3) kill.push(y * w + x);
    }
    kill.forEach(k => { on[k] = 0; out.data[k * 4 + 3] = 0; }); stats.fringe += kill.length;
    if (!kill.length) break;
  }
  // loose bits, only if asked: some sprites have real ones (the sprinkler's drops)
  if (+o.speck > 0) {
    const seen = new Uint8Array(N);
    for (let s = 0; s < N; s++) {
      if (!on[s] || seen[s]) continue;
      const comp = [s]; seen[s] = 1;
      for (let k = 0; k < comp.length; k++) { const x = comp[k] % w, y = (comp[k] - x) / w;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = (y + dy) * w + x + dx; if (at(x + dx, y + dy) && !seen[q]) { seen[q] = 1; comp.push(q); } } }
      if (comp.length < +o.speck) { comp.forEach(k => { on[k] = 0; out.data[k * 4 + 3] = 0; }); stats.specks += comp.length; }
    }
  }
  // 5. the outline. Same recipe as the game's mkOutlined(): the colour of what
  // it wraps, pulled toward ink, darker on the sides facing away from the light.
  const mode = o.outline || 'inner', ink = L.rgb(P.ink);
  const tone = (base, lit) => { const dk = L.mix(base.map(v => v * 0.55), ink, 0.45); return L.nearest(P, lit ? L.mix(dk, base, 0.3) : dk).rgb; };
  if (mode === 'inner') {
    const ring = new Uint8Array(N);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y) && open(x, y)) ring[y * w + x] = 1;
    const paint = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!ring[y * w + x]) continue;
      // what is behind this edge pixel: the commonest inside colour nearby,
      // skipping an old dark outline if anything lighter is there. A part too
      // thin to have an inside (a drop, a tendril) keeps its own colour.
      let touches = false; const tally = new Map();
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (!at(x + dx, y + dy) || ring[(y + dy) * w + x + dx]) continue;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) touches = true;
        const hx = L.hex(L.px(out, x + dx, y + dy)); tally.set(hx, (tally.get(hx) || 0) + 1);
      }
      if (!touches) continue;
      const cand = [...tally.entries()].map(([hx, k]) => ({ c: L.rgb(hx), k, L: L.lab(L.rgb(hx))[0] })).sort((a, b) => b.k - a.k);
      const pickd = cand.find(c => c.L >= 0.34) || cand[0], base = pickd.c;
      // a light detail that sits on the edge (a wing, a glint) is not outline: leave it
      const own = L.px(out, x, y).slice(0, 3);
      if (L.lab(own)[0] > pickd.L + 0.08 && L.dist(own, base) > 0.12) continue;
      const awayOnly = (!at(x, y + 1) || !at(x + 1, y)) && at(x, y - 1) && at(x - 1, y);
      paint.push([x, y, tone(base, !awayOnly)]);
    }
    paint.forEach(([x, y, c]) => L.put(out, x, y, c));
  } else if (mode === 'outer') {
    const add = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (at(x, y)) continue;
      const dark = at(x, y - 1) ? [x, y - 1] : at(x - 1, y) ? [x - 1, y] : null, lit = at(x, y + 1) ? [x, y + 1] : at(x + 1, y) ? [x + 1, y] : null;
      if (!dark && !lit) continue;
      const s = dark || lit; add.push([x, y, tone(L.px(out, s[0], s[1]).slice(0, 3), !dark)]);
    }
    add.forEach(([x, y, c]) => L.put(out, x, y, c));
  }
  return { img: out, stats };
}
// 6. centred on the canvas, lowest pixel on the feet row
function place(img, canvas) {
  const b = L.bbox(img), out = L.blank(canvas.w, canvas.h);
  if (!b) return out;
  const x0 = Math.ceil((canvas.w - b.w) / 2) - b.l, y0 = canvas.bottom - b.b;   // an odd pixel goes left, as in the v34 towers
  for (let y = b.t; y <= b.b; y++) for (let x = b.l; x <= b.r; x++) { const c = L.px(img, x, y); if (c[3]) L.put(out, x + x0, y + y0, c); }
  return out;
}

/* -------------------------------------------------------------- the whole */
// src: a loaded image. Returns {grid, bg, sprites:[{img, report}]}.
function clean(src, P, o) {
  o = o || {};
  const canvas = Object.assign({}, P.canvas);
  if (o.canvas) { const m = String(o.canvas).split('x'); canvas.w = +m[0]; canvas.h = +m[1]; canvas.bottom = Math.round(P.canvas.bottom + (canvas.h - P.canvas.h)); }
  if (o.bottom !== undefined) canvas.bottom = +o.bottom;
  // a see-through input: stand it on a flat backdrop so the same steps apply
  let clear = 0; for (let i = 3; i < src.data.length; i += 4) if (src.data[i] < 128) clear++;
  const seeThrough = clear > src.w * src.h * 0.02;
  const flatSrc = L.blank(src.w, src.h);
  for (let i = 0; i < src.w * src.h; i++) { const a = src.data[i * 4 + 3] / 255; for (let k = 0; k < 3; k++) flatSrc.data[i * 4 + k] = seeThrough ? src.data[i * 4 + k] * a + KEY[k] * (1 - a) : src.data[i * 4 + k]; flatSrc.data[i * 4 + 3] = 255; }

  const grid = detectGrid(flatSrc, o), sampled = sampleCells(flatSrc, grid), cells = sampled.img;
  const bg = o.bg ? L.rgb(o.bg) : seeThrough ? KEY : guessBg(cells);
  const boxes = findFigures(cells, bg, !!o.strip);
  if (!boxes.length) throw new Error('no figure found: the whole picture looks like backdrop (' + L.hex(bg) + ')');
  const maxW = canvas.w - 2, maxH = canvas.bottom + 1, big = { w: Math.max(...boxes.map(b => b.w)), h: Math.max(...boxes.map(b => b.h)) };
  let s = Math.min(1, maxW / big.w, maxH / big.h);
  if (o.tall) s = Math.min(+o.tall / big.h, maxW / big.w, maxH / big.h);
  if (Math.abs(s - 1) < 0.02) s = 1;

  const sprites = boxes.map(b => {
    let flat = 0, n = 0;
    for (let y = b.t; y <= b.b; y++) for (let x = b.l; x <= b.r; x++) { n++; flat += sampled.flat[y * cells.w + x]; }
    const { img, stats } = cleanFigure(crop(cells, b, s, bg), bg, P, o), placed = place(img, canvas), res = L.check(placed, P, canvas);
    const warn = [];
    if (s < 1) warn.push('figure was ' + b.w + 'x' + b.h + ' cells, shrunk to ' + Math.round(s * 100) + '% to fit ' + canvas.w + 'x' + canvas.h + ': fine detail can drop. A taller canvas (--canvas) or a smaller figure avoids this.');
    if (s > 1) warn.push('figure was enlarged to ' + Math.round(s * 100) + '%: pixels will look doubled in places.');
    if (grid.px > 1 && flat / n < 0.85) warn.push('only ' + Math.round(flat / n * 100) + '% of the cells were one flat colour: the picture is not on a steady grid.');
    if (stats.far > 0.06) warn.push('colours sat far from the master palette on average (' + stats.far.toFixed(3) + '): expect a visible colour shift.');
    return { img: placed, report: {
      cells: b.w + 'x' + b.h, scale: +s.toFixed(3), drawn: (L.bbox(placed) || { w: 0 }).w + 'x' + (L.bbox(placed) || { h: 0 }).h,
      onGrid: +(flat / n).toFixed(3), colours: res.colours, paletteShiftMean: +stats.far.toFixed(4), paletteShiftMax: +stats.farMax.toFixed(4),
      fringeRemoved: stats.fringe, specksRemoved: stats.specks, checks: res.checks, ok: res.ok, warnings: warn } };
  });
  return { grid: { cell: [+grid.px.toFixed(3), +grid.py.toFixed(3)], confidence: +grid.score.toFixed(2), given: !!grid.given, size: cells.w + 'x' + cells.h },
    bg: L.hex(bg), canvas, sprites };
}

module.exports = { clean, detectGrid, sampleCells };

if (require.main === module) (async () => {
  const o = L.args(process.argv.slice(2));
  if (!o._.length) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n')); process.exit(1); }
  const P = L.loadPalette(o.palette === true ? undefined : o.palette);
  let bad = false;
  for (const file of o._) {
    const r = clean(await L.load(file), P, o), name = path.basename(file).replace(/\.[^.]+$/, '');
    console.log(path.basename(file) + ': fake pixel ' + (r.grid.cell[0] === 1 ? 'is one real pixel' : r.grid.cell[0] + ' x ' + r.grid.cell[1] + ' real pixels') +
      (r.grid.given ? ' (given)' : ', confidence ' + r.grid.confidence) + ', ' + r.grid.size + ' cells, backdrop ' + r.bg);
    r.sprites.forEach((sp, i) => {
      const base = o.out && o._.length === 1 ? String(o.out).replace(/\.png$/i, '') : path.join(L.DIR, '..', 'out', 'sprite', name);
      let out = base + (r.sprites.length > 1 ? '-' + (i + 1) : '') + '.png'; const rep = sp.report;
      if (path.resolve(out) === path.resolve(file)) out = out.replace(/\.png$/, '-clean.png');     // never write over the picture
      L.savePNG(out, sp.img);
      fs.writeFileSync(out.replace(/\.png$/, '.json'), JSON.stringify({ source: path.basename(file), options: Object.assign({}, o, { _: undefined }), grid: r.grid, backdrop: r.bg, canvas: r.canvas, result: rep }, null, 1) + '\n');
      console.log('  -> ' + path.relative(process.cwd(), out) + '  drawn ' + rep.drawn + ', ' + rep.colours + ' colours, ' + Math.round(rep.onGrid * 100) + '% on grid, palette shift ' + rep.paletteShiftMean);
      rep.checks.forEach(c => console.log('     ' + (c.ok ? 'PASS' : c.soft ? 'HINT' : 'FAIL') + '  ' + c.name + ': ' + c.info));
      rep.warnings.forEach(w => console.log('     NOTE  ' + w));
      if (!rep.ok) bad = true;
    });
  }
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
