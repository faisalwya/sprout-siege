# How we work on Sprout Siege

A plain-language guide to keeping every copy of the game in step. You don't
need to type git commands: say the phrases in **bold** to Claude Code and it
runs them for you.

## The words

| Word | Meaning |
|---|---|
| **Repo** | The project folder plus its full history. Lives on GitHub; copies live on your Mac and in cloud sessions. |
| **Commit** | A save point with a note, e.g. `v30: cleanup`. Saved on the copy you're working in only. |
| **Push** | Upload your new commits to GitHub. |
| **Pull** | Download commits from GitHub into your copy. |
| **Branch** | A side copy for trying a change without touching the main version. `main` is the real one. |
| **Pull request (PR)** | A request to merge a branch into `main`. You review it on GitHub, then press Merge. |
| **Merge** | Fold a branch's changes into `main`. |
| **Conflict** | Two copies changed the same lines differently. Git can't pick a winner, so someone has to. |
| **Drift** | Copies quietly getting out of step because someone forgot to pull or push. |

## The one rule

**GitHub `main` is the real game.** Your Mac folder and cloud sessions are
working copies. Anything not pushed to GitHub doesn't count yet.

## Working on your Mac

1. Open the Code tab, Local, folder `Documents/Sprout`.
2. Say **"pull the latest"** first, every time.
3. Work: **"make v30: ..."**. Claude follows the routine in `CLAUDE.md`.
4. Finish with **"commit and push"**.

## Working from your phone or a browser

1. claude.ai/code or the mobile Code tab, repo `faisalwya/sprout-siege`.
2. Give it one clear task. It works on its own branch.
3. When it's done, open the PR on GitHub, check it, press **Merge**.
4. Next time you're on the Mac, start with **"pull the latest"**. This is the
   step that brings phone work home.

## Avoiding conflicts and drift

- **One change in flight at a time.** The whole game is one file
  (`index.html`), so two sessions editing in parallel will almost always
  collide. Finish and merge one before starting the next.
- **Merge phone work before switching to the Mac.** An open PR plus new Mac
  edits to the same file is the classic conflict.
- **Pull first, push last.** Every session, no exceptions.
- **Edit only inside the repo.** No working copies in Downloads, email or
  chat. If a file arrives from somewhere else, put it in the repo and commit
  it, or it doesn't exist.
- **Don't edit files on the GitHub website** while a Mac or phone session is
  open on the same file.
- **The brief lives here.** If a copy is pasted into a chat Project for
  context, treat the repo version as the one that's right.

## Checking you're in step

Say **"are we in sync with GitHub?"** Claude answers with one of:

| Status | Meaning | Fix |
|---|---|---|
| Up to date, nothing changed | Perfect. | Nothing. |
| Uncommitted changes | You've edited but not saved a point. | **"commit and push"** |
| Ahead of GitHub | Saved locally, not uploaded. | **"push"** |
| Behind GitHub | GitHub has newer work (e.g. from your phone). | **"pull the latest"** |
| Diverged | Both sides changed. | **"pull and merge, show me any conflicts before resolving"** |

## Undoing things

| You want | Say |
|---|---|
| Throw away edits since the last save point | **"discard my uncommitted changes"** |
| Undo the last version but keep history | **"revert the last commit"** |
| Go back to an older version | **"restore index.html from v26 as a new version"** |
| Just look at an old version | Open `versions/sprout-siege-vN.html` in a browser |

Nothing committed and pushed is ever lost: every version stays in the
history and in `versions/`.

## What not to do

- Don't say "force push". It overwrites GitHub's history.
- Don't delete the hidden `.git` folder inside Sprout. It's what makes the
  folder a repo.
- Don't copy files between the Mac and other places by hand to "sync".
  Push and pull do that.
