// Shared helpers for the sprite tools: PNG in and out, colour maths, the
// master palette, the acceptance checks and a tiny pixel font for labels.
// Plain Node, no packages. Chromium (through Playwright) is only started when
// an input is not a PNG this file can read itself (JPEG, WebP, interlaced).
//
// An image here is {w, h, data}: data is RGBA bytes, row by row.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIR = __dirname;
const ROOT = path.resolve(DIR, '..', '..');
const PALETTE_FILE = path.join(DIR, 'master-palette.json');

/* ---------------------------------------------------------------- images */
function blank(w, h, rgba) {
  const data = new Uint8ClampedArray(w * h * 4);
  if (rgba) for (let i = 0; i < w * h; i++) data.set(rgba, i * 4);
  return { w, h, data };
}
function px(img, x, y) { const i = (y * img.w + x) * 4, d = img.data; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; }
function put(img, x, y, c) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = c.length > 3 ? c[3] : 255;
}
function fill(img, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(img, i, j, c); }
// nearest-neighbour stamp at an integer scale, skipping transparent pixels;
// tint replaces every opaque pixel with one colour (for silhouettes)
function stamp(dst, src, x, y, s, tint) {
  for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) {
    const c = px(src, i, j); if (c[3] < 128) continue;
    fill(dst, x + i * s, y + j * s, s, s, tint || c);
  }
}
function bbox(img) {
  let l = 1e9, r = -1, t = 1e9, b = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] >= 128) {
    if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y;
  }
  return r < 0 ? null : { l, r, t, b, w: r - l + 1, h: b - t + 1 };
}

/* ------------------------------------------------------------------- PNG */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, body) {
  const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
  const tb = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(tb));
  return Buffer.concat([len, tb, crc]);
}
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function encodePNG(img) {
  const { w, h, data } = img, raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(data.buffer, data.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function decodePNG(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let o = 8, ihdr = null, plte = null, trns = null; const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8), body = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') ihdr = body; else if (type === 'PLTE') plte = body; else if (type === 'tRNS') trns = body;
    else if (type === 'IDAT') idat.push(body); else if (type === 'IEND') break;
    o += 12 + len;
  }
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4), depth = ihdr[8], ct = ihdr[9];
  if (ihdr[12]) throw new Error('interlaced PNG');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct];
  if (!ch) throw new Error('unknown PNG colour type');
  const bpp = Math.max(1, ch * depth / 8), rb = Math.ceil(w * ch * depth / 8);
  const raw = zlib.inflateSync(Buffer.concat(idat)), cur = Buffer.alloc(rb), prev = Buffer.alloc(rb);
  const out = blank(w, h), d = out.data;
  const sample = (row, i) => depth === 8 ? row[i] : depth === 16 ? row[i * 2]
    : ((row[(i * depth) >> 3] >> (8 - depth - ((i * depth) & 7))) & ((1 << depth) - 1));
  const grey = v => depth < 8 ? Math.round(v * 255 / ((1 << depth) - 1)) : v;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (rb + 1)]; raw.copy(cur, 0, y * (rb + 1) + 1, (y + 1) * (rb + 1));
    for (let i = 0; i < rb; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = cur[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      if (ct === 3) { const k = sample(cur, x); d[j] = plte[k * 3]; d[j + 1] = plte[k * 3 + 1]; d[j + 2] = plte[k * 3 + 2]; d[j + 3] = trns && k < trns.length ? trns[k] : 255; }
      else if (ct === 0) { const v = grey(sample(cur, x)); d[j] = d[j + 1] = d[j + 2] = v; d[j + 3] = 255; }
      else if (ct === 4) { const v = sample(cur, x * 2); d[j] = d[j + 1] = d[j + 2] = v; d[j + 3] = sample(cur, x * 2 + 1); }
      else { d[j] = sample(cur, x * ch); d[j + 1] = sample(cur, x * ch + 1); d[j + 2] = sample(cur, x * ch + 2); d[j + 3] = ch === 4 ? sample(cur, x * ch + 3) : 255; }
    }
    cur.copy(prev);
  }
  return out;
}
function savePNG(file, img) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, encodePNG(img)); }
// Reads any picture a browser can: PNG here, anything else through Chromium.
async function load(file) {
  const buf = fs.readFileSync(file);
  try { return decodePNG(buf); } catch (e) { /* fall through to the browser */ }
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const mime = buf[0] === 0xff ? 'image/jpeg' : buf.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : buf.toString('ascii', 0, 3) === 'GIF' ? 'image/gif' : 'image/png';
    const r = await page.evaluate(async src => {
      const im = new Image(); im.src = src; await im.decode();
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const q = c.getContext('2d'); q.drawImage(im, 0, 0);
      const d = q.getImageData(0, 0, c.width, c.height).data; let s = '';
      for (let i = 0; i < d.length; i += 8192) s += String.fromCharCode.apply(null, d.subarray(i, i + 8192));
      return { w: c.width, h: c.height, b64: btoa(s) };
    }, 'data:' + mime + ';base64,' + buf.toString('base64'));
    return { w: r.w, h: r.h, data: new Uint8ClampedArray(Buffer.from(r.b64, 'base64')) };
  } finally { await browser.close(); }
}

