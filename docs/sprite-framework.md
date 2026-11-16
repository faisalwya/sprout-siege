# Sprite session framework (for brief open item 4)

Written by the critique session, 15 Nov 2026. Provisional: the pilot exists to prove or break it. Read with `claude/critique-2026-11-15.md`.

> **Status, 16 Nov 2026.** Faisal's later decisions change four things here (brief decision 26, roadmap). The rest stands as written.
> 1. The tower characters are open. Today's Gnome, Sprinkler, Zap Lamp and Beehive are placeholders, so "L1: the v34 reference, unchanged" (section 3) and "pilot on the Gnome" (sections 0 and 5) no longer hold. Level 1 ideas for all four jobs are explored first and tried in the game; 7 stages come after.
> 2. What Faisal takes into the ChatGPT session is the one page `docs/tower-session-kit.md`, not this document. Sections 4 and 8 are superseded by it.
> 3. One palette for every tower, locked from the picked designs. The 73 colour palette taken from the v34 towers is provisional.
> 4. Sprites are judged on spring ground for now; the other seasons (sections 2, 5 and 7) are a later pass. Storage is settled: Option A (section 6).

## 0. The idea in one paragraph

Do not start by generating 28 towers. Run a **pilot on one family (Gnome Post, 7 stages)** through the whole pipeline, from ChatGPT to a build on your phone, and only then scale. Image models produce pictures that look like pixel art but are not on a pixel grid, so the pipeline matters more than the prompts. If the pilot fails its gates, the fallback is the route that already worked in v34: use the generated image as reference and redraw in code.

## 1. What must be true before generating anything

| Prerequisite | State today | Needed |
|---|---|---|
| Per-level art | Levels 1 to 3 share one sprite; each fork has one. 12 tower sprites. | `artOf()` picks art by stage: L1, L2, L3, A4, A5, B4, B5. |
| Animation | A 1px sine bob. No frames. | A sheet loader: rows are stages, columns are frames, with a frame timer. |
| Art storage | Char-row strings in `index.html`. | See section 6. 42 frames of 36x48 as char-rows is about 73 KB per family, about 290 KB for all towers (the whole game is 152 KB today). An embedded PNG sheet should be far smaller: measure it in the pilot. |
| Stage brief | None. | Section 3, filled in for the Gnome before the session. |
| Reference pack | Exists in pieces. | Section 4. |

The first two are a small code version of their own, built in a Code session before or alongside the pilot.

## 2. Fixed specs (from the game as built)

| Spec | Value | Note |
|---|---|---|
| Art scale | 2x: 640x288 art pixels over 320x144 game units | One art pixel is about 1.3 pt on the iPhone. |
| Tower canvas | 36x48 art px, feet on row 39, centred on x 18 | From brief decision 20. |
| Level 1 drawn size | 21 to 34 wide, 33 to 37 tall | Gnome 24x35, Sprinkler 34x33, Zap 21x37, Hive 23x34. |
| Headroom | 6 to 9 px above a level 1 tower | **Too little for growth.** See open question 1. |
| Light | One light, top left | Brief art rules. |
| Shading | 5-step ramps, hue shifted (shadows to blue-violet, highlights to warm yellow) | |
| Outline | Coloured, towards dark ink, never black | |
| Not allowed | Dither, alpha, blur, anti-aliasing | Every pixel one solid colour. |
| Colours | Level 1 towers use 17 to 36 colours each | Lock one master palette (target 32 to 48) from them plus the season ramps. |
| Grounds to read on | Spring `#93dcaa`, summer `#7fcf8c`, autumn `#a9b878`, winter `#e3ecf0` | Test every sprite on all four. |
| Smallest readable change | About 4 art px in the silhouette, or a 6x6 colour block | A working rule of thumb, to confirm on the phone in the pilot. |

## 3. Progression grammar (fill in per family before generating)

The promise: at a glance, from the silhouette alone, you can tell a tower's stage. Proposed grammar, with invented Gnome examples only to show the kind of change (the real ones are yours to decide):

| Stage | Rule | Gnome example |
|---|---|---|
| L1 | The v34 reference, unchanged. | The gnome as drawn today. |
| L2 | Same silhouette, one added object or material upgrade. | Adds a satchel or a pebble pile. |
| L3 | Silhouette grows or changes once; hints at both forks. | Bigger hat, stands on a stump. |
| A4 / B4 | Fork: a new silhouette and a signature colour per fork. The two forks must never be confused. | Deadeye: tall, narrow, blue. Rascal: low, wide, green. |
| A5 / B5 | The fork plus a crown element and an idle effect. | A glint for Deadeye; a restless bounce for Rascal. |

Family identity rule: something stays constant through all 7 stages (the gnome's beard and nose, the hive's banding), so an upgrade reads as the same character growing, not a replacement.

## 4. Reference pack (attach to every generation)

