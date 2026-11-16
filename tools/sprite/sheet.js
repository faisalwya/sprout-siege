// Contact sheet: every sprite on all four season grounds at the size it has on
// the phone, the same again enlarged, and as black silhouettes.
//
//   node tools/sprite/sheet.js sprite.png [more.png ...] [--out sheet.png]
//   node tools/sprite/sheet.js "L2 satchel=out/gnome-L2.png" ...   (a label before =)
//
// Options:
//   --out FILE      where to write (default: tools/out/sprite/contact-sheet.png)
//   --title TEXT    heading
//   --no-refs       leave out the four v34 level 1 reference towers
//   --palette FILE  another palette file
//
// The sheet is 2556 pixels wide, the iPhone 15 Pro's screen in landscape. Open
// it on the phone, turn the phone sideways and let it fill the width: the
// "phone size" rows are then exactly as big as the sprites are in the game
// (one art pixel covers 4 screen pixels). Sprites are stood on the feet row,
// so different canvas sizes line up.
//
// Under each name: OK if the sprite passes the automatic checks (canvas,
// hard edges, palette, no black, feet row, centred), or what failed.

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const SHEET_W = 2556, PHONE = 4;                 // 852 pt x 3, and 640 art px across it
const BG = [36, 32, 44, 255], PANEL = [48, 43, 58, 255], TXT = [255, 238, 221], DIM = [170, 160, 180], GOOD = [142, 232, 138], BAD = [255, 123, 123];
const PAPER = [232, 228, 218];                   // behind the silhouettes

async function sheet(items, P, o) {
  o = o || {};
  const n = items.length, seasons = Object.keys(P.grounds);
  const cw = Math.max(...items.map(s => s.img.w)), chh = Math.max(...items.map(s => s.img.h));
  const LEFT = 150, PAD = 24;
  const zoom = Math.max(PHONE + 1, Math.min(8, Math.floor((SHEET_W - LEFT - PAD) / n / (cw + 6))));
  const band = z => chh * z + 2 * 3 * z, colW = (SHEET_W - LEFT - PAD) / n;
  const head = 190, gapS = 70;
  const H = head + (band(PHONE) * 4 + gapS) + (band(zoom) * 4 + gapS) + (band(zoom) + band(PHONE) + gapS) + 40;
  const img = L.blank(SHEET_W, H, BG);

  L.text(img, PAD, 24, o.title || 'CONTACT SHEET', TXT, 6);
  items.forEach((s, i) => {
    const x = Math.round(LEFT + colW * i + colW / 2);
    L.text(img, x - Math.round(L.textW(s.label, 3) / 2), 84, s.label, TXT, 3);
    const res = L.check(s.img, P, { w: s.img.w, h: s.img.h, bottom: s.ref ? (L.bbox(s.img) || {}).b : P.canvas.bottom + (s.img.h - P.canvas.h) });
    const fails = res.checks.filter(c => !c.ok && !c.soft).map(c => c.name);
    const note = fails.length ? fails.join(', ') : 'OK ' + res.colours + ' COL';
    L.text(img, x - Math.round(L.textW(note, 2) / 2), 108, note, fails.length ? BAD : GOOD, 2);
    s.x = x;
  });
  // one row of sprites on a ground colour, feet on a shared line
  const row = (y, z, ground, tint, label) => {
    L.fill(img, LEFT - 10, y, SHEET_W - LEFT - PAD + 10, band(z), ground.concat(255));
    L.text(img, PAD, y + Math.round(band(z) / 2) - 8, label, DIM, 3);
    for (const s of items) {
      const b = L.bbox(s.img) || { b: s.img.h - 1 };
      L.stamp(img, s.img, s.x - Math.round(s.img.w * z / 2), y + 3 * z + (chh - 1 - b.b) * z, z, tint);
    }
  };
  let y = head;
  const section = t => { L.text(img, PAD, y - 30, t, TXT, 3); };
  section('PHONE SIZE: REAL SIZE WHEN THIS SHEET FILLS AN IPHONE 15 PRO SCREEN, SIDEWAYS');
  for (const sN of seasons) { row(y, PHONE, L.rgb(P.grounds[sN]), null, sN); y += band(PHONE); }
  y += gapS; section('ENLARGED ' + zoom + 'X');
  for (const sN of seasons) { row(y, zoom, L.rgb(P.grounds[sN]), null, sN); y += band(zoom); }
  y += gapS; section('SILHOUETTES: CAN YOU TELL EACH ONE FROM ITS NEIGHBOURS?');
  row(y, zoom, PAPER, [20, 18, 26], 'shape'); y += band(zoom);
  row(y, PHONE, PAPER, [20, 18, 26], 'phone'); y += band(PHONE);
  return img;
}
module.exports = { sheet };

if (require.main === module) (async () => {
  const o = L.args(process.argv.slice(2));
  if (!o._.length && o['no-refs']) { console.log('nothing to show'); process.exit(1); }
  const P = L.loadPalette(o.palette === true ? undefined : o.palette), items = [];
  if (!o['no-refs']) for (const f of Object.keys(P.families)) items.push({ label: f + ' L1', ref: true, img: await L.load(path.join(L.DIR, 'ref', f + '-L1.png')) });
  for (const a of o._) {
    const k = a.indexOf('='), file = k > 0 ? a.slice(k + 1) : a;
    items.push({ label: k > 0 ? a.slice(0, k) : path.basename(file).replace(/\.[^.]+$/, ''), img: await L.load(file) });
  }
  const out = o.out && o.out !== true ? o.out : path.join(L.DIR, '..', 'out', 'sprite', 'contact-sheet.png');
  const img = await sheet(items, P, o);
  L.savePNG(out, img);
  console.log('contact sheet: ' + items.length + ' sprites, ' + img.w + 'x' + img.h + ' -> ' + path.relative(process.cwd(), out));
})().catch(e => { console.error(e.message); process.exit(1); });
