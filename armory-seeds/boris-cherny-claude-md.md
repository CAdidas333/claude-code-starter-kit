---
title: "Keep CLAUDE.md Tight — Every Byte Loads Every Session"
source: starter-kit-seed
date_ingested: 2026-06-26
category: claude-code
tags: [claude-md, configuration, context-management, session-startup, instructions]
relevance_score: 5
related_projects: []
status: processed
investigation_status: not-needed
aliases: [CLAUDE.md discipline, project instructions, session startup cost, boris cherny rules]
---

# Keep CLAUDE.md Tight — Every Byte Loads Every Session

## TL;DR
CLAUDE.md loads on every single session startup — every byte of bloat is paid repeatedly. Keep it under ~200 lines, move specialized instructions to skills or context files loaded on demand, and treat each entry as a binding behavioral constraint, not a suggestion.

## Key Takeaways
- **Every line costs tokens on every session.** CLAUDE.md is not a notes dump — it is the always-on session contract. Bloat compounds across every session you run.
- **Target: ~200 lines / ~2K tokens.** Beyond that, the runtime cost of loading it every session exceeds the value of most entries.
- **Move specialized instructions out.** Long language or framework rules belong in dedicated context files. Complex workflows belong in skills. Reference material belongs in brain/context docs loaded on demand.
- **Treat it as a contract, not suggestions.** "Plan mode first" and "prove it works" belong here. "Here are my thoughts on testing strategy" does not.
- **Self-improvement loop.** Capture lessons from sessions in a `LESSONS.md` file rather than packing accumulated learnings into CLAUDE.md itself. Load that file explicitly when starting a new session on a project.

## Actionable for your projects
- Audit your CLAUDE.md for entries that are: never consulted, project-specific content that belongs in a context doc, or better expressed as a skill prompt.
- Move large code-style guides and framework-specific rules to `docs/context/` files, referenced from CLAUDE.md with a one-line pointer.
- Keep CLAUDE.md entries as behavioral rules ("always plan before coding") rather than documentation ("here is how the project is structured").
- If CLAUDE.md exceeds 200 lines, cut it — the token savings per session add up faster than you expect.
