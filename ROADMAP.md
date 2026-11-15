# Roadmap

Rewritten after the critique session (15 Nov 2026) from Faisal's decisions.
Each entry is one focused change, small enough to review on a phone. Work
them in order, **one at a time**: anything that touches `index.html` queues
behind whatever is in flight, art included. When an entry ships, tick its
box, move its section to `docs/roadmap-history.md` and move anything left
over to a later entry.

Shipped sections (v30 to v34) are in `docs/roadmap-history.md`.

**1.0 means:** four maps, one per season (spring, summer, autumn, winter),
with final art, balanced, progress saved, installable on iPhone, deployed.
Carried over from the old definition: played by five people. Not in 1.0:
more than one map per season, the theme switch, endless-mode tuning, audio
unless it is placed below before then.

---

## Decisions (Faisal, 15 Nov 2026)

1. **Four pillars, not eight:** Look, Play, Feel, Tech. Each holds one open
   question, and a version must answer one.
2. **Story is not a pillar or a version.** It is a half-page note written
   after the map 1 slice, grown out of playing it.
3. **1.0 is four maps, one per season.**
4. **Order:** copy fixes, sprite pilot (Gnome family, 7 stages), map 1
   finished as a vertical slice (all towers, bugs, the Sprout final), save
   and install, balance, maps 2 to 4.
5. **Art is no longer a parallel track.** Anything touching `index.html`
   queues: one change in flight.
6. **Embed script allowed.** Art lives as PNG sheets in `assets/` and a
   small script inlines them into `index.html` as data URIs. The shipped
   game stays one self-contained file.

**Faisal's priorities** (15 Nov 2026) still stand and explain the order:
art, style and design first; UI and UX slight improvements; mechanics and
story later, with the story growing out of playtesting.

## Pillars

Every version names its pillar and the question it answers. When a question
is answered, write the answer in the brief and give the pillar its next
question. A version that answers nothing is cleanup or preparation: say so
in its entry and keep it small.

| Pillar | Covers | Open question now | Answered by |
|---|---|---|---|
| **Look** | Art rules (references, resolution, palettes, light, outlines, proportions) and all art: towers by stage, bugs, the Sprout, ground and props, UI skin, effects | Can image-model sprites, cleaned to the 2x grid, keep the v34 charm across all 7 stages of a tower? | v35 sprite pilot (C2 and C4 prepare it) |
| **Play** | Rules, towers and forks, economy, enemies, waves, map layouts, balance | Is one finished map fun to replay, challenging but fair? | v36 map 1 slice, then v38 balance |
| **Feel** | Controls, tap targets, feedback, readability, screens and copy, sound | Can you place and upgrade a tower without fighting the controls or guessing the numbers? | C3 |
| **Tech** | Engine, 2x rendering, art pipeline, file size, save, install, tests, deploy | Can art live as PNG sheets in `assets/` while the game ships as one file inside a size budget? | C4 |

The four questions are worded by Claude from the decisions above. Faisal:
reword any that miss what you meant.

**Process** is the spine, not a pillar: branches, previews, numbered
versions, tests, these docs.

The old eight map across like this: Art direction and Art production are
Look; Game design and Level design are Play; UX and game feel and Audio are
Feel; Technical is Tech; World and story is the note in decision 2.

---

## Now: C0 to C4

Set by Faisal on 15 Nov. One at a time; stop after each and wait for
"next". The numbers for C3 and C4 (v34.2, v34.3) are Claude's suggestion;
C1's is Faisal's.

**Done:** C0 (docs, 15 Nov) and C1 (v34.1, stale copy). Their sections are
in `docs/roadmap-history.md`.

### C2: Sprite tools [ ]

Look, preparation for the pilot. **No game file:** `index.html` is not
touched, so it does not hold up the queue for the game file.

1. **Cleanup script** (`tools/`): takes an image-model picture and returns
   a sprite on the true pixel grid. Steps in this order: find and snap to
   the grid, downscale nearest-neighbour to the tower canvas, quantise to
   the master palette, remove the background, rebuild the outline. The
   canvas size is an input, not a constant.
2. **Contact sheet maker** (`tools/`): the sprite on all four season
   grounds (spring `#93dcaa`, summer `#7fcf8c`, autumn `#a9b878`, winter
   `#e3ecf0`) at phone size, plus black silhouettes.
3. **Master palette**, extracted from the v34 level 1 towers, saved as data
   and as a swatch image for the reference pack.

**Done when:** the cleanup script, run on a deliberately blurred and
off-grid copy of a v34 tower, gives back a sprite that passes the
framework's checklist (section 7: on the grid, palette subset, outline);
a contact sheet of the four v34 level 1 towers is rendered and looked at.

### C3: v34.2, placement snap and next-level stats [ ]

Feel. Answers: can you place and upgrade without fighting the controls or
guessing the numbers?

1. **Snap instead of refusing.** When a placement tap lands on a spot that
   is not legal, move it to the nearest legal spot within a few units and
   arm that. Only if nothing legal is that close does it refuse. "No room
   there" goes away for near misses.
