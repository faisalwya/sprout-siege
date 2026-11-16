// Self-test for the sprite tools. There is no image-model art yet, so this
// fakes some: each v34 level 1 tower is blown up with a fake pixel size that
// is not a whole number, shifted off the corner, blurred (by about a tenth of
// a fake pixel), tinted and given noise on a magenta backdrop. The cleanup has to give the original back.
//
//   node tools/sprite/test.js        (or: npm run sprite:test)
//
// Prints PASS or FAIL per check and writes tools/out/sprite/test-cleanup.png
// (the wrecked picture, the cleaned sprite and the original, side by side).

const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { clean } = require('./clean');

const P = L.loadPalette();
const OUT = path.join(L.DIR, '..', 'out', 'sprite');
const FAMS = ['gnome', 'sprink', 'zap', 'hive'];
const ref = f => L.decodePNG(fs.readFileSync(path.join(L.DIR, 'ref', f + '-L1.png')));

let seed = 20261116;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// what an image model hands back: big, soft, slightly off in colour
function wreck(sprites, cell, o) {
  o = o || {};
  const gap = 5, wCells = sprites.reduce((a, s) => a + s.w + gap, gap), hCells = Math.max(...sprites.map(s => s.h)) + 2 * gap;
  const W = Math.ceil(wCells * cell + 30), H = Math.ceil(hCells * cell + 30), ox = 7.3, oy = 11.6;
  let img = L.blank(W, H);
  const at = (cx, cy) => { let x0 = gap; for (const s of sprites) { if (cx >= x0 && cx < x0 + s.w && cy >= gap && cy < gap + s.h) { const c = L.px(s, cx - x0, cy - gap); return c[3] ? c : null; } x0 += s.w + gap; } return null; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(Math.floor((x - ox) / cell), Math.floor((y - oy) / cell));
    L.put(img, x, y, c || [236 + Math.round(y / H * 12), 18, 222]);          // magenta, not quite flat
  }
  for (let pass = 0; pass < 2; pass++) {                                     // soft edges
    const src = img, r = Math.max(1, Math.round(cell * 0.1)); img = L.blank(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const s = [0, 0, 0]; let n = 0;
      for (let k = -r; k <= r; k++) { const xx = pass ? x : x + k, yy = pass ? y + k : y; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const i = (yy * W + xx) * 4; s[0] += src.data[i]; s[1] += src.data[i + 1]; s[2] += src.data[i + 2]; n++; }
      L.put(img, x, y, s.map(v => v / n));
    }
  }
  for (let i = 0; i < W * H; i++) {                                          // colour drift and grain
    const d = img.data, k = i * 4;
    d[k] = d[k] * 0.985 + 3 + (rnd() - 0.5) * 12; d[k + 1] = d[k + 1] * 1.01 + (rnd() - 0.5) * 12; d[k + 2] = d[k + 2] * 0.99 + (rnd() - 0.5) * 12;
  }
  return img;
}
function grow(s, k) { const o = L.blank(Math.round(s.w * k), Math.round(s.h * k)); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const c = L.px(s, Math.floor(x / k), Math.floor(y / k)); if (c[3]) L.put(o, x, y, c); } return o; }
// Share of the figure's pixels that match exactly, and how well the shapes
// overlap. Figures are lined up by their own edges first: the v34 towers were
// placed by hand, up to a pixel off the canvas middle.
function compare(a, b) {
  const ba = L.bbox(a), bb = L.bbox(b), w = Math.max(ba.w, bb.w), h = Math.max(ba.h, bb.h);
  let both = 0, either = 0, same = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ca = x < ba.w && y < ba.h ? L.px(a, ba.l + x, ba.t + y) : [0, 0, 0, 0], cb = x < bb.w && y < bb.h ? L.px(b, bb.l + x, bb.t + y) : [0, 0, 0, 0];
    if (ca[3] || cb[3]) either++;
    if (ca[3] && cb[3]) { both++; if (ca[0] === cb[0] && ca[1] === cb[1] && ca[2] === cb[2]) same++; }
  }
  return { shape: both / either, colour: same / both };
}

const results = [];
const ok = (name, pass, info) => { results.push(pass); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (info ? '   (' + info + ')' : '')); };
const pct = v => (v * 100).toFixed(1) + '%';

