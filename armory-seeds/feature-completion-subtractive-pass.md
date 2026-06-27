---
title: "Feature-Completion Subtractive Pass — Delete What You Just Added"
source: starter-kit-seed
date_ingested: 2026-06-26
category: workflow
tags: [cleanup, dead-code, subtractive, vibe-coding, feature-completion, simplify, technical-debt]
relevance_score: 5
related_projects: []
status: processed
investigation_status: not-needed
aliases: [subtractive pass, feature cleanup, delete code prompt, simplify after feature]
---

# Feature-Completion Subtractive Pass — Delete What You Just Added

## TL;DR
After every feature, run a dedicated subtractive cleanup pass — ask Claude to find every piece of dead code, duplicate logic, unused components, or unnecessary complexity the feature introduced. It finds something every time.

## Key Takeaways
- **Adding is addictive; subtracting takes discipline.** AI-assisted features are fast to build but always leave residue: unused files, duplicate functions, abandoned scaffolding.
- **The prompt:** `"Find every piece of dead code, duplicate logic, unused components, or unnecessary complexity you just added to the project."` — Claude surfaces something on every run.
- **This is a distinct trigger point.** The per-edit code-reviewer hook fires at edit-time and catches localized issues. The subtractive pass fires at feature-close-time and catches cross-file duplication, unused imports, and orphaned helpers that single-edit review misses.
- **`/simplify` automates this.** The `/simplify` skill runs "review the changed code for reuse, simplification, efficiency, and altitude cleanups, then apply the fixes." Run it before calling a feature done.
- **The mess compounds.** Skip the cleanup pass once and it is fine. Skip it across ten features and you start losing comprehension of your own project.

## Actionable for your projects
- Before merging or declaring a feature done, run `/simplify` or the explicit dead-code prompt above.
- Add "subtractive pass" to your feature-completion checklist alongside tests and context doc updates.
- On long-running projects, run a periodic sweep — especially on helper scripts and config files added incrementally over many sessions.
- If `/simplify` is not installed, use the explicit prompt: `"Find every piece of dead code, duplicate logic, unused components, or unnecessary complexity this feature added, and remove it."`
