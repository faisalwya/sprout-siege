# Sprout Siege: project brief

Working document for continuing the build. Last updated with v34.2 and the
decisions of 15 and 16 Nov 2026. Read this first; it replaces re-reading
the chat.

---

## 1. What it is

A pixel-art tower defense game. Bugs march a winding trail toward the Great
Sprout, a beanstalk whose bean pods are your lives; you plant garden-themed
towers along the way to stop them.

| | |
|---|---|
| Format | One self-contained HTML file is what ships: no dependencies, no external requests. Art sources may live as PNG sheets in `assets/`, inlined by an embed script (decision 25). |
| Primary target | **Mobile, horizontal, iPhone 15 Pro.** Desktop is secondary and must stay usable. |
| Art | Retro pixel, quirky and charming, refined (v34). Drawn at 2x: 640x288 art pixels over 320x144 game units, 16-unit tiles. Code-drawn or image-model sprites, embedded in the file. |
| Current version | **v34.2** |
| Live | `faisalwya.github.io/sprout-siege/` (GitHub Pages) and `sprout-siege.netlify.app` (Netlify), both serve `main`. See section 9. |

### Campaign
Today: three maps, five waves each. Lives carry between maps, towers do not.
Gold resets per map and is re-granted as a base plus a bounty on surviving
lives, so protecting the Sprout compounds.

Direction (Faisal, 12 Nov 2026): **the garden is a year.** Each map is a
season. **1.0 is four maps, one per season** (15 Nov 2026, decision 23):
today map 1 is spring, 2 summer, 3 autumn, and winter gets the fourth. More
maps per season (2 to 3 each, or 12, one per month) and the theme switch
(space and beyond) come after 1.0. Map 1 is finished first, as a vertical
slice, before maps 2 to 4 (see the roadmap).

The story is a half-page note written after the map 1 slice has been
played, not a pillar and not a version (decision 22).

### Target feel
Pleasing to look at and cozy, but challenging and fun to play. Leveling a
tower must feel rewarding and look different at every one of its stages.

### Towers
Four families. Each levels 1 to 3, then **forks permanently** into one of two
specialisations at level 3, reaching level 5.

**The characters below are placeholders** (16 Nov 2026, decision 26). The
four jobs, the costs and the forks stand; who does each job is being
explored. Names and looks in this table describe today's build only.

| Family | Cost | Role | Forks |
|---|---|---|---|
| Gnome Post | 45 | Workhorse single target | Deadeye (sniper) / Rascal (fast, short) |
| Sprinkler | 70 | Splash plus slow | Geyser (heavy splash) / Frostmist (deep slow) |
| Zap Lamp | 95 | Chain lightning | Storm Lamp (more chains) / Jolt Post (single-target stun) |
| Beehive | 85 | Swarm | Wasp Nest (fast single target) / Pollen Bloom (damage aura) |

### Lives
20 lives, shown as 10 bean pods hanging on the Great Sprout (v34), a
beanstalk about 25% taller than a tower that stands where each map's bed
used to be. Each pod takes two bites: whole, half eaten, gone. Bugs still
eat **nearest the trail's end first** (gate-first, `sortCarrots`), so the
damage climbs the stalk from where they arrive. The trail opens into a worn
clearing around the Sprout's base. The HUD counter is a small Sprout icon.
All three maps use wide (`'h'`) beds, so all show the Sprout; an upright
(`'v'`) bed would still draw the old carrots (`heartOn()`).

---

## 2. Version map

Every version is kept as a numbered file so any of them can be reverted to.
This is a standing requirement, not a one-off.

