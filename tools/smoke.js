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
  startWave,step,statsOf,nextCost,get PLACEMENT(){return PLACEMENT}};`;

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

  await shot('01-title');
  await page.click('#bStart');
  await page.waitForTimeout(200);

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
      await page.click('#bNext');
      await page.waitForTimeout(200);
      await page.evaluate(() => window.__buildAll());
    }
  }
  check('campaign ends on the win screen',
    await page.evaluate(() => __SS.G.phase === 'won'));
  await shot('07-won');

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
