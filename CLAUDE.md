# Claude Code Starter Kit

> The workflow system I wish I'd had on day one.

## What This Is

A complete, opinionated Claude Code setup — skills, hooks, brain
structure, MCP servers, and docs — packaged so a new user can go
from zero to productive in about 20 minutes.

## Status

**Design phase.** No kit content has been built yet. The approved
design lives in a private file outside this repo. See the docs/context/
files for the current state of work.

- `docs/context/MASTER_CONTEXT.md` — what this project is
- `docs/context/ACTIVE_PROJECTS.md` — active work within the kit
- `docs/context/SESSION_LOG.md` — session history

## For Future Claude Sessions Working on This Project

**This is a public repository.** Before committing anything, every
file must pass sanitization rules documented in the private design
doc. A banned-strings pre-commit check exists (or will exist) to
enforce this — do not bypass it.

Rules of engagement:
- Read `docs/context/MASTER_CONTEXT.md` first, every session
- Check active work in `docs/context/ACTIVE_PROJECTS.md`
- Log session outcomes in `docs/context/SESSION_LOG.md` at the end
- Never copy files blindly from other sources — use the allow-list pattern
- Run `/wrap` at session end to sync context docs, commit, and push
- Run `/today` at session start for a cross-project briefing if working
  across multiple projects

## Working Style Preferences (Maintainer)

- Short, bullet-pointed responses by default; go deep when asked
- Explain what you're about to do and wait for confirmation before
  destructive or hard-to-undo actions
- Fix bugs when you find them, and report what you found
- Add comments only when code isn't self-explanatory
- Direct feedback, no hedging, no preamble
- Maintainer tends to ramble and change direction mid-sentence —
  wait for them to land before acting

## Nerve Center

This project is a peer of the maintainer's other work. The shared
brain lives at `~/Projects/_brain/`. Session workflow:

- **Session start:** read this file + `docs/context/MASTER_CONTEXT.md`
- **During session:** track work via TodoWrite, commit frequently
- **Session end:** `/wrap` runs context-updater + brain-updater + commit + push

If any project status, phase, or priority changes, `_brain/Dashboard.md`
and `_brain/Claude-Code-Starter-Kit.md` need to be updated too.