| Version | Milestone |
|---|---|
| v1 | First playable. Single map. |
| v2 | Confirm-before-place preview. Catmull-Rom spline trail with perpendicular meander. Text scaling fix. |
| **v3** | First Netlify deploy. Netlify now auto-deploys `main` alongside GitHub Pages. |
| v4 | Scaling pass. Initially a regression: scale was capped at 4x and framed, losing 13%. Fixed by raising the cap to 8 and tightening snap tolerance to 95%. |
| v6 | Wave button folded into the top-right play/pause control. Static size, green, labelled GO. |
| v8 | Campaign: three maps, map-to-map transition. |
| v11 | Economy: heart bonus per map plus a conservative refund on the previous map's towers, to make map 3 clearable. |
| v12 | In-canvas selector. Tick/cross flanking the plot. Fork buttons. Shipped with a crash, fixed same day. |
| v17 | DOM dock removed; dock drawn in-canvas. |
| v19 | Spiral vine selector. |
| v20 | Carrot patch as lives. |
| v21 | HUD ribbon drawn in-canvas. All UI now lives on the canvas; no DOM over the playfield. |
| v23 | Authored sparse plots, 16 per map, with clearable stumps. |
| v24 to v26 | Plot sizing and tower centring, iterated. |
| **v27** | Wide bed (18x10). Single source of truth for plot geometry. Vines retired. Stump redrawn. |
| v28 | Open placement behind a flag. No-build shade mask. |
| v29 | Shade mask removed. The bed rectangle is gone: towers stand on an irregular patch of turned earth in the map's own trail colours. Placement mark is the ground being dug. |
| v30 | Cleanup. Dead CSS and JS removed, title copy rewritten for open placement, em dashes gone, HUD shows map and wave with flag and wave icons instead of the unreadable 3px M and W. |
| v30.1 | Trail drawn to the canvas edge and clipped at the carrot bed, bugs fade at the path ends, so wide screens (Safari with toolbars) look right. No gameplay change. |
| v30.2 | Wide screens (Safari with toolbars, wide desktop windows) get plain side bars instead of extra garden, so the layout matches the home-screen app. |
| **v34.2** | Placement snap: a tap that misses legal ground by up to 10 units (about a fingertip) arms the nearest legal spot instead of "No room there"; the middle of the trail still refuses. The upgrade plaque shows what the next level adds, as a green "+n" after each number and effect; level 5 says MAX. The plaque no longer writes the level, which the pips show. |
| **v34.1** | Stale copy from before the Sprout replaced: no more plots, carrots, patches or "pack up the kit" on the map-cleared, won and lost screens. Map 1 is The Spiral Lawn (was The Carrot Patch); maps are counted as seasons ("All 3 seasons held"). Copy only, same rules. |
| **v34** | Look pass, iterated in 19 in-game previews (`versions/sprout-siege-v34-p1.html` to `p19`). Art at 2x (640x288). Native 2x ground painter: calm grass patches, trail with a scalloped grass lip, groves framing the map, props. One season per map (spring, summer, autumn). World kept at P7's size, towers 10% smaller, standing in grass with no soil patch. Level 1 towers redrawn as a canvas reference (36x48). The carrot bed becomes the Great Sprout, a beanstalk with 10 bean pods as lives, the trail opening into a clearing round it. Same rules, same balance. |
| **v33.2** | No drop shadow under plates (buttons, panels, price chips): on grass it read as a murky green band. |
| **v33.1** | Still 20 lives, drawn as 10 carrots of 2 bites each (Faisal's call): a bite leaves a half-eaten carrot, beds are half the size (wide 58x27, upright 28x60), freeing ground for towers. Top bar and screens count lives. |
| **v33** | Title, map-cleared, won and lost screens painted on the canvas in the pixel font, on a wooden plate, with canvas buttons. The page is now only the canvas (plus the portrait notice). The version label is `const VERSION`, drawn on the title. |
| **v32** | New maps, picked by Faisal from nine rendered mocks: 1 is a spiral into a bed in the middle, 2 is three long hedge rows from the bottom-right to a bed top-left, 3 is a figure eight that crosses itself, bed top-left. The bed's place comes from map data and is fenced, with a gate where the trail enters. |
| **v31** | The last DOM in play is gone: toast and info plaque are painted on the canvas, in a band at the top that is clear of the trail on all three maps. Full A to Z pixel font. Upgrade is an arrow; sell is the top bar's gold coin (Faisal's call over a coin with a plus, which read as obscure), refunds green. |

---

## 3. Settled decisions

Three groups since the 15 Nov 2026 critique:

- **1 to 14: settled.** Do not re-open these without a reason. Each cost at
  least one version to reach.
