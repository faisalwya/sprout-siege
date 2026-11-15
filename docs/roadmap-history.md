# Roadmap history

Shipped roadmap sections, moved here from `ROADMAP.md` so the roadmap only
holds what is still to do. Kept word for word as they were when each version
shipped. The one-line summary of every version is the version map in
`SPROUT-SIEGE-BRIEF.md` section 2.

Line numbers in the v30 section refer to v29 and have drifted; search for
the quoted text.

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

## C0: Record the critique decisions [x]

Docs only, straight to `main`. This rewrite of the roadmap, the brief and
`CLAUDE.md` updated to match, v30 to v34 moved to `docs/roadmap-history.md`,
brief decisions 15 to 21 marked as taste calls Faisal can reopen,
`docs/sprite-framework.md` saved.

## C1: v34.1, stale copy [x]

Cleanup, answers no pillar question. The game still talks about plots and
carrots; since v34 it is the Great Sprout and its pods.

Replace these, and only these:

1. Map-cleared screen title: "Plot held".
2. Map-cleared heading: "The carrot patch cleared" (the map name plus
   "cleared").
3. Map-cleared body: "You pack up the kit and step through".
4. Won screen heading: "All 3 plots held".
5. Won screen line at 20 lives: "Not one carrot lost".
6. Map 1's name: "The Carrot Patch".

Claude proposes the new wording in the pull request; Faisal picks. Every
character must be in the `GLYPH` table and every line must fit its plate
(check the screenshots).

Added by Faisal when C1 started ("include the three extra lines"):

7. Lost screen title: "Patch eaten".
8. Won screen line at 6 to 12 lives: "More stem than carrot now, but it
   held."
9. Won screen line at 1 to 5 lives: "Down to the last row. That was close."

**Done when:** `npm test` all PASS; title, map-cleared, won and lost
screenshots checked; none of the nine strings left in `index.html`.

**Shipped wording** (Claude's proposal, Faisal to change any in review):

| Was | Now |
|---|---|
| Plot held | Sprout safe |
| The Carrot Patch | The Spiral Lawn |
| You pack up the kit and step through: | The season turns and you move on: |
| All 3 plots held | All 3 seasons held |
| Not one carrot lost. | Not one bite taken. |
| More stem than carrot now, but it held. | More stalk than pod now, but it held. |
| Down to the last row. That was close. | Down to the last pods. That was close. |
| Patch eaten | Sprout eaten |

"The carrot patch cleared" was the map name plus "cleared", so the new name
fixes it. Left alone: `'plots'` mode toasts ("Plot taken", "Tap a plot to
preview", "Overgrown plot"), which only show if that mode returns.
