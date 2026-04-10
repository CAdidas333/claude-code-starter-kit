---
updated: 2026-04-10
tags: [active, context]
---

# Active Projects

Tracks active work **within the Claude Code Starter Kit project itself**.
(Not a cross-project tracker — this kit is an island.)

## Current Phase: Design → Implementation Planning

| Task | Status | Notes |
|------|--------|-------|
| Brainstorming + design | ✓ Complete 2026-04-10 | Sections 1-5 approved |
| Design doc written | ✓ Complete 2026-04-10 | Stored privately outside this repo |
| Project directory bootstrapped | ✓ Complete 2026-04-10 | You're reading it |
| Brain wiring (Dashboard, summary, architecture) | ✓ Complete 2026-04-10 | Private |
| Public GitHub repo created | ✓ Complete 2026-04-10 | CAdidas333/claude-code-starter-kit |
| Implementation plan | TODO | Via superpowers:writing-plans skill |
| Implementation plan review | TODO | Maintainer approves before any kit content is written |
| Phase 1 build — infrastructure | TODO | setup.sh, setup.ps1, finish-setup.js, directory structure |
| Phase 2 build — skills | TODO | Sanitize and import the 11 existing skills + write /welcome |
| Phase 3 build — docs | TODO | README (full), INSTALL, CHEATSHEET, FIRST-SESSION, WORKFLOWS, CLI-REFERENCE, WHAT-IS-THIS, UPDATING |
| Phase 4 — Armory MCP vendoring | TODO | Bundle the Armory MCP server source, sanitize, verify it builds from this repo |
| Phase 5 — command verification | TODO | Live `/help` walkthrough to verify every documented CLI flag and slash command exists |
| Pre-publish sanitization review | TODO | Line-by-line approval of every scrubbed file, diff view, explicit go-ahead |
| Kit goes live | TODO | After pre-publish review passes |
| First alpha handoff | TODO | Private alpha testers first, public link second |
| Public announcement | TODO | When alpha feedback is in |

## Blockers / Open Questions

- Whether to use `CAdidas333` GitHub account long-term or transfer
  the repo to a brand-specific account later (deferrable, low-stakes,
  30-second operation)
- Which built-in commands (`/voice`, `/rc`, `/fast`, `/powerup`, etc.)
  and launch flags need verification on the maintainer's live Claude
  Code install — addressed by Phase 5 command walkthrough

## Not Doing (Decided 2026-04-10)

- Comms / Nerve Center — premature for single-thread newcomers; may
  ship as a separate "expansion pack" skill later
- Full sanitized mirror of the maintainer's brain — only the
  generalizable parts ship
- Shipping the maintainer's existing System-Manifest.md cheatsheet —
  writing a fresh, generic `CHEATSHEET.md` from scratch instead
- Wispr Flow bundling — recommended externally only (it's paid and
  account-bound)
- Council MCP — requires external API keys and is too complex for a
  newcomer install
- Auto-launching Claude Code from the installer (Model 3 from design
  discussion) — too fragile across platforms; user runs `claude`
  manually after setup finishes