- **15 to 21: taste calls.** These are how v34 looks, decided by eye. Faisal
  can reopen any of them at any time, with no new reason needed, and the
  sprite pilot is expected to test some (the tower canvas in 20 above all).
  Build on them, but do not build anything that only works if they never
  change.
- **22 to 26: plan decisions** from the critique and the 16 Nov pulse
  check. Faisal's calls on how the project is organised.

### Settled (1 to 14)

1. **All UI is painted on the canvas.** No DOM elements over the playfield.
   Native `<button>` rendering, focus rings and canvas filters put a faint box
   around every dock card that no amount of CSS removed. Drawing solved it.
2. **Confirm before placing.** Tap to arm a spot, then tick to commit or cross
   to put it away. You see the range ring before spending. Since v34.2 a tap
   that misses legal ground by a little arms the nearest legal spot
   (`SNAP_REACH`, `nearestSpot()`), so near misses are not refused.
3. **Tick and cross flank the placement**, laid out by a collision resolver
   that tries the preferred side then the others, rejecting anything off-frame
   or overlapping.
4. **Towers level 1 to 3, fork, then 4 to 5.** The fork is permanent.
5. **The Great Sprout's pods are lives** (v34, Faisal's call, replacing
   the carrots of v20 to v33.2), eaten gate-first, **two lives per pod**
   (v33.1: 20 of anything made the bed too big). There are 20 lives
   (`MAX_LIVES`) and every number the player reads counts them: HUD,
   screens, the red "-N". Only the Sprout shows them in halves (`BITES`):
   10 pods, whole, half eaten, gone. Counting pods in the HUD was tried
   (as carrots, v33.1) and dropped: Faisal wants the total to read 20.
   The Sprout is about 25% taller than a tower, with a compact base that
   blends into the grass (no dirt patch) and the trail opening into a worn
   clearing around it (P19).