const shots = [];
FAMS.forEach((f, i) => {
  const orig = ref(f), cell = [13.37, 16, 9.6, 21.33][i], pic = wreck([orig], cell);
  const canvas = { bottom: L.bbox(orig).b };                       // the zap lamp stands one row lower
  const kept = clean(pic, P, { outline: 'keep', bottom: canvas.bottom }), built = clean(pic, P, { bottom: canvas.bottom });
  const k = kept.sprites[0], b = built.sprites[0], ck = compare(k.img, orig), cb = compare(b.img, orig);
  ok(f + ': finds the fake pixel size', Math.abs(kept.grid.cell[0] - cell) < 0.08 && Math.abs(kept.grid.cell[1] - cell) < 0.08, 'true ' + cell + ', found ' + kept.grid.cell.join(' x '));
  ok(f + ': gets the original back', ck.shape >= 0.985 && ck.colour >= 0.97, 'shape ' + pct(ck.shape) + ', colours ' + pct(ck.colour));
  ok(f + ': passes the checklist with a rebuilt outline', b.report.ok && cb.shape >= 0.985, b.report.checks.filter(c => !c.ok && !c.soft).map(c => c.name).join(', ') || b.report.colours + ' colours, shape ' + pct(cb.shape));
  shots.push({ pic, cleaned: b.img, kept: k.img, orig });
  if (f === 'gnome') L.savePNG(path.join(OUT, 'wrecked-gnome.png'), pic);     // something to try clean.js on by hand
});
{ // a figure too big for the canvas has to be shrunk, and still pass
  const r = clean(wreck([grow(ref('gnome'), 1.5)], 11.2), P, {}), s = r.sprites[0];
  ok('oversized gnome: shrunk to fit and passes', s.report.ok && s.report.scale < 1, 'scale ' + s.report.scale + ', drawn ' + s.report.drawn);
}
{ // a strip of two figures becomes two sprites
  const r = clean(wreck([ref('gnome'), ref('hive')], 12), P, { strip: true });
  ok('strip: two figures, two sprites', r.sprites.length === 2 && r.sprites.every(s => s.report.ok), r.sprites.map(s => s.report.drawn).join(' and '));
}
{ // a sprite that is already clean comes through untouched
  const o = ref('hive'), r = clean(o, P, { outline: 'keep' }), c = compare(r.sprites[0].img, o);
  ok('clean input: unchanged', r.grid.cell[0] === 1 && c.shape === 1 && c.colour === 1, 'shape ' + pct(c.shape) + ', colours ' + pct(c.colour));
}

// before and after, to look at
const Z = 8, PAD = 24, colW = 36 * Z + PAD, rowH = 48 * Z + PAD + 20;
const sheet = L.blank(PAD + colW * 4, 60 + rowH * FAMS.length, [36, 32, 44, 255]);
['MODEL PICTURE (SHRUNK)', 'SAME, REAL SIZE DETAIL', 'CLEANED', 'ORIGINAL V34'].forEach((t, i) => L.text(sheet, PAD + i * colW, 20, t, [255, 238, 221], 3));
shots.forEach((s, r) => {
  const y = 60 + r * rowH, k = Math.max(s.pic.w / (36 * Z), s.pic.h / (48 * Z));
  for (let j = 0; j < 48 * Z; j++) for (let i = 0; i < 36 * Z; i++) {
    const sx = Math.floor(i * k), sy = Math.floor(j * k); if (sx < s.pic.w && sy < s.pic.h) L.put(sheet, PAD + i, y + j, L.px(s.pic, sx, sy));
    const cx = Math.floor(s.pic.w * 0.3) + i, cy = Math.floor(s.pic.h * 0.25) + j; if (cx < s.pic.w && cy < s.pic.h) L.put(sheet, PAD + colW + i, y + j, L.px(s.pic, cx, cy));
  }
  [s.cleaned, s.orig].forEach((im, i) => { L.fill(sheet, PAD + (2 + i) * colW, y, 36 * Z, 48 * Z, L.rgb(P.grounds.spring)); L.stamp(sheet, im, PAD + (2 + i) * colW, y, Z); });
});
L.savePNG(path.join(OUT, 'test-cleanup.png'), sheet);

const pass = results.filter(Boolean).length;
console.log('\n' + pass + '/' + results.length + ' passed. Picture in tools/out/sprite/test-cleanup.png');
process.exit(pass === results.length ? 0 : 1);
