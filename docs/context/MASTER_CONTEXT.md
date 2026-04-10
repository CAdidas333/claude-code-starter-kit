---
updated: 2026-04-10
tags: [context, master]
---

# Master Context — Claude Code Starter Kit

## What This Project Is

The Claude Code Starter Kit is a packaged, opinionated Claude Code
setup designed to take a new user from zero to productive in about
20 minutes. It bundles:

- A brain/workspace structure (`~/Projects/_brain/`)
- 12 custom skills (`/new-project`, `/today`, `/wrap`, `/status-report`,
  `/ingest`, `/digest`, `/investigate`, `/scout`, `/audit`,
  `/morning-brief`, `/memory-md-management`, `/welcome`)
- 2 background agents (context-updater, brain-updater)
- 3 hooks (SessionStart Overwatch banner, PreToolUse context guard,
  PostToolUse code reviewer)
- 2 MCP servers auto-configured (lean-ctx for smart file reading,
  Armory for the personal knowledge vault)
- A guided `/welcome` onboarding that personalizes itself via an
  interactive interview inside Claude Code
- Cross-platform installers — `setup.sh` (Mac) and `setup.ps1`
  (Windows) — sharing a single Node.js finisher for heavy lifting
- A documentation set: README, INSTALL, FIRST-SESSION, CHEATSHEET,
  WORKFLOWS, CLI-REFERENCE, WHAT-IS-THIS, UPDATING

## Current Status

**Design phase complete — implementation plan next.**

The architecture, scope, file tree, `/welcome` skill behavior,
sanitization rules, and end-to-end user flow were all approved
through a structured brainstorming session on 2026-04-10. The full
design doc lives privately (not in this repo). Implementation
planning begins next, followed by the Phase 1 build.

## Non-Goals

- **Not a tutorial.** The kit assumes users want a *working setup*,
  not an explanation of every concept. Conceptual docs exist
  (`WHAT-IS-THIS.md`) but they're optional reading.
- **Not multi-user or cloud-based.** Single user, local install.
- **Not locked to any project type.** The Armory's self-learning
  pattern means the kit adapts to whatever the user chooses to
  work on.
- **No coupling to the maintainer's other work.** The kit is entirely
  self-contained. Zero project names, customer names, or proprietary
  content from the maintainer's private projects appears here.

## Architecture (High Level — Five Layers)

1. **OS installer** — `setup.sh` / `setup.ps1`. Tiny (~50 lines each).
   Installs Node, git, gh, package managers. Hands off to layer 2.
2. **Cross-platform finisher** — `bin/finish-setup.js`. Node script.
   Creates workspace, copies templates/skills/agents/hooks, installs
   MCPs, merges `~/.claude/settings.json`. Idempotent (safe to re-run).
3. **`/welcome` skill** — interactive onboarding inside Claude Code.
   Interviews the user, writes profile/working-style/focus files,
   seeds memory, transitions to first braindump. Three paths:
   - "I have specific projects in mind"
   - "I'm exploring, help me think it through"
   - "I don't know yet, learn as I go" — triggers the self-learning
     Armory mode
4. **Documentation** — README, INSTALL, CHEATSHEET, FIRST-SESSION,
   WORKFLOWS, CLI-REFERENCE, WHAT-IS-THIS, UPDATING. Written for
   newcomers, no jargon assumptions, generic examples only.
5. **Content payload** — templates, skills, hooks, MCP server source,
   three seed Armory notes for day-one demonstration.

## How the Self-Learning Armory Works

Users who don't have specific projects in mind can set the Armory to
"learn mode" (`auto_learn: true` in `_brain/Armory/Focus.md`). In
this mode:

- Every `/new-project` invocation auto-appends the new project to
  `Focus.md` as a focus area
- Every `/ingest <url>` checks `Focus.md`; if empty, it tags notes
  with extracted topics; if populated, it offers to tag with known
  areas
- `/today` reads `Focus.md` and tailors daily briefings to the user's
  real focus areas
- `/audit` (weekly) reviews all recent activity and proposes focus
  area updates when it sees a confident pattern — the user approves
  before anything is added
- Users can edit `Focus.md` manually any time

The net effect: users aren't penalized for not knowing what they want
on day one. The system meets them where they are, quietly watches what
they actually engage with, and asks for permission before locking
anything in.

## Sanitization Rules (For Future Session Continuity)

This is a public repository. Before committing anything:

1. **Allow-list copying** — files are individually named in
   `bin/finish-setup.js`. There is no `cp -r` of entire directories
   from the maintainer's personal sources. Adding a file to the kit
   is a deliberate, visible action.
2. **Banned-strings pre-commit check** — a hook (or script) runs
   `rg` over every file in the repo and fails the commit if it finds
   any string from a defined banned list. Names of the maintainer's
   other projects, people, customers, and industry jargon are all
   on that list.
3. **Line-by-line manual review** — every file that's scrubbed from
   an existing source gets a second-pass human read for context
   leaks that automated greps can't catch (tone, anecdotes, generic
   but revealing phrases).
4. **Pre-publish review checkpoint** — before any kit update is
   pushed public, the maintainer gets a diff of every scrubbed file
   and must explicitly approve. No automation publishes without a
   human go-ahead.

The full sanitization specification — including the exact banned
strings list, the per-file treatment plan, and the pre-publish review
UI — is in the private design doc.

## Decisions Locked (2026-04-10)

1. **Scope:** "B+" — refresh + Armory + lean-ctx + all 11 existing
   custom skills. Comms/Nerve Center excluded (premature for newcomers).
2. **Install flow:** shell installer → Node finisher → `/welcome`
   skill inside Claude Code for personalization
3. **Windows strategy:** native PowerShell for OS-level installs
   (`setup.ps1`) + shared cross-platform Node finisher for the 90%
   that's identical
4. **Distribution:** public GitHub repo, MIT licensed
5. **Attribution:** maintainer name in LICENSE + README byline only
6. **Sanitization:** allow-list + banned strings grep + manual review
   + pre-publish review
7. **`/welcome` paths:** three, including "I don't know yet, learn
   as I go" — the self-learning mode is a first-class feature, not
   a fallback
8. **Seed Armory notes:** ship three generic starter notes (subject
   to pre-publish review)
9. **Directory name:** `Claude-Code-Starter-Kit`
10. **Repo:** `CAdidas333/claude-code-starter-kit` (public)