2. **Next-level stats in the upgrade plaque,** so the price buys something
   you can read before you pay. It must still fit the two-line plaque band
   (brief decisions 11 and 12) on all three maps.

**Done when:** `npm test` all PASS, with a new check that a tap just
inside the trail edge arms a legal spot; plaque screenshots for all four
families checked; **Faisal plays the preview on his iPhone before
merging.**

### C4: v34.3, sprite plumbing [ ]

Tech. Answers: can art live as PNG sheets in `assets/` while the game ships
as one file inside a size budget?

1. **Art chosen per stage:** L1, L2, L3, A4, A5, B4, B5 (today levels 1 to
   3 share one sprite and each fork has one).
2. **Sheet loader:** rows are stages, columns are frames.
3. **Frame timer** for idle and attack frames.
4. **Embed script:** inlines the PNG sheets in `assets/` into `index.html`
   as data URIs. The version routine in `CLAUDE.md` gains the step; the
   smoke test reports the file size against a budget (suggested: under
   500 KB).
5. **Proof:** tinted copies of today's sprites run through the whole path,
   so each stage is visibly a different sheet cell. No new art.

**Do not assume the tower canvas stays 36x48.** Canvas size and feet anchor
come from the sheet's data, per family or per stage.

**Done when:** `npm test` all PASS; a screenshot shows all 7 stages of one
family drawing from a sheet; `index.html` makes no external request and
its size is reported.

---

## After C4, in order

Numbers are provisional and each is written up in full when it is next.

### v35: Sprite pilot, the Gnome family [ ]

Look. Answers: can image-model sprites keep the v34 charm across all 7
stages? Follows `docs/sprite-framework.md`: Gnome L1 to L3 static, both
forks static, gate A in game on the phone, then idle animation for one
stage, gate B. If gate A fails for the whole family, stop and rethink; the
fallback is to redraw in code from the generated image.

Settle at the start (framework section 10): canvas growth for forks, and
which stages get idle motion. Already settled: storage is PNG sheets plus
the embed script; the master palette comes from the v34 towers (C2).

### v36: Map 1 as a vertical slice [ ]

Play and Look. Map 1 finished to 1.0 quality: all four tower families at
all 7 stages, the five bugs with walk cycles, the Sprout final. Expected to
be a run of numbered versions (v36, v36.1 and so on), one in flight at a
time. Answers: is one finished map fun to replay?

**Then the story note:** half a page, written after the slice is played.
What the Sprout is, why the bugs want it, what a year in the garden means.
Not a version.

### v37: Save and install [ ]

Tech.

1. **Save** to `localStorage` at each map start and on pause: map, wave,
   lives, gold, towers. A Continue button on the title screen. Wrap every
   storage call in try/catch.
2. **Web app manifest and icon** inlined as data URIs so the file stays
   self-contained and Add to Home Screen opens fullscreen.
3. **Add to Home Screen hint** for iPhone Safari users who are not
   installed yet.

### v38: Armor and balance [ ]

Play.

1. **Armor bug:** armor is a flat cut per hit, so small fast hits are
   gutted. Pollen Bloom loses 62% of its damage against the Grand Slug
   (armor 4), level 1 Sprinkler 44%. Proposal: armor becomes a percentage
   reduction (for example armor 4 = 30%). Show Faisal the before and after
   damage table before choosing.
2. **Balance simulator:** `tools/sim.js` plays every wave headless with a
   greedy placement under a fixed gold budget and reports lives lost per
   wave and gold left per map. Run it 20 times per map.
3. **Tune** with the cheapest levers first (enemy HP multiplier `m`,
   starting gold), then Deadeye range.
4. Faisal plays each map twice on the phone and says how it felt.

**Target:** a competent run finishes the last map with 8 to 15 lives left
(4 to 8 pods), challenging but fair.

### v39: Maps 2 to 4 [ ]

Play and Look. Summer and autumn brought up to the slice's standard, and
winter built (a palette exists, `WINTER_PAL`, but no map). Layouts picked
by Faisal from rendered mocks. Re-run the balance simulator after.

Then 1.0.

---

## Not placed in the order yet

From the old roadmap. Each needs a place (or a no) before 1.0; none starts
until Faisal slots it in.

| Item | Pillar | Was |
|---|---|---|
| UI kit at 2x: plates, buttons, price chips, icons, a 2x pixel font | Look | v38 |
| Tap areas at least 44 points, padded hit boxes (brief open item 8) | Feel | v38 |
| Bug outlines: re-test `BUG_OUTLINE` in play and settle | Look | v38 |
| Next-wave preview beside the GO button | Feel | v40 |
| Environment kit per season: trees, props, flowers | Look | art track 4 |
| Effects: shots, hits, placement mark (brief open item 6) | Look | art track 5 |
| Sound effects and music | Feel | parked |

## Later, after 1.0

- More maps per season (the garden year as 2 to 3 per season, or 12).
- `THEME` object (palette, sprites, names), then the theme switch (space
  and beyond).
- Hand-drawn touch-ups over the sprite pass: a late nice-to-have.
- ~~Sprout Lands pack.~~ Dropped: art is made for this game.
- Authored `plots` arrays predate the v32 maps; redo them if `'plots'` mode
  returns.
