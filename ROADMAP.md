# Roadmap

The plan from the v29 review (25 Oct 2026). Reordered after v31: look and
feel (v32, v33) before armor and balance, at Faisal's call. Reordered again
after v34 (12 Nov 2026): the look pass shipped as v34, world and story come
next, armor and balance moved to v37. Each version is one focused change,
small enough to review on a phone. Work them in order, one at a time. Art
tracks run in parallel and never block a version. When a version ships, tick
its box and move anything left over to the next one.

Line numbers refer to v29 and will drift; search for the quoted text.

**1.0 means:** being redefined in v35 now that the garden grows into a year
of maps. Until then the old line stands as a floor: maps balanced, progress
saves, installable on iPhone, deployed, played by five people. Not in 1.0:
the theme switch, endless-mode tuning.

---

## Pillars

Every piece of work belongs to one pillar. Before a version starts, check
which pillar it serves and that the ones it depends on are settled enough.

| Pillar | Covers | Status after v34 |
|---|---|---|
| **Game design** | Rules, towers and forks, leveling, economy, enemies, balance | Rules stable since v12. Armor bug and balance open (v37). |
| **World and story** | Setting, the Sprout, the garden year, campaign arc, theme switch | Sprout settled. Garden year agreed, not written down: v35. |
| **Level design** | Map layouts, trail shapes, wave lists, per-map tuning | v32 maps carry the v34 look; layouts not revisited (v36). |
| **Art direction** | The rulebook: references, resolution, palettes, light, outlines, proportions | Settled in v34 (brief decisions 15 to 21). |
| **Art production** | Characters (towers by stage, bugs, the Sprout); environment kit (ground, trail, trees, props, seasons); UI kit (plates, buttons, icons, font); effects (shots, hits, placement) | Environment kit first pass done. Level 1 towers as reference. Rest in parallel tracks below. |
| **UX and game feel** | Controls, tap targets, feedback, readability, juice, screens | Working; tap target under 44 pt (v38). |
| **Audio** | Sound effects, music | Parked. |
| **Technical** | Engine, 2x rendering, performance, save, install, tests, deploy | 2x engine in. Save and install (v39). |

**Process** is the spine, not a pillar: branches, previews, numbered
versions, tests, these docs.

Small parts live in Art production when the question is how they look
(trees and trail in the environment kit, buttons in the UI kit) and in UX
when the question is how they behave (button size, where it sits, what a
tap does).

---

## v30: Cleanup [x]

No gameplay or look changes except the text and glyph fixes listed.

1. **CSS:** delete the stray `}` after the second `#bottom` rule (around
   line 42). It silently drops the `#pop,#confirm` rule that follows. Delete
   the duplicate `#bottom` block.
2. **Dead CSS:** remove rules nothing uses (`#pop`, `#pop .tail`, `.btn*`,
   `.fork*`, `.pbtns`, `.prow2`, `.pxi.hud`). Grep for each class first;
   keep anything still referenced.
3. **Dead JS:** remove `flipVert`, `iconCanvas`, the `act==='close'` branch
   in `doAction`, the hidden `#a2hs` element (v33 brings it back properly),
   and fix the stale header comment "plates, glyphs, and the vine selector".
4. **Version label:** `#ver` says V26. Set it to V30.
5. **Title screen copy** still describes plots ("Plots are the tilled beds",
   "tap a plot"). Rewrite for open placement in at most three short lines.
6. **Em dashes:** remove every `\u2014` and `&mdash;` (toast around line 1914,
   fork plaque around 2109, rift screen around 2142). Use a colon or comma.
7. **Glyphs:** in the 3x5 font, W reads as H and M nearly does too, so the
   HUD shows "M1 H1/5". Redraw W and M so they read at phone size (render
   and look). If 3px wide can't do it, show the wave as `1/5` with a small
   wave icon instead of the letter.
8. **Naming:** rename `HEART_BONUS` / `heartRate` to `CARROT_BONUS` /
   `carrotRate`, and fix "heart" in nearby comments.
9. **Logic out of display:** `showOver('rift')` computes `G.pack`. Move that
   into `waveDone()` so the future balance simulator can call it.
10. **Brief:** fork names in section 1 are out of date. The code's names are
    right: Deadeye / Rascal, Geyser / Frostmist, Storm Lamp / Jolt Post,
    Wasp Nest / Pollen Bloom. Fix the header line too.

**Done when:** `npm test` all PASS; title, HUD and fork screenshots checked;
no `\u2014` or `&mdash;` left in `index.html`.

