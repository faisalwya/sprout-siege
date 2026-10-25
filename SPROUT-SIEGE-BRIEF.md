# Sprout Siege: project brief

Working document for continuing the build. Last updated with v30. Read this
first; it replaces re-reading the chat.

---

## 1. What it is

A pixel-art tower defense game. Bugs march a winding trail toward a carrot
patch; you plant garden-themed towers along the way to stop them.

| | |
|---|---|
| Format | One self-contained HTML file. No build step, no dependencies. |
| Primary target | **Mobile, horizontal, iPhone 15 Pro.** Desktop is secondary and must stay usable. |
| Art | Retro pixel, quirky and charming. 320x144 art canvas, 16px tile, integer-scaled. |
| Current version | **v30** |
| Live | `faisalwya.github.io/sprout-siege/` (GitHub Pages, serves `main`). See section 9. |

### Campaign
Three maps, five waves each. Lives carry between maps, towers do not. Gold
resets per map and is re-granted as a base plus a bounty on surviving lives,
so protecting carrots compounds.

### Towers
Four families. Each levels 1 to 3, then **forks permanently** into one of two
specialisations at level 3, reaching level 5.

| Family | Cost | Role | Forks |
|---|---|---|---|
| Gnome Post | 45 | Workhorse single target | Deadeye (sniper) / Rascal (fast, short) |
| Sprinkler | 70 | Splash plus slow | Geyser (heavy splash) / Frostmist (deep slow) |
| Zap Lamp | 95 | Chain lightning | Storm Lamp (more chains) / Jolt Post (single-target stun) |
| Beehive | 85 | Swarm | Wasp Nest (fast single target) / Pollen Bloom (damage aura) |

### Lives
20 carrots in a patch on the right edge. Each life lost eats one carrot,
**nearest the gate first**, so damage visibly advances inward from the breach.
The HUD counter is a carrot icon, not a heart.

---

## 2. Version map

Every version is kept as a numbered file so any of them can be reverted to.
This is a standing requirement, not a one-off.

| Version | Milestone |
|---|---|
| v1 | First playable. Single map. |
| v2 | Confirm-before-place preview. Catmull-Rom spline trail with perpendicular meander. Text scaling fix. |
| **v3** | Deployed to Netlify. That site is retired; GitHub Pages replaced it. |
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
| **v30** | Cleanup. Dead CSS and JS removed, title copy rewritten for open placement, em dashes gone, HUD shows map and wave with flag and wave icons instead of the unreadable 3px M and W. |

---

## 3. Settled decisions

Do not re-open these without a reason. Each cost at least one version to reach.

1. **All UI is painted on the canvas.** No DOM elements over the playfield.
   Native `<button>` rendering, focus rings and canvas filters put a faint box
   around every dock card that no amount of CSS removed. Drawing solved it.
2. **Confirm before placing.** Tap to arm a spot, then tick to commit or cross
   to put it away. You see the range ring before spending.
3. **Tick and cross flank the placement**, laid out by a collision resolver
   that tries the preferred side then the others, rejecting anything off-frame
   or overlapping.
4. **Towers level 1 to 3, fork, then 4 to 5.** The fork is permanent.
5. **Carrots are lives**, eaten gate-first. Numbers stay in the HUD alongside.
6. **Scaling: fill, do not letterbox.** Integer-snap only when it costs under
   5% of size, otherwise fill and accept uneven pixels. An adaptive margin
   (`ARTW/ARTH/OX/OY`) extends the world into non-matching aspect ratios
   instead of adding bars.
7. **Garden theme for now.** A space theme stays on the table and should be
   built as a swappable `THEME` object when it happens, not a fork.
8. **Every version kept as a numbered file.**
9. **No em dashes** in written output.
10. **HUD map and wave use icons, not letters.** A 3px-wide M and W both read
    as H at phone size, and 5px-wide versions blur under the drop shadow
    (rendered and compared in v30). Map is a flag then the number, wave is a
    small wave then `1/5`.

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
4. **Hand-drawn sprite pipeline.** Intent is to draw sprites externally and
   bring them in. Art integration work should wait for this.
5. **Plot count**, if `'plots'` mode returns. 16 per map reads busy; 12 would
   breathe better, but changes solvability and needs the coverage model rerun.
