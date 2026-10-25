# Roadmap

The plan from the v29 review (25 Oct 2026). Each version is one focused
change, small enough to review on a phone. Work them in order, one at a
time. When a version ships, tick its box and move anything left over to the
next one.

Line numbers refer to v29 and will drift; search for the quoted text.

**1.0 means:** three maps balanced, progress saves, installable on iPhone,
deployed, played by five people. Not in 1.0: space theme, endless-mode
tuning, new towers or enemies.

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

## v31: UI on the canvas [ ]

Brings play back in line with settled decision 1 (no DOM over the playfield).

1. **Full uppercase glyph set** (A to Z plus `: . , ! ?`) in the 3x5 font.
2. **Toast** drawn on the canvas with `plate()` and the pixel font, upper
   case. Remove the DOM `#toast`.
3. **Info plaque** drawn on the canvas. It must not cover the trail: in v29
   it hides part of map 1's bottom loop. Mock two placements, compare
   screenshots on all three maps, pick the one that never overlaps the trail.
   The fork text also runs to the plaque's right edge in v30 ("short reach."
   touches it); size the canvas plaque to its longest line.
4. **Action icons:** upgrade is an up arrow, sell is a coin with a plus.
   Refund numbers green, costs yellow.

**Done when:** no DOM element is visible during play except between-screen
overlays (title, rift, win, lose); screenshots on all three maps show the
trail clear.

## v32: Armor and balance [ ]

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

**Target:** a competent run finishes map 3 with 8 to 15 carrots left.

## v33: Save and install [ ]

1. **Save** to `localStorage` at each map start and on pause: map, wave,
   carrots, gold, towers. A Continue button on the title screen. Wrap every
   storage call in try/catch.
2. **Web app manifest and icon** inlined as data URIs so the file stays
   self-contained, so Add to Home Screen opens fullscreen.
3. **Add to Home Screen hint** for iPhone Safari users who aren't installed
   yet.

## v34: Next-wave preview [ ]

A small strip of the next wave's bug icons and counts beside the GO button.

## Later

- `THEME` object (palette, sprites, names), then the space theme.
- Hand-drawn sprite pipeline. The Sprout Lands pack (16px, Cup Nooble) fits
  the style. Its licence is non-commercial with credit required:
  "Assets from Sprout Lands by Cup Nooble".
- Placement mark refinement (brief section 5, item 6).
