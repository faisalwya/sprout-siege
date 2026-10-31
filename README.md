# Sprout Siege

A pixel-art tower defense game in a single HTML file. Bugs march a winding
trail toward your carrot patch; plant gnomes, sprinklers, zap lamps and
beehives to stop them. Three maps, five waves each, towers that fork into
specialities at level 3.

**Play:** https://faisalwya.github.io/sprout-siege/ or
https://sprout-siege.netlify.app (built for iPhone in landscape).

## Which file decides what

| File | Decides | Who it's for | Changes when |
|---|---|---|---|
| `index.html` | **The game itself.** The only file players ever load. | Players | Every version |
| `CLAUDE.md` | **How work gets done:** hard constraints, sync rules, the version routine, known traps. Read automatically by every Claude Code session. | Claude | Rarely, when the process changes |
| `SPROUT-SIEGE-BRIEF.md` | **What the game is and why:** design, settled and rejected decisions, lessons, version history. | Claude and Faisal | Every version (version map row) |
| `ROADMAP.md` | **What comes next:** each upcoming version as a task list with a "done when". "Make vN" means build that section. | Claude and Faisal | When a version ships or plans change |
| `WORKFLOW.md` | **How to sync and avoid conflicts,** in plain language. | Faisal | Rarely |
| `versions/` | Frozen copy of every version, for comparing or reverting. | Both | Every version (one new file) |
| `labs/` | Throwaway mockups used to settle visual questions. | Both | When a visual question needs a mockup |
| `tools/smoke.js` | Whether a version is allowed to ship: must print all PASS. | Claude | When the game gains something new to test |

**When files disagree:** Faisal's message in the session wins, then
`CLAUDE.md` for process, the brief for design, the roadmap for scope.

## How a change reaches the live game

```
idea (chat) -> ROADMAP.md entry -> "make vN" (phone or Mac)
  -> branch -> tests + screenshots -> private preview link
  -> pull request -> Faisal merges -> main -> live site
  -> Mac: "pull the latest"
```

## Run the tests

Needs Node.js. First time only:

```
npm install
npx playwright install chromium
```

Then `npm test`. Screenshots of each stage are written to `tools/out/`.
