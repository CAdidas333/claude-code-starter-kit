---
title: "JSONL Transcript Debugging — Read the Session File When Skills Go Wrong"
source: starter-kit-seed
date_ingested: 2026-06-26
category: claude-code
tags: [debugging, jsonl, transcripts, skills, session-recovery, crash-recovery]
relevance_score: 5
related_projects: []
status: processed
investigation_status: not-needed
aliases: [jsonl debugging, transcript recovery, session file, skill debugging, resume failure]
---

# JSONL Transcript Debugging — Read the Session File When Skills Go Wrong

## TL;DR
When a skill produces bad output or `/resume` fails after a crash, read the session `.jsonl` directly from `~/.claude/projects/<project-slug>/` — full prompts, tool calls, and thinking blocks are persisted on disk, letting you locate the exact step where things went wrong.

## Key Takeaways
- **Location:** `~/.claude/projects/<project-slug>/<session-id>.jsonl` — one file per session, per project. The slug is derived from the absolute path of the project directory.
- **What is in it:** every prompt, every tool call, every tool result, and (when thinking is enabled) the model's thinking blocks. The full reasoning chain is on disk even after the session ends.
- **When to use it:** (1) a skill produces unexpected output and you cannot tell which step deviated; (2) `/resume` fails to find the session in the picker after a crash; (3) you need to replay exactly what happened in a closed session.
- **How to use it:** open the file, find the skill invocation, scan through tool calls and thinking blocks to locate the exact turn where execution diverged from the skill's instructions, then fix that specific step in `SKILL.md`.
- **Also useful for:** cost analysis (count API calls per skill run to spot expensive outliers), building handoff context after a crash, and auditing what an autonomous agent actually did versus what it reported doing.

## Actionable for your projects
- When a skill output is wrong, do not re-reason about the prompt from memory — open the `.jsonl` and read what actually happened at each step.
- After a crash where `/resume` cannot find the session, start fresh and point Claude at the file: `"Read ~/.claude/projects/<slug>/<session-id>.jsonl and tell me where we left off."`
- After diagnosing a skill failure from the transcript, note the fix in `docs/context/LESSONS.md` so the pattern does not recur.
- Use the same file for session cost analysis — count tool calls and token volumes per skill to find expensive outliers before they accumulate.
