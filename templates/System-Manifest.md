---
tags: [cheatsheet, system-manifest]
updated: 2026-06-26
aliases: [System Manifest, Setup Manifest]
---

# System Manifest — [Your Name]'s Claude Code Setup

> What is installed, what it does, when it fires. Update this file as you add skills, agents, and MCP servers. This document is the living inventory of your setup.

## Custom Skills (~/.claude/skills/)

| Skill | Purpose | Invocation |
|-------|---------|-----------|
| /today | Daily briefing across all projects — priorities, status, tips | `/today` |
| /ingest | Ingest a URL (video, article) into your Armory knowledge vault | `/ingest <url>` |
| /wrap | End-of-session cleanup: context update, commit, push | `/wrap` |
| /uptospeed | Catch up a new session from prior context and handoff notes | `/uptospeed` |
| /new-project | Create a new project with full context scaffold and git setup | `/new-project` |
| /scout | Scan for new Claude Code tools, skills, and techniques | `/scout` |
| /investigate | Verify claims from ingested notes — VERIFIED or DEBUNKED | `/investigate <slug>` |
| /digest | Generate a weekly knowledge digest from your Armory | `/digest` |
| /audit | Check adoption rate of Armory knowledge across all projects | `/audit` |
| /audit-internal | Internal consistency audit of your Armory vault | `/audit-internal` |
| /morning-brief | Daily email triage and calendar briefing | `/morning-brief` |
| /status-report | Printable HTML status report with scoreboard | `/status-report` |

## Custom Agents (~/.claude/agents/)

| Agent | Purpose | When |
|-------|---------|------|
| context-updater | Syncs MASTER_CONTEXT, ACTIVE_PROJECTS, SESSION_LOG for each project | End of every session (mandatory) |
| brain-updater | Updates cross-project Dashboard.md with current status | After context-updater if project status changed |

## MCP Servers

| Server | Tools | Status |
|--------|-------|--------|
| armory | armory_search, armory_briefing, armory_cheatsheet, armory_stats, armory_send_message | Connected |
| council | council_consult, council_code_review, council_design_generate, council_design_review | Connected |

_Add your own rows as you wire up additional MCP servers._

---

## Operational Wisdom

> Non-automatable principles that shape how Claude thinks and works. These are judgment calls — they cannot be encoded as settings or skills.

### Planning
- **Plan mode first.** Before touching any code, write the plan. If something changes mid-task, stop and replan — do not push through.
- **Vertical slices over horizontal layers.** Ship end-to-end slices with testable checkpoints rather than completing all database work, then all API work, then all frontend work in sequence.
- **Design discussions are highest leverage.** A ~200-line design doc before 2000 lines of code saves more time than any other habit.
- **Aim for 2–3× productivity, not 10×.** Near-human quality at 2–3× is more valuable than slop at 10×. Speed that produces correct output beats speed that produces rework.

### Coding
- **Micro-tools beat monoliths.** Ten focused tools that each do one thing well beat one big platform that does everything poorly.
- **Prove it works.** Never mark a task as done without running tests or checking actual output.
- **Feature-completion subtractive pass.** After finishing a feature, run `/simplify` or ask Claude: *"Find every piece of dead code, duplicate logic, unused components, or unnecessary complexity you just added."* It finds something every time. Run this at feature-close-time — the per-edit code-reviewer hook misses cross-file cruft.
- **Recoverable-delete safety net.** `brew install trash` + `alias rm='trash'` in `~/.zshrc` so an auto-approved agent that deletes the wrong file lands it in `~/.Trash/` instead of obliterating it.
- **Idempotency keys on mutating endpoints.** Every POST/PUT/DELETE should accept an `Idempotency-Key` header; server caches `(key → response)` for 24h and never touches the database twice for the same logical request.

### Context Management
- **Quality degrades at ~40% context fill.** Keep sessions under 40% for best reliability. Auto-compact is set at 75% as a backstop — do not rely on it as the primary management strategy.
- **`/rewind` (double-tap Esc) on failed attempts.** Never say "try again" after a failure — the broken code stays in context forever and pollutes every future turn. Rewind and restate instead.
- **CLAUDE.md loads every session — keep it tight.** Target ~200 lines. Move specialized instructions to skills or context files loaded on demand. Treat each entry as a binding behavioral constraint, not a suggestion.
- **Crash recovery via JSONL transcripts.** When `/resume` fails, read the prior session directly from `~/.claude/projects/<slug>/<session-id>.jsonl`. Full prompts, tool calls, and thinking blocks are persisted on disk.
- **Convert inputs to markdown before ingesting.** HTML→MD saves ~90% tokens; PDF→MD saves 65–70%. Do this before pasting large documents into context.

### Skill Design
- **Three layers per skill: description, instructions, tools.** The tools layer (scripts, API calls, reference files) is where leverage lives — most people invest only in the first two and wonder why skills keep regenerating the same boilerplate.
- **Save scripts inside skills.** If Claude keeps regenerating the same bash or Python snippet, lift it into a script in the skill's folder. Deterministic, cheaper, faster than re-deriving every session.
- **Composable beats monolithic.** Break large skills into focused ones that call each other. Failures are localized; improvements compound across every workflow that uses the shared sub-skill.
- **Post-use refinement habit.** After every imperfect skill run, ask: *"Is this a one-time fix, or should this rule live in the skill forever?"* If forever, update the skill immediately. This is what produces compounding improvement over time.

### Working Preferences
- **Codify expertise as skills before building automation on top.** A well-defined skill is a unit of captured judgment that runs reliably. Automation built on top of implicit behavior is brittle.
- **Start with pain, not capabilities.** "What do I wish I didn't have to do?" is the right question. Capabilities without friction to solve are toys.
- **80/20 split.** Automate the routine 80%, stay in the loop for the judgment 20% that actually requires your expertise.
- **Build first, explain as you go.** Momentum matters more than a perfect briefing before each step. Adjust course mid-flight rather than planning everything upfront.
- **Skills compound.** One well-built skill can replace 40 hours of recurring manual work across a year of use.

### Observability
- **Debug skills from the JSONL transcript, not from memory.** Open `~/.claude/projects/<slug>/<session>.jsonl`, find the skill invocation, scan tool calls and thinking blocks to locate the exact turn where execution diverged from `SKILL.md`, then fix that step.
- **Assign a model per skill.** Do not default to the most capable model for everything. Route expensive models to synthesis and reasoning tasks; use smaller models for search, triage, and summarization.
- **Self-awareness prompting to grow the tool stack.** Before doing something manually, ask: *"What tool, MCP, or CLI would let you do this autonomously?"* It surfaces capabilities from real friction — not speculative installs.

### External Models (Advisory)
- External model reviews (Council, Codex, Gemini) are advisory only. Verify every suggestion against your live codebase before applying — their training data may predate your architecture decisions.
- Cross-model review catches blind spots. Generate with one model, review with another.

---

## Live Systems (Daemons)

See `docs/upgrades/mac-daemons.md` for the full daemon setup guide — launchd plists, scheduling, log paths, and the watcher that auto-ingests URLs. Daemons are optional Mac-specific infrastructure surfaced via the upgrade path, not installed by the base kit.
