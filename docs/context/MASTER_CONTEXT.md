---
updated: 2026-06-27
tags: [context, master]
---

# Master Context — Claude Code Starter Kit

## What This Project Is

The Claude Code Starter Kit is a packaged, opinionated Claude Code
setup designed to take a new user from zero to productive in about
20 minutes. It bundles:

- A brain/workspace structure (`~/Projects/_brain/`)
- 17 custom skills (`/new-project`, `/today`, `/wrap`, `/status-report`,
  `/ingest`, `/digest`, `/investigate`, `/scout`, `/audit`,
  `/morning-brief`, `/memory-md-management`, `/welcome`,
  `/uptospeed`, `/audit-internal`, `/armory-cost`, `/speak`, `/verify`)
- 2 background agents (context-updater, brain-updater)
- 3 hooks (SessionStart Overwatch banner, PreToolUse context guard,
  PostToolUse code reviewer)
- 3 MCP servers auto-configured (lean-ctx for smart file reading,
  Armory for the personal knowledge vault, Council for second-opinion
  AI consultations and design image generation — 6 tools; Gemini, GPT,
  and NVIDIA voices, each null-gated on its API key)
- A guided `/welcome` onboarding that personalizes itself via an
  interactive interview inside Claude Code (two tracks: Beginner / Adopter)
- Cross-platform installers — `setup.sh` (Mac) and `setup.ps1`
  (Windows) — sharing a single Node.js finisher for heavy lifting
- A documentation set: README, PRE-INSTALL, INSTALL, FIRST-SESSION,
  CHEATSHEET, WORKFLOWS, CLI-REFERENCE, WHAT-IS-THIS, UPDATING, plus
  upgrades/mac-daemons and recipes/cron-loop

## Current Status

**v2 shipped — branch feat/v2-build.**

v1 shipped April 2026 (design + implementation complete). v2 adds:
the Council MCP (6 tools, 3 voices), 5 new skills (uptospeed,
audit-internal, armory-cost, speak, verify), two-track /welcome
(Beginner / Adopter routing), 7 additional Armory seed notes,
PRE-INSTALL pre-flight doc, bulletproof unattended install (Desktop
error report + PATH self-heal), optional Mac daemon templates (9
launchd plists in templates/launchd/), a cron-loop recipe, and
GitHub Actions CI (.github/workflows/install.yml).

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
   Routes by coding-experience answer. Two tracks:
   - **Track A (Beginner)** — full identity + focus + working-style
     interview, seeds memory, transitions to first braindump. Inner
     three-path projects fork: "I have specific projects in mind" /
     "I'm exploring, help me think it through" / "I don't know yet,
     learn as I go" (triggers the self-learning Armory mode).
   - **Track B (Adopter)** — faster orientation covering what's new
     vs Claude.ai, a path branch (bring existing project vs build a
     daily workflow), and concrete next actions. No braindump.
4. **Documentation** — README, PRE-INSTALL, INSTALL, CHEATSHEET,
   FIRST-SESSION, WORKFLOWS, CLI-REFERENCE, WHAT-IS-THIS, UPDATING,
   plus upgrades/mac-daemons and recipes/cron-loop. Written for
   newcomers, no jargon assumptions, generic examples only.
5. **Content payload** — templates, skills, hooks, MCP server source,
   10 seed Armory notes (3 original v1 + 7 new v2 additions), and a
   System-Manifest cheatsheet template.

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
7. **`/welcome` paths:** three (A/B/C), including "I don't know yet,
   learn as I go" — the self-learning mode is a first-class feature,
   not a fallback (these three paths are the inner projects fork,
   preserved within Track A)
8. **Seed Armory notes:** ship three generic starter notes (subject
   to pre-publish review)
9. **Directory name:** `Claude-Code-Starter-Kit`
10. **Repo:** `CAdidas333/claude-code-starter-kit` (public)

## v2 Additions (2026-06-27)

1. **Council MCP** — 6 tools: `council_consult`, `council_code_review`,
   `council_save`, `council_status`, `council_design_generate`,
   `council_design_review`. Gemini, GPT, and NVIDIA voices; each
   null-gated on its API key (absent key = voice absent, never errors).
   Config: `~/.claude/council-config.sh`.
2. **Skills expanded to 17** — added: `uptospeed`, `audit-internal`,
   `armory-cost`, `speak`, `verify`.
3. **Two-track `/welcome`** — top-level routing question; Track A
   (Beginner) + Track B (Adopter). The v1 three-path projects fork is
   preserved inside Track A.
4. **Seed Armory notes** — 10 total (3 original + 7 new: rewind-discipline,
   boris-cherny-claude-md, feature-completion-subtractive-pass,
   idempotency-keys, adhd-prompts-kit, jsonl-transcript-debugging,
   recoverable-delete-safety-net).
5. **PRE-INSTALL.md** — browser-only pre-flight doc (Windows + Mac
   tracks); read before running setup.
6. **Bulletproof install** — Desktop diagnostic report
   (`starter-kit-broke-<ts>.txt`) on unrecoverable failure; PATH
   self-heal (re-exec in fresh shell when `claude` not on PATH after
   install); friendly exits don't trigger the report.
7. **Mac power upgrade** — `docs/upgrades/mac-daemons.md` + 9 opt-in
   launchd daemon templates in `templates/launchd/`. Run after first
   session, not during install.
8. **Cron loop recipe** — `docs/recipes/cron-loop.md` +
   `templates/cron-loop-starter-routine.json`.
9. **GitHub Actions CI** — `.github/workflows/install.yml` smoke-tests
   the installer on real macOS + Windows runners.