/* ---------------------------------------------------------------- colour */
function hex(c) { return '#' + [c[0], c[1], c[2]].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) { return [0, 1, 2].map(i => a[i] * (1 - t) + b[i] * t); }
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
// OKLab: distances in it match how different two colours look
function lab(c) {
  const R = lin(c[0]), G = lin(c[1]), B = lin(c[2]);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function dLab(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
function dist(a, b) { return dLab(lab(a), lab(b)); }

/* --------------------------------------------------------------- palette */
// {canvas:{w,h,bottom}, ink, grounds, colours:[hex...]} plus cached Lab values
function loadPalette(file) {
  const P = JSON.parse(fs.readFileSync(file || PALETTE_FILE, 'utf8'));
  P.rgb = P.colours.map(rgb); P.lab = P.rgb.map(lab); P.set = new Set(P.colours);
  return P;
}
function nearest(P, c) {
  const L = lab(c); let best = 0, bd = 1e9;
  for (let i = 0; i < P.lab.length; i++) { const d = dLab(L, P.lab[i]); if (d < bd) { bd = d; best = i; } }
  return { i: best, rgb: P.rgb[best], d: bd };
}

/* ---------------------------------------------------------------- checks */
// The parts of the framework's acceptance checklist a script can judge.
// Each is {name, ok, info}; `soft` ones are hints, not failures.
function check(img, P, canvas) {
  canvas = canvas || P.canvas;
  const out = [], add = (name, ok, info, soft) => out.push({ name, ok, info: info || '', soft: !!soft });
  add('canvas size', img.w === canvas.w && img.h === canvas.h, img.w + 'x' + img.h + ', wanted ' + canvas.w + 'x' + canvas.h);
  let soft = 0, off = 0, black = 0, n = 0; const used = new Set(), stray = new Set();
  let tl = 0, tln = 0, br = 0, brn = 0; const b = bbox(img);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const c = px(img, x, y); if (c[3] === 0) continue;
    if (c[3] !== 255) { soft++; continue; }
    n++; const hx = hex(c); used.add(hx);
    if (!P.set.has(hx)) { off++; stray.add(hx); }
    if (c[0] < 16 && c[1] < 16 && c[2] < 16) black++;
    const L = lab(c)[0], u = (x - b.l) / b.w + (y - b.t) / b.h;
    if (u < 0.8) { tl += L; tln++; } else if (u > 1.2) { br += L; brn++; }
  }
  add('hard edges', soft === 0, soft ? soft + ' half-transparent pixels' : 'every pixel fully solid or fully clear');
  add('palette', off === 0, off ? off + ' pixels in ' + stray.size + ' colours outside the master palette' : used.size + ' colours, all in the master palette');
  add('no black', black === 0, black ? black + ' near-black pixels' : 'outline is coloured');
  if (b) {
    add('feet row', b.b === canvas.bottom, 'lowest pixel on row ' + b.b + ', wanted ' + canvas.bottom);
    const mid = (b.l + b.r + 1) / 2;
    add('centred', Math.abs(mid - canvas.w / 2) <= 1, 'middle at x ' + mid + ', canvas middle ' + canvas.w / 2);
    if (tln && brn) add('light from top left', tl / tln > br / brn, 'top-left lightness ' + (tl / tln).toFixed(2) + ', bottom-right ' + (br / brn).toFixed(2), true);
  } else add('has pixels', false, 'empty sprite');
  return { checks: out, ok: out.every(c => c.ok || c.soft), colours: used.size, pixels: n };
}

/* ------------------------------------------------------------ pixel font */
// The game's 3x5 font plus a few signs the labels need. Upper case only.
const GLYPH = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'], 'A': ['111', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
  'C': ['111', '100', '100', '100', '111'], 'D': ['110', '101', '101', '101', '110'], 'E': ['111', '100', '110', '100', '111'],
  'F': ['111', '100', '110', '100', '100'], 'G': ['111', '100', '101', '101', '111'], 'H': ['101', '101', '111', '101', '101'],
  'I': ['111', '010', '010', '010', '111'], 'J': ['001', '001', '001', '101', '111'], 'K': ['101', '101', '110', '101', '101'],
  'L': ['100', '100', '100', '100', '111'], 'M': ['101', '111', '111', '101', '101'], 'N': ['110', '101', '101', '101', '101'],
  'O': ['111', '101', '101', '101', '111'], 'P': ['111', '101', '111', '100', '100'], 'Q': ['111', '101', '101', '111', '001'],
  'R': ['110', '101', '110', '101', '101'], 'S': ['111', '100', '111', '001', '111'], 'T': ['111', '010', '010', '010', '010'],
  'U': ['101', '101', '101', '101', '111'], 'V': ['101', '101', '101', '101', '010'], 'W': ['101', '101', '111', '111', '101'],
  'X': ['101', '101', '010', '101', '101'], 'Y': ['101', '101', '010', '010', '010'], 'Z': ['111', '001', '010', '100', '111'],
  '+': ['000', '010', '111', '010', '000'], '-': ['000', '000', '111', '000', '000'], '/': ['001', '001', '010', '100', '100'],
  '%': ['101', '001', '010', '100', '101'], '?': ['111', '001', '011', '000', '010'], ':': ['0', '1', '0', '1', '0'],
  '.': ['0', '0', '0', '0', '1'], ',': ['00', '00', '00', '01', '10'], '!': ['1', '1', '1', '0', '1'],
  '#': ['101', '111', '101', '111', '101'], '(': ['01', '10', '10', '10', '01'], ')': ['10', '01', '01', '01', '10'],
  '_': ['000', '000', '000', '000', '111'], '=': ['000', '111', '000', '111', '000'], 'x': ['000', '101', '010', '101', '000'],
};
function textW(t, sc) { let w = 0; for (const ch of String(t)) { const g = GLYPH[ch] || GLYPH[ch.toUpperCase()]; w += (g ? g[0].length : 3) + 1; } return Math.max(0, w - 1) * (sc || 1); }
function text(img, x, y, t, c, sc) {
  sc = sc || 1;
  for (const ch of String(t)) {
    const g = GLYPH[ch] || GLYPH[ch.toUpperCase()];
    if (!g) { x += 4 * sc; continue; }
    for (let j = 0; j < 5; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '1') fill(img, x + i * sc, y + j * sc, sc, sc, c);
    x += (g[0].length + 1) * sc;
  }
}

/* ------------------------------------------------------------------ args */
// node tool.js a.png b.png --out x.png --flag    ->  {_: [a.png, b.png], out: 'x.png', flag: true}
function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2), v = argv[i + 1]; if (v === undefined || v.startsWith('--')) o[k] = true; else { o[k] = v; i++; } }
    else o._.push(a);
  }
  return o;
}

module.exports = { DIR, ROOT, PALETTE_FILE, blank, px, put, fill, stamp, bbox, encodePNG, decodePNG, savePNG, load,
  hex, rgb, mix, lab, dLab, dist, loadPalette, nearest, check, text, textW, args };