1. `labs/v34-towers/towers-sheet.png`: the four level 1 towers on the grid.
2. One clean in-game screenshot per season with towers placed (from `tools/out/`).
3. The master palette as a swatch image.
4. For stages after L1: the accepted previous stage of the same family.

## 5. The loop, per asset

| Step | Who | What | Gate |
|---|---|---|---|
| 1. Brief | You, in chat | Fill the section 3 row. | One sentence per stage. |
| 2. Generate | ChatGPT | Static first, flat single-colour background, front view, references attached, several candidates. Try both one stage per image and one family strip per image, and keep whichever holds the character better. | You pick by charm, not by cleanliness. |
| 3. Clean | Code session (script) | Find the true grid, downscale to 36x48 nearest-neighbour, quantise to the master palette, remove background, rebuild the outline, snap feet to row 39. Order matters: grid, palette, cleanup. | No stray colours, no soft edges. |
| 4. Contact sheet | Code session | The cleaned sprite beside the L1 references and its neighbour stages, on all four season grounds, at 1x phone size and zoomed. Plus a black silhouette row. | Passes the section 7 checklist. |
| 5. In game | Code session | Embed, build a numbered preview, send the link. | You play it on the phone. "Mocks are not the game." |
| 6. Animate | ChatGPT, then script | Only for accepted statics. Idle 2 to 4 frames, attack 2 frames. Ask for a frame strip, not a GIF; the game needs frames. A GIF is fine for you to review motion. | Frames line up: feet and centre do not move. |
| 7. Log | Code session | Sheet into the repo, one line in the brief, prompt saved next to the asset. | Reproducible later. |

Pilot order: Gnome L1 to L3 static, then both forks static, then gate A (in game, on phone). Then idle animation for one stage, gate B. Then the other three families. Then the Sprout, bugs with walk cycles, trees.

Stop rules: three failed cleanup attempts on one asset means switch to the fallback for it. If gate A fails for the whole family, stop and rethink before spending more.

## 6. Storage and file size (decision needed)

Option A, recommended: art lives as PNG sheets in `assets/` in the repo (viewable on your phone, easy to replace), and a small script inlines them into `index.html` as data URIs. The shipped game stays one self-contained file; the "no build step" rule bends to one command that the version routine runs.

Option B: convert to char-rows by script and paste in. Keeps the rule intact; the file roughly triples and the source images have no home.

Either way set a size budget (suggestion: `index.html` under 500 KB) and have the smoke test report the size.

Naming: `assets/towers/gnome.png`, rows L1, L2, L3, A4, A5, B4, B5; columns idle 0 to 3, attack 0 to 1; one small table in code for frame counts and timing.

## 7. Acceptance checklist (every sprite)

- [ ] On the grid: each art pixel one solid colour, no anti-aliasing
- [ ] Palette is a subset of the master palette
- [ ] Light from the top left; coloured outline, not black
- [ ] Feet on the anchor row, centred
- [ ] Black silhouette differs clearly from the stage before and after
- [ ] Forks cannot be confused with each other, in play and as fork-button icons
- [ ] Reads on spring, summer, autumn and winter ground
- [ ] Reads at phone size without zoom
- [ ] Still the same character as L1
- [ ] Does not out-shout the Sprout

## 8. Prompt skeleton for ChatGPT

> Pixel art sprite for a cozy garden tower defense game. Subject: [stage brief]. Match the attached reference towers exactly in style: chunky readable shapes, one light from the top left, 5-step shaded ramps, dark coloured outline (not black), no anti-aliasing, no gradients, no dithering. Front three-quarter view, standing on the ground, whole figure visible, centred. Flat solid [magenta] background, no shadow, no scenery, no text. Same character as the attached previous stage, with this change: [one change].

Save the exact prompt and the chosen image with each accepted asset.

## 9. Fallback ladder

1. Cleaned import works: use it.
2. Cleaned import is close: touch up in code or by hand.
3. Import will not clean: keep it as reference, redraw in code (the v34 route).
4. Image model cannot hold the style across stages: try a tool that generates on a true pixel grid, or cut frames per stage.

## 10. Open questions to settle at the start of the session

1. **Canvas growth.** Keep 36x48 for all stages, or let forks use a taller canvas (for example 40x56, same feet anchor) so level 5 can be visibly bigger? If towers grow, the Sprout must grow too.
2. **Option A or B** for storage.
3. **Master palette:** derive from the v34 towers, or let the first accepted Gnome set it?
4. **Motion budget:** which stages get idle animation (all, or only L3 and up as a reward)?

## Sources consulted for image-model behaviour

- https://app.cinevva.com/guides/ai-pixel-art-generators
- https://blog.picassoia.com/ai-pixel-art-fixer-and-upscaler-clean-up-ai-sprites
- https://sorceress.games/blog/use-an-ai-sprite-generator-game-ready-sheet
- https://community.openai.com/t/developing-sprite-sheets-with-gpt-image-2/1379831
- https://www.atlascloud.ai/sv/blog/tips/gpt-image-2.5-sticker-pack
