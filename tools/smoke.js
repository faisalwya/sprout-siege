// Smoke test: loads the game in real Chromium at iPhone 15 Pro landscape,
// drives it through placement, upgrades, both forks, selling, and all
// fifteen campaign waves, and fails on any page error.
//
//   node tools/smoke.js [path/to/game.html]     (default: index.html)
//
// Screenshots land in tools/out/. The game body is an IIFE, so internals are
// reached by injecting an export object just before the closing `})();`.
// The game itself is never modified on disk.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.resolve(ROOT, process.argv[2] || 'index.html');
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const EXPORTS = `window.__SS={G,TOWERS,MAPS,FAMS,placeOK,placeGhost,doAction,
  startWave,step,statsOf,nextCost,get PLACEMENT(){return PLACEMENT},
  plaqueContent,plaqueW,PLQ_L,PLQ_R,PLQ_H,loadMap,distToPath,TRAIL_CLEAR};`;

function instrument(src) {
  const i = src.lastIndexOf('})();');
  if (i < 0) throw new Error('could not find the closing })(); to inject exports');
  return src.slice(0, i) + EXPORTS + '\n' + src.slice(i);
}

(async () => {
  const html = instrument(fs.readFileSync(FILE, 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 852, height: 393 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true,
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/game.html', r => r.fulfill({ contentType: 'text/html', body: html }));
  await page.goto('http://sprout.local/game.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.__buildAll = () => {
      const S = __SS, G = S.G, log = [];
      G.gold = 99999;
      const spots = [];
      for (let y = 10; y < 140; y += 6) for (let x = 10; x < 300; x += 6) spots.push([x, y]);
      S.FAMS.forEach((fam, k) => {
        G.placing = fam;
        const s = spots.find(([x, y]) => S.placeOK(x, y));
        if (!s) { log.push(fam + ': no legal spot'); return; }
        G.ghost = { i: -1, x: s[0], y: s[1], age: 0 };
        S.placeGhost();
        const t = G.towers[G.towers.length - 1];
        G.selected = t;
        while (t.level < 3) S.doAction({ act: 'up' });
        const keys = Object.keys(S.TOWERS[fam].forks), b = keys[k % 2];
        S.doAction({ act: k % 2 ? 'forkB' : 'forkA', branch: b });
        while (S.nextCost(t) !== null) S.doAction({ act: 'up' });
        log.push(fam + ' -> ' + t.branch + ' L' + t.level);
      });
      G.selected = null;
      return { log, towers: G.towers.length };
    };
  });

  const results = [];
  const check = (name, ok, info) => { results.push({ name, ok, info }); };
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });

  // Screen buttons are painted on the canvas (v33), so tap them like a player:
  // find the button by its action in G.btns and click its centre.
  const tapAct = async act => {
    await page.waitForTimeout(120);              // let a frame lay the buttons out
    const pt = await page.evaluate(a => {
      const b = __SS.G.btns.find(q => q.act === a);
      if (!b) return null;
      const c = document.getElementById('cv'), r = c.getBoundingClientRect();
      const OX = (c.width - 320) / 2, OY = (c.height - 144) / 2;
      return { x: r.left + (b.x + b.w / 2 + OX) / c.width * r.width,
               y: r.top + (b.y + b.h / 2 + OY) / c.height * r.height };
    }, act);
    if (!pt) return false;
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(150);
    return true;
  };
  // Nothing but the canvas may show in landscape (the portrait notice is hidden).
  const strayDom = () => page.evaluate(() =>
    [...document.body.querySelectorAll('*')].filter(e =>
      !['stage', 'cv'].includes(e.id) && e.tagName !== 'SCRIPT' &&
      e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'
    ).map(e => e.id || e.tagName));

  await shot('01-title');
  check('title screen is canvas only', (await strayDom()).length === 0, (await strayDom()).join(' '));
  check('START tap starts the game', await tapAct('sc_start') &&
    await page.evaluate(() => __SS.G.started && !__SS.G.screen));

  // Real pointer tap on the first dock card: proves hit-testing, not just logic.
  const tapped = await page.evaluate(() => {
    const c = document.getElementById('cv'), r = c.getBoundingClientRect();
    const OX = (c.width - 320) / 2, OY = (c.height - 144) / 2;
    const wx = -OX + 4 + 9, wy = 144 + OY - 3 - 27 + 9;
    return { x: r.left + (wx + OX) / c.width * r.width, y: r.top + (wy + OY) / c.height * r.height };
  });
  await page.mouse.click(tapped.x, tapped.y);
  await page.waitForTimeout(150);
  check('dock card tap arms Gnome Post',
    await page.evaluate(() => __SS.G.placing === 'gnome'));
  await page.evaluate(() => { __SS.G.placing = null; });

  // Place one of each family, upgrade to 3, fork (alternating A/B), upgrade to 5.
  const build = await page.evaluate(() => window.__buildAll());
  check('placed and forked all four families', build.towers === 4, build.log.join(', '));
  await page.waitForTimeout(300);
  await shot('02-built');

  // Select a tower so its buttons and plaque render, then sell a different one.
  await page.evaluate(() => { __SS.G.selected = __SS.G.towers[0]; });
  await page.waitForTimeout(250);
  await shot('03-selected');
  const sold = await page.evaluate(() => {
    const S = __SS, G = S.G, n = G.towers.length, before = G.gold;
    G.selected = G.towers[n - 1];
    S.doAction({ act: 'sell' });
    return { gone: G.towers.length === n - 1, refund: G.gold - before };
  });
  check('sell removes tower and refunds', sold.gone && sold.refund > 0, 'refund ' + sold.refund);

  // Campaign: run every wave headlessly. Gold and carrots are topped up so the
  // run always reaches the end; this is a crash test, not a balance test.
  // "-N" in the output is carrots lost that wave with four maxed towers.
  for (let map = 1; map <= 3; map++) {
    const r = await page.evaluate(m => {
      const S = __SS, G = S.G, waves = [];
      G.paused = false;
      for (let w = 1; w <= 5; w++) {
        if (G.phase !== 'idle') break;
        G.lives = 20; S.startWave();
        let t = 0;
        while (G.phase === 'wave' && t < 600) { S.step(1 / 60); t += 1 / 60; }
        waves.push({ w, secs: Math.round(t), lost: 20 - G.lives, phase: G.phase });
        if (G.phase === 'dead') break;
      }
      return { map: m, waves, phase: G.phase, lives: G.lives };
    }, map);
    check(`map ${map}: all five waves resolve`, r.waves.length === 5 && r.phase !== 'dead',
      r.waves.map(w => `W${w.w} ${w.secs}s -${w.lost}`).join(' '));
    await shot(`0${3 + map}-map${map}-end`);
    if (r.phase === 'rift') {
      if (map === 1) await shot('04b-map-cleared');
      const before = await page.evaluate(() => __SS.G.map);
      check(`map ${map} cleared: next-map tap loads map ${map + 1}`,
        await tapAct('sc_next') && await page.evaluate(b => __SS.G.map === b + 1 && !__SS.G.screen, before));
      await page.evaluate(() => window.__buildAll());
    }
  }
  check('campaign ends on the win screen',
    await page.evaluate(() => __SS.G.phase === 'won'));
  await shot('07-won');
  check('won screen offers endless and start over',
    await page.evaluate(() => __SS.G.screen === 'won' &&
      ['sc_endless', 'sc_again'].every(a => __SS.G.btns.some(b => b.act === a))));

  // Start over, then lose on purpose to reach the lost screen.
  await tapAct('sc_again');
  const lost = await page.evaluate(() => {
    const S = __SS, G = S.G;
    G.lives = 1; S.startWave();
    for (let t = 0; t < 600 && G.phase !== 'dead'; t += 1 / 60) S.step(1 / 60);
    return G.screen;
  });
  await page.waitForTimeout(150);
  await shot('08-lost');
  check('losing shows the lost screen', lost === 'dead', String(lost));
  check('PLANT AGAIN tap restarts on map 1', await tapAct('sc_again') &&
    await page.evaluate(() => __SS.G.map === 1 && __SS.G.lives === 20 && !__SS.G.screen));
  check('no DOM visible during play', (await strayDom()).length === 0, (await strayDom()).join(' '));

  // The info plaque is painted in a fixed band at the top (v31). Every plaque
  // the game can show must fit that band, and the band must be clear of the
  // trail on every map, with or without a top margin (OY 0 to 2).
  const plq = await page.evaluate(() => {
    const S = __SS, G = S.G, room = S.PLQ_R - S.PLQ_L, wide = [];
    const measure = label => { const c = S.plaqueContent(), w = c ? S.plaqueW(c) : 0;
      if (w > room) wide.push(label + ' ' + w); };
    G.selected = null; G.selPlot = -1;
    for (const fam of S.FAMS) {
      G.placing = fam; measure(fam + ' placing'); G.placing = null;
      const F = S.TOWERS[fam], t = { fam, level: 1, branch: null };
      G.towers.push(t); G.selected = t;
      for (let l = 1; l <= 3; l++) { t.level = l; measure(fam + ' L' + l); }
      for (const b of Object.keys(F.forks)) for (let l = 4; l <= 5; l++) {
        t.branch = b; t.level = l; measure(b + ' L' + l);
      }
      G.towers.pop(); G.selected = null;
    }
    const hits = [];
    for (let m = 1; m <= 3; m++) {
      S.loadMap(m);
      for (let oy = 0; oy <= 2; oy++)
        for (let y = -oy + 1; y < -oy + 1 + S.PLQ_H; y++)
          for (let x = S.PLQ_L; x < S.PLQ_R; x++)
            if (S.distToPath(x + .5, y + .5) < S.TRAIL_CLEAR) { hits.push('map ' + m + ' OY ' + oy); y = 1e9; break; }
    }
    return { room, wide, hits: [...new Set(hits)] };
  });
  check('every info plaque fits its band', plq.wide.length === 0,
    plq.wide.length ? plq.wide.join(', ') : 'all within ' + plq.room + 'px');
  check('plaque band is clear of the trail on all maps', plq.hits.length === 0, plq.hits.join(', '));

  // Let a few real animation frames run so draw() is exercised in every state.
  await page.waitForTimeout(400);
  check('no page errors', errors.length === 0, errors.join(' | '));

  await browser.close();
  let failed = 0;
  for (const r of results) {
    if (!r.ok) failed++;
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.info ? '   (' + r.info + ')' : ''}`);
  }
  console.log(`\n${results.length - failed}/${results.length} passed. Screenshots in tools/out/`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