6. **Scaling: fill, do not letterbox.** Integer-snap only when it costs under
   5% of size, otherwise fill and accept uneven pixels. An adaptive margin
   (`ARTW/ARTH/OX/OY`) extends the world into taller-than-game screens
   instead of adding bars. **Wider-than-game screens get plain bars at the
   sides** (`MAX_PAD_X=0`, since v30.2, Faisal's call): in iPhone Safari the
   toolbars make the screen wider than the game, and side margin moved the
   trail and patch away from where the home-screen app puts them. The game
   is height-limited there either way, so bars cost no size.
7. **Garden theme first, as a year of seasons** (12 Nov 2026). The theme
   switch (space and beyond) is still wanted, after the garden year, built
   as a swappable `THEME` object, not a fork. Season palettes (`P5_PAL`)
   are the first step towards it.
8. **Every version kept as a numbered file.**
9. **No em dashes** in written output.
10. **HUD map and wave use icons, not letters.** A 3px-wide M and W both read
    as H at phone size, and 5px-wide versions blur under the drop shadow
    (rendered and compared in v30). Map is a flag then the number, wave is a
    small wave then `1/5`.
11. **Info plaque and toast live in the top band** (v31), centred between
    the read-outs and the buttons (`PLQ_L=146`, `PLQ_R=266`, 18px tall). It
    is the only spot clear of the trail on all three maps at every screen
    shape, measured and checked by the smoke test. Nothing can be built under
    it. A toast takes the plaque's spot for 1.1s.
12. **Plaques are two lines, no tower picture.** Three lines fit nowhere on
    map 3. Line one is the name plus effects (chain, stun, splash, slow),
    line two the cost (when placing) plus the numbers. Since v34.2 a
    selected tower's numbers and effects carry a green "+n" for what the
    next level adds, and level 5 says MAX; the level itself is left to the
    pips under the tower, because the band has no room for both. Fork plaques are one line
    per path, on the side of its button, with a short role (`desc`) instead
    of the old flavour line.
13. **Each map is its own shape** (v32). No more shared left-to-right
    zigzag into a bed at the right edge. A map sets `wp` (tile waypoints)
    and `bed` (`{x,y,o}`, top-left in px, `o` 'v' upright 4x5 or 'h' wide
    5x4). The trail ends inside the bed; the fence gate is where it crosses
    in. Mocks and the options not picked are in `labs/v32-maps/`.
14. **Screens are painted too** (v33). Title, map cleared, won and lost dim
    the field and draw a plate with a 3x heading, a line under it, wrapped
    body text and plate buttons. While `G.screen` is set its buttons are the
    only ones `G.btns` holds, so nothing behind can be tapped. Body text is
    wrapped to even lines (`wrapEven`); a ` \n ` word forces a break.
### Taste calls Faisal can reopen (15 to 21)

15. **Art at 2x** (v34). 640x288 art pixels over unchanged 320x144 game
    units. Chosen over refining at 1x for the depth of detail the
    references have; gameplay, timings and tap mapping are untouched.
16. **The look is the cozy farm reference (A)**, with The Messenger and
    Eastward as references for feel, depth of detail and character, applied
    to the map and the towers. No separate "B layer" or toggles.
    Reference board: private artifact from the v34 session.
17. **One season per map.** Map 1 spring, 2 summer, 3 autumn. Each season
    sets grass, trail, hedges, tree species, flowers and the Sprout's
    colours. Winter has a palette but no map yet.
18. **Art can come from code or image models** (15 Nov 2026, replacing
    the 12 Nov "code only" line). The goal is pixel sprites with charm and
    quirk that fit their world. Faisal will explore ChatGPT's image model
    for characters and animated sprites (GIFs) first, starting with towers,
    the Sprout and map assets such as trees; code-drawn art (Claude or
    ChatGPT) is equally fine. Imported art is cleaned to the 2x grid and
    palette and embedded in the file; animations become frame strips.
    Hand-drawn art is the ideal but a late nice-to-have, for touch-ups.
    Whatever the source, it follows the art rules below (one light from the
    top left, hue-shifted ramps, coloured outlines). The pipeline is framed
    in `docs/sprite-framework.md` and proved by the Gnome pilot: see open
    item 4.
19. **Towers stand in the grass.** A built tower draws a few tufts and a
    pebble at its feet (`footing()`), no soil. Soil only shows as feedback:
    hover, armed, blocked, selected.
20. **Proportions** (P9 and P10): the world at P7's size, towers 10%
    smaller than v33. A level 1 tower's canvas is 36x48 art pixels, feet on
    row 39, drawn about 24 to 34 wide and 30 to 37 tall. A pod is 5x8.
    (Measured for the sprite tools: the art's lowest pixels, the rounded
    base under the feet, are on row 41, row 42 for the Zap Lamp.)
21. **Calm ground.** Grass patches sparse and soft, groves framing the edges
    with a back row, props kept off the trail, plots, the Sprout, the HUD
    and the dock.

### Plan decisions from the 15 and 16 Nov 2026 sessions (22 to 26)

22. **Four pillars: Look, Play, Feel, Tech.** Not the eight proposed after
    v34. Each pillar holds one open question and a version must answer one
    (the questions live in the roadmap). Story is a half-page note written
    after the map 1 slice, not a pillar or a version.
23. **1.0 is four maps, one per season.** Winter gets its map. The longer
    garden year (several maps per season) is after 1.0.
24. **Art queues like everything else.** There are no parallel art tracks:
    anything that touches `index.html` waits for the change in flight.
    Order: copy fixes, sprite pilot (Gnome family, 7 stages), map 1 as a
    vertical slice (all towers, bugs, the Sprout final), save and install,
    balance, maps 2 to 4.
25. **Art lives as PNG sheets in `assets/`, inlined by an embed script.**
    A small script writes the sheets into `index.html` as data URIs. The
    shipped game stays one self-contained file with no external requests;
    the old "no build step" rule bends to that one command. Option A of the
    sprite framework, chosen over converting everything to char-rows (the
    file would roughly triple and the source images would have no home).

26. **The tower characters are open; the four jobs are fixed** (16 Nov
    2026). The jobs are workhorse (steady single shots), soaker (splash and
    slow), chainer (hits one bug and jumps to its neighbours) and swarm
    (fast homing hits), each leveling 1 to 3 and forking to 5. Gnome Post,
    Sprinkler, Zap Lamp and Beehive are placeholders that happen to fill
    them. What each tower is gets settled by Faisal in an external ChatGPT
    session from `docs/tower-session-kit.md`, level 1 first, then tried in
    the game on the phone before any tower is drawn at all 7 stages. One
    palette for every tower, judged on spring ground; season variations
    are a later pass. A design that needs a different power comes back to a
    Code session first.

---

## 4. Rejected, and why

Keeping these on record so they do not get re-proposed.

| Rejected | Reason |
|---|---|
| **Vine / spiral selector** (v19 to v27) | Arms sprouted from the plot centre, which is exactly where the tower stands, so they only ever showed as stubs poking out from behind it. Three rescue attempts failed: corner-anchored arms read as spider legs, a rooted trellis pair read as handles, shortening them read as debris. |
| **Square plot bed** | Tower art is 13px tall but 9 to 11px wide. A square large enough to seat a tower vertically is too wide horizontally; one narrow enough to look right disappears under the sprite. |
| **Showing every legal grid cell** | 74 of roughly 74 cells were legal, which is 10x more options than the 6 to 9 towers a run affords. It read as a grid, not as choices. |
| **Plots lighting up when a tower is armed** | Called out as ugly. |
| **16 visible authored beds on the lawn** | Sixteen identical rectangles with no relationship to the terrain. Reads as a timber yard, not a garden. |
| **Shade-out mask over no-build ground** (v28) | Rejected on sight. |
| **Rectangular bed drawn under the tower** | Rejected on sight. Soil should read as ground, not as an object. |
| **Soil in colours of its own** | A patch in its own browns reads as an object dropped on the lawn, whatever its shape. Deriving it from the map's trail palette is what finally made it read as the same earth, turned over. |
| **Drawing a rim per disc** | Puts rim pixels through the patch interior wherever a later disc overlaps an earlier one. The patch read as a handful of dark rocks. The outline has to be grown once around the finished union. |
| **Ground shadow under towers** | Read as extra bed edge and made towers look like they were floating. |
| **Drop shadow under plates** (removed v33.2) | A 2px strip of translucent black under every button and panel read as a murky green band on grass, not a shadow. The plate's light rim lifts it enough. |
| **Plaque at the bottom, beside the dock** (v31 mock B) | Covers the trail's bottom loop on maps 1 and 3 and grazes it on map 2. Comparison in `labs/v31-plaque/`. |
| **Three-line plaque, or a tower picture in it** (v31) | No three-line spot is clear of the trail on map 3. With a picture, the Sprinkler's stats ran to 168px of a 120px band. |
| **Refining at 1x** (v34 mock B) | Picked first, then dropped: at 320x144 there is no room for the detail and character of the references. 2x costs nothing in gameplay. |
| **Redrawing everything procedurally at 2x** (v34 mock C) | "The artwork looked off": generic shapes lost the charm of the old sprites. 2x came back through a native ground painter and hand-tuned code sprites instead. |
| **A bigger world around the towers** (v34 P8) | Proportions still felt off, partly because the trees looked underbaked. Back to P7's size with towers 10% smaller. |
| **Soil patch under every built tower** (v34 P9 to P11) | Even narrowed, it read as generic and drew the eye. Towers stand in grass; soil is feedback only. |
| **The carrot bed** (v20 to v33.2) | Faisal wanted something more unique and special. Replaced by the Great Sprout. |
| **The big leafy Sprout** (v34 P13) | Shape, size and style felt off. |
| **The Sprout on a round dirt patch** (v34 P14 to P15) | The patch read as generic, like the tower soil. The base now merges into the grass. |
| **Trail narrowing into the Sprout** (v34 P18) | Faisal preferred P17's width; P19 keeps it and opens a clearing instead. |

---

## 5. Where it stands, and what is open

### Current placement model (v28)
`const PLACEMENT = 'open' | 'plots'` near the top of the plot-geometry block.

- **`'open'` (current default).** Build anywhere off the trail. No plot exists
  until a tower stands in it. The authored arrays stay in `MAPS` unused, so
  switching back is one word.
- **`'plots'`.** The authored 16 beds per map, visible from the start,
  including clearable stumps.

### Known cost of open placement
Measured with a greedy five-tower solver:

| | Trail covered | Gun-length | Longest unguarded run |
|---|---|---|---|
| Open | 90 to 93% | ~1080 | 54 to 80px |
| Authored plots | 77 to 85% | ~890 | 116 to 158px |

Open placement is worth roughly 25% more effective firepower and cuts the
unguarded stretch by about two thirds. **The maps are now easier than they were
tuned to be, map 3 most of all.** Cheapest levers when it needs fixing: enemy
HP on maps 2 and 3, or starting gold. Not yet re-tuned, deliberately, so it
can be felt in play first.

### Open items
1. **Balance re-tune** after the placement model settles. This is the live one.
2. ~~Deploy.~~ Done: GitHub Pages serves `main`. See section 9.
3. **Theme swap** to space, as a `THEME` object. The soil palette already
   derives from the map palette, so it will follow automatically.
4. **Sprite pipeline** (framed 15 Nov 2026, not yet proved). The
   framework is `docs/sprite-framework.md`: a pilot on the Gnome family, 7
   stages, through cleanup, contact sheet and an in-game preview, with a
   fallback of redrawing in code. Settled so far: storage is PNG sheets
   plus the embed script (decision 25). The cleanup and contact sheet
   tools exist (`tools/sprite/`, roadmap C2). **Changed 16 Nov** (decision
   26): the pilot is no longer the Gnome. Faisal first explores who the
   four towers are, from `docs/tower-session-kit.md`; the picks are tried
   in the game (roadmap v35), and only then drawn at 7 stages. The master
   palette taken from the v34 towers (73 colours) is provisional: the real
   one is locked from the picked designs. Still open, settled when the
   full stages start: whether forks get a taller canvas than 36x48 and
   which stages get idle motion. Plumbing (roadmap C4) waits for the
   picks. Art queues with everything else (decision 24).
5. **Plot count**, if `'plots'` mode returns. The authored `plots` arrays
   were made for the v31 maps and do not fit the v32 trails; redo them first. 16 per map reads busy; 12 would
   breathe better, but changes solvability and needs the coverage model rerun.
6. **Placement mark depth.** What exists is deliberately minimal: the patch
   grows, six clods of dirt fly, a gold rim marks the spot. Built to be
   refined, not to be final.
7. **Bug outlines** (v34). `BUG_OUTLINE=true` outlines bugs to match the
   towers. They were unoutlined to read small and quick; re-test in play.
8. **Tap target** (v34). The smaller footprint (15x13 units) is about 41x35
   points on the iPhone, under the 44 point guideline. Fix with a padded
   hit area, not a bigger footprint. Not placed in the roadmap order yet.
   This is about selecting a built tower; placing is forgiving since the
   v34.2 snap.
9. **Winter.** A palette exists (`WINTER_PAL`) but no map. 1.0 has a
   winter map (decision 23); it is built with maps 2 to 4.
10. **Grub contrast** on late summer and autumn grass is weak. Fix with the
    bugs in the map 1 slice.
11. ~~Stale copy.~~ Done in v34.1.

---

## 6. Technical notes

### Geometry, one source of truth
Added in v27 after three versions of the bed, the sprite, the selector and the
tap target drifting apart. Everything on a plot derives from these:

```
BED_W=15, BED_H=13     logical footprint (v33: 20x14)
BED_L=-7,  BED_T=-4    relative to the anchor
BED_R=+7,  BED_B=+8    derived from the above
TOWER_DY=-2            sprite centre, so the feet land on the ground
PIP_Y=6                level pips sit in front of the feet (v33: 7)
SOIL_SX=0.6, SOIL_SY=0.9, SOIL_SR=0.85   feedback soil scaled to match
```

As of v29 these are **purely logical**: nothing is drawn as a rectangle. They
drive spacing between plots, the tap target and the button keep-out box. Keep
the invariant. If the drawn footing or feedback soil changes size, change
these with it.

### The soil (v29)
A patch is the union of eleven small overlapping discs along a shallow line,
with a bite out of the top and the bottom so the silhouette never closes into
a neat oval. Three things make it work, each learned the hard way:

1. **Seeded from its own position.** Identical every frame, so nothing
   shimmers; different at every spot, so nothing looks stamped.
2. **One outline grown around the finished union**, in a small cached canvas.
   Drawing a rim per disc puts rim pixels through the interior.
3. **Coloured from the map's trail palette**, slightly darkened. Earth, turned
   over, not an object in colours of its own.

Cached per position, palette and growth step, so settled plots cost one
`drawImage` and only the animating patch re-renders.

### The 2x engine (v34)
- `ART_RES=2`: the canvas backing is twice the art size and `draw()` sets
  `ctx.setTransform(ART_RES,...)`, so all game code keeps using 320x144
  units.
- Sprite canvases carry `_s` (their pixel scale). The `drawImage` wrapper
  draws a tagged canvas at game size when called with only a position;
  `gw(img)` and `gh(img)` give a sprite's size in game units. Old 1x sprites are upscaled with
  Scale2x (`scale2x()`) plus `glint()` highlights; native 2x sprites
  (`mkSpriteP`) are drawn at 2x directly.
- The smoke test reads `ART_RES` and divides the canvas size by it before
  tapping.

### The ground painter (v34)
`paintBG(pal)` paints each map once into a 2x canvas (`BGX`), from the
season palette in `P5_PAL`:
- grass: a flat base with sparse value-noise patches;
- trail: a distance field with a scalloped grass lip, extended into a worn
  clearing round the Sprout;
- props: groves (front and back rows framing the edges), species per season,
  tall grass, flowers, rocks, mushrooms and a few objects (watering can,
  birdhouse, signpost), placed by `free()` rules that keep them off the
  trail, the plots, the Sprout, the HUD and the dock;
- `lp()` drops any pixel past the canvas edge (wrapping put a tree on the
  wrong side in P7).

### Code-drawn art rules (v34)
All art follows the same rules, so pieces match whatever made them:
one light from the top left, shapes shaded as spheres, cylinders and cones;
5-step ramps that shift hue (shadows towards blue-violet, highlights towards
warm yellow); coloured selective outlines towards a dark ink (`INK`), not
black. Mock renderers and reference sheets are in `labs/v34-towers/` and
`labs/v34-sprout/`.

### Other load-bearing details
- **Sprites** are char-row strings run through `mkSprite()`, which keeps
  `_rows` so a sprite can be re-derived with a 1px contour via `mkOutlined()`.
  Old sprites share the `PAL` map; v34 level 1 towers carry their own
  palette (`mkSpriteP(rows, pal)`).
- **Hit flash** uses pre-rendered white silhouette canvases. Do not use
  `globalCompositeOperation='source-atop'`; over an opaque background it tints
  a square.
- **Path** is a centripetal Catmull-Rom spline with a perpendicular meander,
  with a binary-search `posAt(d)` over cumulative arc length.
- **Text** is a 3x5 `GLYPH` table: digits, A to Z, `+ - / % ? : . , !`.
  `drawText` upper-cases its input and punctuation is narrower than letters,
  so measure with `textW()`, never `length*4`. Any other character draws as
  a blank: add it first. A missing G and O shipped a blank GO button in v22.
- **Buttons** are hit-tested from `G.btns` via `hitBtn()` with 3px padding, and
  drawn last so nothing covers them.
- **Foliage colours** must not match the grass. Grass is per season
  (`P5_PAL[..].g1`); reusing it for leaves made them invisible in v15.
- **Price tags** use the same `plate()` skin as buttons. A translucent fill let
  the trail show through.

### Verification harness
Built after v12 shipped a crash that static syntax checking missed. **Use it
before shipping any version.**

| File | Purpose | Status |
|---|---|---|
| `tools/smoke.js` | Drives the real game in Chromium at 852x393 DSF 3: real pointer taps on the canvas for every screen button (title, map cleared, won, lost) and the dock, checks no DOM shows in landscape (v33), builds and forks all four families, sells, plays all 15 waves to the win screen, checks every info plaque fits its band and the band is clear of the trail (v31), fails on any page error, screenshots each stage to `tools/out/`. Run with `npm test`. | Live since setup (25 Oct) |
| `tools/sprite/` | Sprite pass tools, no game file involved: `clean.js` turns an image-model picture into a sprite on the grid and palette, `sheet.js` makes the contact sheet (four season grounds at phone size, enlarged, silhouettes), `palette.js` extracts the master palette and reference towers from the frozen v34 file, `test.js` proves them on wrecked copies of the v34 towers. Run the test with `npm run sprite:test`. See `tools/sprite/README.md`. | Live since 16 Nov |
| `tools/sim.js` | Balance simulator: fixed gold budget, greedy placement, lives lost per wave. | Planned, roadmap "Armor and balance" |
| geometry and coverage checks | The old `geom.js` and `cover.js` (plot clearance, greedy coverage solver). | Lost with the chat sessions; rebuild inside `sim.js` if needed |

The old `shim.js`, `run.js` and `shot28.js` were lost with the chat sessions
that made them. `smoke.js` replaces all three.

The game body is wrapped in an IIFE, so the harness injects an export object
just before the closing `})();` to reach internals. The game file on disk is
never modified.

Chromium and Playwright are pre-installed in Claude Code cloud sessions. On a
Mac, run `npm install` and `npx playwright install chromium` once.

---

## 7. Lessons that cost a version each

- **A crash can hide behind valid syntax.** v12 shipped with a deleted `let`
  declaration; `syncUI()` threw on every call and the game broke on the first
  kill. Run the headless harness.
- **Removing a DOM element removes its listeners too.** v17 deleted the dock
  and took four functions with it.
- **Check the glyph table before using a character.**
- **Guard clauses order matters.** The v23 clear action sat below a guard that
  returned early for anything without a selected tower, so it never fired.
- **Render before judging.** Three of the placement iterations were settled by
  rendering mockups and looking, not by reasoning about pixel coordinates.
- **Mocks are not the game** (v34). Static mocks of a look were judged
  wrong twice; building it into the real game as numbered previews and
  playing them settled it. Iterate looks in-game.
- **Proportions are relative.** Towers looked too big because the trees were
  underbaked, not only because of their size. Change one thing at a time
  and compare against the previous preview.

---

## 8. Working preferences

- Keep every prior version as a numbered reference file.
- No em dashes.
- High-density structured output.
- Mockups and rendered comparisons before committing to a visual direction;
  for the overall look, numbered in-game previews.
- Review the four pillars (roadmap) before starting a version: name the
  pillar and the open question the version answers, so work stays in order
  and nothing drifts.

---

## 9. Deployment

- **Live, two places, both from `main`:**
  - https://faisalwya.github.io/sprout-siege/ via GitHub Pages.
  - https://sprout-siege.netlify.app via Netlify, linked to the GitHub repo
    on 31 Oct 2026 (no build command, publish directory `.`).
  **Merging a pull request is the deploy**: both sites update a minute or
  two later. Everything in the repo is published, so `versions/` and
  `labs/` pages are reachable on both.
- **Preview before merging:** Pages only shows `main`, so each pull request
  gets a private Claude artifact of its `index.html` for phone testing.
- **Rollback:** copy the previous `versions/sprout-siege-vN.html` over
  `index.html` and merge that.
- Netlify also builds a preview for each pull request. Previews sit behind
  the Netlify team login (production does not), so they only open for
  Faisal when signed in to Netlify; the Claude artifact stays the default.
- Cloud sessions cannot open `github.io` or `netlify.app` (egress 403), so
  the live sites can only be checked from a phone or computer. The Netlify
  connector can still read deploy status (which commit is live, ready or
  failed).

---

## 10. Where everything lives

Since 25 Oct 2026 the project is a GitHub repo, `faisalwya/sprout-siege`,
and `main` on GitHub is the source of truth. See `README.md` for which file
decides what, `WORKFLOW.md` for syncing, `ROADMAP.md` for what's next,
`docs/roadmap-history.md` for the shipped roadmap sections,
`docs/tower-session-kit.md` for the one page Faisal takes to the tower
design session, and `docs/sprite-framework.md` for the sprite pipeline.
Versions v1 to v3 and v6 were never recovered; everything from v4 on is in
`versions/` and in the git history.