6. **Placement mark depth.** What exists is deliberately minimal: the patch
   grows, six clods of dirt fly, a gold rim marks the spot. Built to be
   refined, not to be final.

---

## 6. Technical notes

### Geometry, one source of truth
Added in v27 after three versions of the bed, the sprite, the selector and the
tap target drifting apart. Everything on a plot derives from these:

```
BED_W=20, BED_H=14     logical footprint
BED_L=-10, BED_T=-4    relative to the anchor
BED_R=+9,  BED_B=+9    four rows of soil in front of the feet
TOWER_DY=-2            sprite centre, so the feet land on the soil
PIP_Y=7                level pips sit on the apron, clear of the feet
```

As of v29 these are **purely logical**: nothing is drawn as a rectangle. They
drive spacing between plots, the tap target and the button keep-out box. Keep
the invariant. If the drawn patch changes size, change these with it.

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

### Other load-bearing details
- **Sprites** are char-row strings run through `mkSprite()`, which keeps
  `_rows` so a sprite can be re-derived with a 1px contour via `mkOutlined()`.
  Palette is a single shared `PAL` map.
- **Hit flash** uses pre-rendered white silhouette canvases. Do not use
  `globalCompositeOperation='source-atop'`; over an opaque background it tints
  a square.
- **Path** is a centripetal Catmull-Rom spline with a perpendicular meander,
  with a binary-search `posAt(d)` over cumulative arc length.
- **Text** is a 3x5 `GLYPH` table. **Add characters before using them.** A
  missing G and O shipped a blank GO button in v22.
- **Buttons** are hit-tested from `G.btns` via `hitBtn()` with 3px padding, and
  drawn last so nothing covers them.
- **Foliage colours** must not match the grass. `#6cc16b` is the grass colour;
  using it for leaves made them invisible in v15.
- **Price tags** use the same `plate()` skin as buttons. A translucent fill let
  the trail show through.

### Verification harness
Built after v12 shipped a crash that static syntax checking missed. **Use it
before shipping any version.**

| File | Purpose |
|---|---|
| `shim.js` | DOM and canvas stub. Lets the game be `eval`'d and driven in Node, catching runtime errors like deleted declarations and undefined helpers. |
| `run.js` | Loads under the shim, starts, places towers, upgrades, forks, sells, clears stumps, runs waves, checks hit-testing. |
| `shot28.js` | Drives the real game in Chromium at 852x393 DSF 3 via real pointer events and screenshots each state. |
| `geom.js` | Measures plot clearance: bed-to-trail gaps, bed overlaps, off-frame plots, per-plot trail coverage. |
| `cover.js` | Greedy N-tower coverage solver. Compares placement modes. |

The game body is wrapped in an IIFE, so the harness injects an export object
just before the closing `})();` to reach internals.

Chromium and Playwright are pre-installed in the session container; no install
step is needed.

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

---

## 8. Working preferences

- Keep every prior version as a numbered reference file.
- No em dashes.
- High-density structured output.
- Mockups and rendered comparisons before committing to a visual direction.

---

## 9. Deployment

- **Live:** https://faisalwya.github.io/sprout-siege/ via GitHub Pages,
  publishing `index.html` from `main`. **Merging a pull request is the
  deploy**: the site updates a minute or two later.
- **Preview before merging:** Pages only shows `main`, so each pull request
  gets a private Claude artifact of its `index.html` for phone testing.
- **Rollback:** copy the previous `versions/sprout-siege-vN.html` over
  `index.html` and merge that.
- Cloud sessions cannot open `github.io` (egress 403), so the live site can
  only be checked from a phone or computer.
- Netlify (`sprout-siege.netlify.app`) is retired; ignore it.

---

## 10. Suggested project setup

Files worth carrying into the project:

1. This brief.
2. The current `versions/sprout-siege-vN.html`.
3. The full numbered version set, if the project allows the volume. If not,
   keep v3, v12, v21, v23, v27, v28, v29 as the milestone set.
4. The harness: `shim.js`, `run.js`, `shot28.js`, `geom.js`, `cover.js`.

Project instructions worth setting: the format constraints (single HTML file,
mobile horizontal, pixel art), the numbered-versions rule, the no-em-dash rule,
and a pointer to sections 3 and 4 of this brief so settled and rejected
directions are not re-litigated.
