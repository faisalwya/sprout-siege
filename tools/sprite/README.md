# Sprite tools

Three small scripts for the sprite pass (`docs/sprite-framework.md`, steps 3
and 4). They need Node only. None of them touches `index.html`.

| Say to Claude | Runs | What you get |
|---|---|---|
| "clean this sprite" | `node tools/sprite/clean.js picture.png` | The picture as a real sprite: on the pixel grid, in the master palette, backdrop gone, outline rebuilt, feet on the feet row. Plus a pass or fail line for each automatic check. |
| "make a contact sheet" | `node tools/sprite/sheet.js a.png b.png` | One picture of the sprites beside the four v34 towers: on spring, summer, autumn and winter ground at phone size, enlarged, and as black silhouettes. |
| "test the sprite tools" | `npm run sprite:test` | The tools prove themselves on wrecked copies of the v34 towers. Must print all PASS. |
| "rebuild the palette" | `node tools/sprite/palette.js` | `master-palette.json`, the swatch `master-palette.png` and `ref/*.png`, read out of the frozen v34 file. Only needed if the rules change. |

Results go to `tools/out/sprite/` (not kept in git). Anything worth keeping
gets copied into the repo by hand.

## What is locked here

- **Master palette:** 73 colours, every colour the four v34 level 1 towers
  use (`master-palette.json`, swatch in `master-palette.png`). The framework
  hoped for 32 to 48. Trimming it means redrawing the v34 towers a little, so
  it is left whole until the Gnome pilot shows whether 73 is a problem.
- **Tower canvas:** 36x48 art pixels by default, read from the palette file.
  Nothing assumes it: `--canvas 40x56` gives a taller one with the same
  headroom rule, and the contact sheet lines sprites up by their feet whatever
  size they are.
- **Feet row:** 41. The brief says row 39, which is where the feet meet the
  ground; the art's lowest pixels (the rounded base) sit on 41, or 42 for the
  Zap Lamp. The tools measure the lowest pixel, so 41 is their number.

## The cleanup, step by step

1. **Grid.** Finds how big the picture's fake pixels are (they are rarely a
   whole number) and reads one colour from the middle of each.
2. **Downscale.** Only if the figure is too big for the canvas. It says so,
   because shrinking pixel art drops detail. Better to ask the model for a
   smaller figure, or use a taller canvas.
3. **Palette.** Every colour moves to the nearest master palette colour.
4. **Background.** The flat backdrop goes, then the soft fringe it leaves.
5. **Outline.** The outer ring is recoloured as a coloured outline, lighter
   toward the top left, by the same recipe the game uses. Thin parts (drops,
   tendrils) and light details on the edge are left alone.
6. **Place.** Centred, lowest pixel on the feet row.

Useful switches: `--tall 35` (make the figure that many art pixels tall, to
match a neighbour stage), `--strip` (several figures in one picture),
`--outline keep` (trust the picture's own outline), `--cell 16` or
`--bg #ff00ff` (when a guess is wrong). `node tools/sprite/clean.js` with
nothing after it prints them all.

## What the checks cannot judge

Charm, whether it is still the same character, whether two forks could be
confused, whether it out-shouts the Sprout. Those are for eyes, on the
contact sheet and then in the game on the phone.