## v30.1: Trail fits any screen [x]

Found on the live site: in iPhone Safari (toolbars make the screen wider than
the game) the trail started in open grass on the left and a stub poked out
behind the carrot patch. The side margin can reach 72px but the trail only
ran 24px past each edge.

1. Draw the trail straight on to the canvas edge, however wide the margin.
2. Clip the trail at the far side of the carrot bed.
3. Fade bugs in and out over the first and last 16px of the path, so they
   don't pop into view on wide screens.

No gameplay change: the walked path and timings are untouched.

**Done when:** all three maps checked at home-screen, Safari, wide desktop
and iPad shapes; smoke test wave times identical to v30.

## v30.2: Safari matches the home-screen app [x]

v30.1 fixed the trail ends, but Faisal wants Safari to look the same as the
home-screen app, not just tidy. Wider-than-game screens now get plain bars at
the sides instead of extra garden (`MAX_PAD_X=0`). Brief decision 6 amended.

**Done when:** Safari shape (852x308) shows the same layout as the
home-screen shape (852x393); smoke test all PASS.

## v31: UI on the canvas [x]

Brings play back in line with settled decision 1 (no DOM over the playfield).

1. **Full uppercase glyph set** (A to Z plus `: . , ! ?`) in the 3x5 font.
2. **Toast** drawn on the canvas with `plate()` and the pixel font, upper
   case. Remove the DOM `#toast`.
3. **Info plaque** drawn on the canvas. It must not cover the trail: in v29
   it hides part of map 1's bottom loop. Mock two placements, compare
   screenshots on all three maps, pick the one that never overlaps the trail.
   The fork text also runs to the plaque's right edge in v30 ("short reach."
   touches it); size the canvas plaque to its longest line.
4. **Action icons:** upgrade is an up arrow, sell is a coin with a plus
   (shipped as the top bar's coin instead, Faisal's call after playtest).
   Refund numbers green, costs yellow.

**Done when:** no DOM element is visible during play except between-screen
overlays (title, rift, win, lose); screenshots on all three maps show the
trail clear.

## v32: Maps that use the screen [x]

Faisal, 25 Oct: look and feel before balance. All three maps are the same
idea today: enter mid-left, zigzag right through 3 or 4 switchbacks of about
the same height, end at a carrot patch hard-coded at the right edge (x 272
to 318, y 66 to 126). The top-right quadrant of map 1 and the bottom corners
of every map go unused.

1. **Mock three layouts per map** in `labs/`, rendered at 852x393: vary where
   the trail enters, its overall shape (not only zigzags), and where the
   carrot patch sits. Keep each trail's length within about 15% of today's so
   balance does not swing wildly before v34.
2. **Faisal picks** one per map from the screenshots.
3. **Build the picks.** The patch position becomes per map: `CARROT_BOX`,
   `CARROT_SLOTS` and the baked bed in `paintBG` are hard-coded to one spot
   today and must move together. Trails must stay clear of the top info
   band, the HUD and the dock.

**Done when:** each map reads as a different place; smoke test all PASS,
including the plaque band check; Faisal approved the mocks.

## v33: Pixel-art screens [x]

The title, map-cleared, win and lose screens are still DOM text in a system
font. Paint them on the canvas in the pixel style, so the whole game looks
like one thing.

1. **Larger pixel title** (the 3x5 font scaled up) and body text in the
   pixel font on a `plate()` panel.
2. **Buttons** drawn and hit-tested through `G.btns`, like the rest.
3. **Remove `#over`** and its CSS. Only the portrait "turn your phone"
   notice stays DOM.

**Done when:** no DOM is visible at any point in landscape; smoke test
drives the screens through canvas taps and passes.

## v33.1: Half the carrots [x]

Faisal, 27 Oct: the bed was too big. Still 20 lives, drawn as 10 carrots of
2 bites each; a bite leaves a half-eaten carrot. Beds shrink to fit (wide
5x2, upright 2x5), freeing ground for towers. Top bar and screens keep
counting lives.

## v33.2: No plate shadow [x]

Faisal, 27 Oct: the 2px translucent shadow under every plate (buttons,
panels, price chips) read as a murky green band on grass. Removed.

## v34: Look pass [x]

Faisal, Nov 2026: refine the look before the tower sprite pass, keeping
pixel art. Iterated in-game as 19 numbered previews
(`versions/sprout-siege-v34-p1.html` to `p19`).

1. Art at 2x (640x288), game units unchanged.
2. Native 2x ground painter: calm grass, trail with a grass lip, groves,
   props, one season per map.
