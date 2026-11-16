# Tower session kit

One page to take into the ChatGPT tower session (16 Nov 2026). It fixes the
**format** of what comes back and the **job** each tower does. It leaves
open **what each tower is**: a gnome, a plant, a scarecrow, a birdbath,
anything that belongs in a garden. Today's four towers are placeholders.

## 1. Attach these three pictures

All in `docs/tower-kit/`.

| Picture | Why |
|---|---|
| `1-world.png` | Map 1 and the Great Sprout, with nothing built. The world the towers must fit into. |
| `2-towers-for-size.png` | The same map with today's placeholders standing in it. Shows how big a tower is on screen. |
| `3-size-and-style.png` | The tower canvas as a grid, and the rendering style close up. |

## 2. The four jobs to cast

The powers are fixed, because the rules and balance are built on them. Who
does each job is yours to decide.

| Job | In play | The look has to show | Later it splits into |
|---|---|---|---|
| **Workhorse** | Steady single shots | Something that aims and throws | A long-range sniper, or a fast short-range one |
| **Soaker** | Splash damage, slows bugs | Something that covers an area | A heavy splash, or a deep slow |
| **Chainer** | Hits one bug, jumps to its neighbours | Something that arcs or sparks | More jumps, or one big stunning hit |
| **Swarm** | Fast homing hits that never miss | Something that sends out many small things | A fast single stinger, or a damage cloud around it |

If an idea you love needs a different power, bring it back and we decide it
in a Code session: that one costs balance work.

## 3. What every picture must be

- **One figure per picture**, whole, centred, standing on the ground, seen
  from the front and slightly above (like the placeholders).
- **Flat magenta background** (`#ff00ff`). No ground, no shadow, no
  scenery, no text, no frame.
- **Big square pixels.** Ask for a 48 by 48 grid of pixels filling a square
  picture. The figure is about 21 to 34 of those pixels wide and 33 to 37
  tall, with empty rows above it.
- **Style:** every pixel one flat colour; one light from the top left; a
  dark coloured outline, never black; about 16 to 36 colours; no
  gradients, blur or soft edges.
- **Download the PNG.** No screenshots: they blur the pixels.

The cleanup script repairs a picture that is nearly on the grid. It cannot
repair a painting that only looks pixelated from far away.

## 4. Prompts to paste

**Round one, exploring.** Level 1 only, one picture per idea:

```
Pixel art sprite for a cozy garden tower defense game. This is a tower the
player plants beside a trail to stop bugs. Its job: [job from the table, in
your own words]. Idea to try: [your idea, or "surprise me with three
different garden ideas, one picture each"].

Match the attached pictures in rendering style and size only. The gnome,
sprinkler, lamp and beehive in them are placeholders: do not copy them.

Draw it on a 48 by 48 grid of large square pixels that fills the whole
picture. The figure is about 28 pixels wide and 35 tall, whole, centred,
standing on the ground, seen from the front and slightly above. Every pixel
one flat colour, one light from the top left, a dark coloured outline (not
black), about 20 colours, no gradients, no blur, no soft edges.

Flat solid magenta background (#ff00ff). No ground, no shadow, no scenery,
no text.
```

**Once you like one,** attach it to the next request and add: "Same pixel
size, outline and light as the attached tower, so they look like one set."

## 5. What makes a good pick

- You can tell what it does from its shape, at the size in picture 2.
- It is not mostly the lawn's light green (`#93dcaa`), or it vanishes.
  Plants need darker or warmer greens, a pot, flowers, fruit.
- It can visibly grow twice and then turn into two different things. Every
  tower has 7 looks in the end; level 1 should leave room to grow.
- It does not look like the Sprout (a tall beanstalk with pods).
- The four look like a set, and no two could be mixed up.
- It still works flipped left to right, because towers turn to face bugs.

## 6. Bring back

1. The PNG of each idea you like, up to three per job.
2. The exact prompt that made each one.
3. A word on which you prefer and why.

Drop them into a Code session. Claude cleans them, makes a contact sheet,
and puts your picks into a preview build to play on the phone. Only the
ones that survive the phone go on to all 7 stages.
