# Sprout Siege

Pixel-art tower defense. Bugs march a trail toward the Great Sprout; you plant
garden-themed towers to stop them. Owner: Faisal.

Full context lives in `SPROUT-SIEGE-BRIEF.md`. Read it before any design
change. `README.md` lists which file decides what. When files disagree:
Faisal's message in the session wins, then this file for process, the brief
for design, the roadmap for scope. Sections 3 (settled decisions) and 4 (rejected ideas) are closed:
do not re-propose anything listed there without a new reason.

## Layout

| Path | What |
|---|---|
| `index.html` | The current build. This is what gets deployed. |
| `versions/sprout-siege-vN.html` | Every numbered version, kept so any can be reverted to. |
| `labs/` | Throwaway mockups used to settle visual questions. |
| `tools/smoke.js` | Headless test: plays all 15 waves in Chromium, fails on any error. |
| `SPROUT-SIEGE-BRIEF.md` | Design brief, decisions, lessons, version map. |
| `WORKFLOW.md` | Plain-language guide to syncing, branches and avoiding conflicts. |
| `ROADMAP.md` | What each upcoming version contains and when it's done. |

## Hard constraints

- **One self-contained HTML file.** No build step, no dependencies, no external
  requests. Art is char-row sprites or data URIs inside the file.
- **Primary target: iPhone 15 Pro, landscape** (852x393 pt, DPR 3). Desktop
  must stay usable.
- **Pixel art at 2x** (since v34): game logic runs in 320x144 units with
  16-unit tiles; art is drawn on a 640x288 canvas (`ART_RES=2`), so a tile is
  32 art pixels. Integer-scaled where it costs under 5% of size.
- **All art is drawn in code** (sprites, ground, props, UI). Image-model
  output is reference only: concepts, poses, animation ideas. Nothing in the
  game depends on an imported image.
- **All in-play UI is painted on the canvas.** No DOM over the playfield.
- **No em dashes** anywhere: UI copy, comments, docs, commit messages.

## Sync with GitHub (every session)

Faisal is new to git: run the git commands yourself, explain in plain words,
and follow `WORKFLOW.md`.

- **Start:** fetch and pull `main` before touching anything. If the working
  copy has uncommitted changes or has diverged, stop and tell Faisal before
  doing anything else.
- **One change in flight.** If an unmerged branch or open PR touches
  `index.html`, say so before starting new edits to it.
- **Versions go through a branch.** Any change to `index.html` is made on a
  branch named `vN-short-name`, previewed, and merged by Faisal through a pull
  request, whether the session is local or in the cloud. Doc-only edits may
  go straight to `main`.
- **Finish:** commit and push. Never leave work only in a local copy or a
  cloud container.
- Never force push, rewrite pushed history, or delete `.git`.
- On a conflict, show both sides and ask which to keep. Don't pick silently.

## Making a new version (every time)

0. "Make vN" means build the vN section of `ROADMAP.md`. Do only what it
   lists; note anything else you spot under a later version instead.
1. Edit `index.html`.
2. Bump the version label: `const VERSION` near the top of the script.
3. Run `npm test`. It must print all PASS. Then look at the screenshots in
   `tools/out/`: render before judging, never reason about pixels blind.
4. Copy `index.html` to `versions/sprout-siege-vN.html`.
5. Update the brief: version map row, and any decision that was settled or
   rejected along the way.
6. Tick the version's box in `ROADMAP.md`.
7. Commit as `vN: one-line summary`. In the pull request, attach or describe
   the screenshots so Faisal can review from his phone.

## Gotchas that have each cost a version

- A crash can hide behind valid syntax. Always run the smoke test.
- The 3x5 `GLYPH` table has digits, A to Z and `+ - / % ? : . , !`. Anything
  else draws blank: add a glyph before using it. Measure text with `textW()`.
- Grass colour is per season (`P5_PAL[..].g1`). Never reuse it for foliage
  or anything that must stand out from the ground.
- In the background painter, a pixel past the canvas edge must be dropped,
  not wrapped (`lp()` checks bounds). Wrapping put a map 2 pine behind the
  dock on the opposite edge.
- A sprite canvas carries its scale in `_s` (2 for native 2x art). The
  `drawImage` wrapper divides by it when called with only a position, so
  callers keep using game units; size sprites with `gw()`/`gh()`, not
  `.width`. A 2x sprite without `_s` draws at double size.
- The smoke test taps in game units: it divides the canvas size by
  `ART_RES` before mapping. If the art scale changes, export it to the test.
- Don't use `globalCompositeOperation='source-atop'` over an opaque
  background; it tints a square.
- Plot geometry (`BED_*`, `TOWER_DY`, `PIP_Y`) is the single source of truth
  for spacing, tap targets and button keep-out. Change it together with the
  drawn footing and feedback soil, never separately.
- Buttons are hit-tested from `G.btns` and drawn last. Guard clause order in
  `doAction` matters.

## Testing on a phone

`index.html` on `main` is what deploys: GitHub Pages serves it at
https://faisalwya.github.io/sprout-siege/ and Netlify at
https://sprout-siege.netlify.app, so merging a pull request puts it live on
both. Before merging, publish the branch's `index.html` as a private Claude
artifact and send Faisal the link so he can play it on his iPhone. After
merging, test on the real iPhone through the live URL, not a local file.
