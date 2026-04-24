---
title: Plan Mode First
source: Claude Code Starter Kit seed note
ingested: 2026-04-10
topics: [claude-code, workflow, planning]
related_projects: []
---

# Plan Mode First

## Key Insight

**Press `Shift+Tab+Tab` before you start any non-trivial task.** Plan Mode is the single most valuable feature in Claude Code, and most new users don't know it exists.

## What Plan Mode does

Plan Mode is a state where Claude **thinks out loud about your problem before touching any files**. It produces a written plan — what it's going to do, in what order, with what trade-offs — and shows it to you for approval. You can edit the plan, push back on it, ask for alternatives, or approve it to execute.

Without Plan Mode, Claude defaults to "helpful doing mode" — it dives in, starts writing code, and you discover the approach only after files have changed. Plan Mode inverts that: **decide first, act second.**

## When to use it

Always, for any task where:
- You'd struggle to undo the changes
- You aren't 100% sure of the approach
- There are multiple valid ways to solve the problem
- You're touching unfamiliar code
- The stakes are higher than "throwaway prototype"

The mental cost of Plan Mode is 60 seconds of reading. The mental cost of undoing wrong code is an hour of "why did it do that?" followed by a frustrated git reset.

## How to apply it

1. Type your prompt
2. **Before hitting Enter, press `Shift+Tab+Tab`** — Claude's indicator changes to show Plan Mode is on
3. Send the prompt
4. Claude writes a plan instead of code
5. Read the plan. Push back on anything that looks wrong. Ask "what about X?"
6. When the plan is right, tell Claude to proceed — it switches to execute mode and does the work

## The superpower

The real value of Plan Mode isn't just "safer code." It's that **you learn what Claude thinks your problem is**. When the plan is subtly wrong, the fix isn't "better code" — it's "better understanding of the problem." You catch the misunderstanding BEFORE the bad code exists, not after.

This saves more time than any other habit in the kit.

## Related

- `/today` — daily brief uses your Armory to pre-load relevant context before you start planning
- Plan Mode is different from the `superpowers:writing-plans` skill, which is a longer-form plan document. Both are useful for different scopes.
