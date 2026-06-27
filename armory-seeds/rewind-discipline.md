---
title: "Rewind Discipline — Drop Failed Attempts Instead of Continuing"
source: starter-kit-seed
date_ingested: 2026-06-26
category: claude-code
tags: [rewind, context-management, token-management, session-limits, workflow]
relevance_score: 5
related_projects: []
status: processed
investigation_status: not-needed
aliases: [rewind habit, context rot prevention, failed attempt recovery, double-esc]
---

# Rewind Discipline — Drop Failed Attempts Instead of Continuing

## TL;DR
When Claude fails a task, press Esc twice (`/rewind`) to drop the failed attempt instead of saying "try again" — the broken code stays in context forever and pollutes every subsequent turn.

## Key Takeaways
- **Tokens compound.** Claude re-reads the entire conversation on every turn. A failed attempt left in context keeps costing you with every follow-up message.
- **Context rot is real.** Failed code, abandoned approaches, and "try again" loops silently degrade retrieval accuracy and thinking depth as the session grows.
- **`/rewind` (double-tap Esc)** drops the failed attempt entirely. The built-in "summarize from here" option generates a handoff note if you want a partial record before rewinding.
- **Never say "try again" or "that didn't work, do it differently."** This extends context with junk. Rewind and restate instead — from before the bad prompt, not after it.
- **Session chaining.** For big tasks that span multiple attempts, write an explicit handoff summary, `/clear`, and paste the summary into a new session rather than continuing a polluted thread.

## Actionable for your projects
- Adopt `/rewind` (double-tap Esc) as your default failure-recovery reflex — not continuing forward with corrections.
- When Claude produces wrong output, rewind to the message before the bad prompt rather than correcting forward from the failure.
- Use the "summarize from here" option to generate a handoff note before rewinding on a long session.
- At ~40% context fill, consider a manual `/compact` with an explicit carry-forward list (decisions, constraints, open issues) before quality degrades.