3. Proportions: world at P7's size, towers 10% smaller, no soil under built
   towers.
4. Level 1 towers redrawn in code as the reference canvas (36x48).
5. The carrot bed becomes the Great Sprout, pods as lives, a clearing where
   the trail meets it.

**Done when:** smoke test all PASS; Faisal plays the preview on his iPhone
and merges.

## v35: World and story doc [ ]

No code. A written doc that every later version builds on.

1. **The garden year:** how many maps (2 to 3 per season, or 12, one per
   month), how the seasons shift between them, where winter goes.
2. **The Sprout:** what it is, why bugs want it, how it changes through the
   year.
3. **Campaign arc:** what carries between maps, how a season ends, what
   comes after the year (the theme switch).
4. **Redefine 1.0:** how many maps ship, what is in, what is out.
5. **Tower progression as a promise:** what each of the 7 stages per family
   (levels 1 to 3, then 4 and 5 on each fork) must show, so the art tracks
   have a target.

**Done when:** Faisal approves the doc; the brief and this roadmap are
updated to match.

## v36: Map layout [ ]

1. Revisit maps 1 to 3 for play and scenery together: trail shape, where the
   Sprout sits, room for towers, framing.
2. A plan (sketches or mocks) for the rest of the garden year's maps.
3. Trail lengths stay within about 15% of today's until v37 re-tunes.

**Done when:** Faisal picks layouts from rendered mocks; smoke test all PASS.

## v37: Armor and balance [ ]

1. **Armor bug:** armor is a flat cut per hit, so small fast hits are gutted.
   Pollen Bloom loses 62% of its damage against the Grand Slug (armor 4),
   level 1 Sprinkler 44%. Proposal: armor becomes a percentage reduction
   (for example armor 4 = 30%). Show Faisal the before/after damage table
   before choosing.
2. **Balance simulator:** `tools/sim.js` plays all 15 waves headless with a
   greedy placement under a fixed gold budget (no top-ups) and reports
   carrots lost per wave and gold left per map. Run it 20 times per map.
3. **Tune** maps 2 and 3 using the cheapest levers first (enemy HP
   multiplier `m`, starting gold), then Deadeye range (110 px covers most of
   the field from the centre).
4. Faisal plays each map twice on the phone and says how it felt.

**Target:** a competent run finishes map 3 with 8 to 15 lives left
(4 to 8 pods), challenging but fair.

## v38: UI kit and UX [ ]

1. Plates, buttons, price chips and icons redrawn for 2x in the v34 style.
2. A 2x pixel font (the 3x5 font stays as a fallback or for tiny labels).
3. Tap areas at least 44 points, padded hit boxes where the art is smaller.
4. Re-test bug outlines (`BUG_OUTLINE`) in play and settle it.

**Done when:** smoke test all PASS; screenshots of every screen and the dock.

## v39: Save and install [ ]

1. **Save** to `localStorage` at each map start and on pause: map, wave,
   carrots, gold, towers. A Continue button on the title screen. Wrap every
   storage call in try/catch.
2. **Web app manifest and icon** inlined as data URIs so the file stays
   self-contained, so Add to Home Screen opens fullscreen.
3. **Add to Home Screen hint** for iPhone Safari users who aren't installed
   yet.

## v40: Next-wave preview [ ]

A small strip of the next wave's bug icons and counts beside the GO button.

## Art tracks (parallel)

Run alongside the versions above, each in its own branch and preview, never
blocking a version. All drawn in code to the brief's art rules; image models
(Faisal's pick) supply concepts, poses and animation ideas. Order:

1. **Tower progression:** all 7 stages of each of the four families, each
   stage visibly different and rewarding, with subtle idle movement.
2. **Bugs:** the five bugs at 2x, with walk cycles, readable on every
   season's grass (grub contrast is weak today).
3. **The Sprout:** final art, pod states, how it reacts to bites, seasonal
   changes.
4. **Environment kit:** trees, props and flowers per season, winter, and
   the extra maps' set dressing as v35 and v36 define them.
5. **Effects:** shots, hits, placement mark (brief section 5, item 6).

## Audio

Important but parked. Sound effects and music get their own version after
the UI kit.

## Later

- `THEME` object (palette, sprites, names), then the theme switch (space
  and beyond), after the garden year.
- ~~Hand-drawn sprite pipeline, Sprout Lands pack.~~ Superseded in v34:
  everything is drawn in code.
- Authored `plots` arrays predate the v32 maps; redo them if `'plots'` mode returns.
