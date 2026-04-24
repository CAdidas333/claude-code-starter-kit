---
title: The 40% Context Rule
source: Claude Code Starter Kit seed note
ingested: 2026-04-10
topics: [claude-code, context-management, quality]
related_projects: []
---

# The 40% Context Rule

## Key Insight

**Claude's output quality starts degrading at around 40% context fill.** Not at 90%. Not at "compact triggered." At 40%. By the time your session is 60% full, you're already getting worse code than you would have in a fresh session — you just can't see it until you compare.

## Why this happens

Large language models don't attend uniformly across their context window. As the conversation grows, earlier content gets less "attention" per token, and subtle things start happening:

- Claude forgets constraints you set 30 messages ago
- File paths from earlier in the session get confused
- The mental model of "what's in scope" blurs
- Edge cases get missed because the reasoning bandwidth is split across more material

The model isn't "broken" at 50% fill — it just isn't as sharp as it was at 10% fill. The degradation is gradual and invisible unless you run a fresh session side-by-side and compare.

## How to apply it

### 1. Watch your status bar
Claude Code's status bar shows current context usage as a percentage. **Look at it.** If you're not sure where it is, type `/status`.

### 2. Know your breakpoints
- **Under 40%** — sharp. Default state. Don't worry.
- **40-60%** — still good for routine work, but start being deliberate. Don't dump large files into the conversation if you don't have to.
- **60-75%** — quality is meaningfully degraded. Finish what you're doing and wrap up. Don't start a new complex task here.
- **Over 75%** — auto-compact kicks in if configured. Even with compaction, you're on borrowed time.

### 3. Start new sessions more often than you think you should
**The anti-pattern:** "I'll just keep going, I'm on a roll." The roll feels real but the quality is quietly dropping.

**The better pattern:** at natural break points (finished a feature, got a test passing, got a review done), wrap the session with `/wrap` and start a fresh one. `/wrap` writes a handoff note so the next session picks up cleanly.

### 4. Don't fear compaction, don't depend on it
Auto-compact is a safety net, not a workflow. If you're relying on compaction to get through big tasks, you're already losing quality. Compaction throws away detail; it can't recreate sharp reasoning.

## The counterintuitive truth

**A fresh session with 20% context fill is almost always better than a long session with 60% fill**, even if the long session "knows more." The "knowing more" is offset by the reasoning degradation, and usually worse — the long session hallucinates confidence about things it used to be sure about.

When in doubt, wrap and restart. You'll miss the context for 30 seconds; you'll save yourself an hour of fixing subtle bugs that crept in near the end of a bloated session.

## Related

- `/wrap` — the clean way to end a session and hand off to the next one
- `/today` — fresh-session briefing that restores just enough context from your Brain to get back to work
