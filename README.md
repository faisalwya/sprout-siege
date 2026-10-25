# Sprout Siege

A pixel-art tower defense game in a single HTML file. Bugs march a winding
trail toward your carrot patch; plant gnomes, sprinklers, zap lamps and
beehives to stop them. Three maps, five waves each, towers that fork into
specialities at level 3.

Built for iPhone in landscape. Open `index.html` in any browser to play.

## Run the tests

Needs Node.js. First time only:

```
npm install
npx playwright install chromium
```

Then:

```
npm test
```

Screenshots of each stage are written to `tools/out/`.

See `SPROUT-SIEGE-BRIEF.md` for the design brief and `CLAUDE.md` for the
working rules.
