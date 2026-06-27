---
name: armory-cost
description: Per-session token consumption and estimated-cost report for Claude Code. Parses local JSONL session transcripts (no telemetry infrastructure required) to surface which sessions, projects, and daemons burn the most budget. Use when the user types /armory-cost, asks "what's costing the most", "token usage", "which daemon is expensive", or wants a cost breakdown across sessions.
effort: max
---

# /armory-cost — Token & Cost Observability

Closes the "which session/daemon is burning budget" blind spot for the Armory daemon fleet — **without** standing up OpenTelemetry, Prometheus, or Grafana. It reads the same usage data those tools would export, straight from Claude Code's JSONL session transcripts.

## What this skill does

Shows which Claude Code sessions and daemons are consuming the most tokens and estimated budget. It parses the JSONL session transcripts that Claude Code writes locally — no telemetry infrastructure required. Use it when you want to understand where your API costs are coming from or identify unexpectedly expensive sessions.

## What it does

Every Claude Code session writes a transcript to `~/.claude/projects/<project-slug>/<session-id>.jsonl`. Each assistant message carries a `message.usage` block with exact `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`, plus the `message.model`. This skill rolls those up per session, per model tier, and in total, and multiplies by published per-tier pricing for an estimated dollar cost.

**Token counts are exact** (pulled from the transcript). **Only the dollar figures are estimates** — they use the per-tier pricing in the `PRICING` dict at the top of `scripts/armory-cost.py`. If absolute dollars matter, verify those rates against current Anthropic pricing first.

## How to run

```bash
python3 ~/.claude/skills/armory-cost/scripts/armory-cost.py            # Armory project, all sessions
python3 ~/.claude/skills/armory-cost/scripts/armory-cost.py --all      # every project
python3 ~/.claude/skills/armory-cost/scripts/armory-cost.py --since 2026-05-01
python3 ~/.claude/skills/armory-cost/scripts/armory-cost.py --project my-project --top 10
```

The script prints a Markdown report (top sessions by cost, a by-model-tier breakdown, and a grand total). Render the report. If requested, text the top-5 token hogs via the Nerve Center iMessage path (`armory_send_message`).

## Steps when invoked

1. Run the script for the requested scope (default: Armory project, all sessions). For a fleet-wide view use `--all`.
2. Present the Markdown report. Lead with the single most expensive session and the grand total.
3. Call out anything actionable: a daemon session that is disproportionately expensive, an unexpected Opus-tier run that should have been Sonnet (cross-check against the `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` setting), or a session with a huge cache-read share (usually fine — cache reads are cheap and mean good cache hygiene).
4. For a recurring view, this skill is a clean fit for a weekly scheduled run that texts the top hogs.

## Verification before trusting output

Per the project rule "built ≠ working": the first time this runs in a session, sanity-check one session's numbers against the raw JSONL (`grep -c '"usage"' <file>` ≈ message count in the report). The parser skips lines without a `usage` block (summaries, user turns, tool results), which is correct.

## Upgrade Path (optional — held pending the maintainer's decision)

The full OpenTelemetry "command center" (live dashboards, alerting) is a separate, heavier build (~half a day) and is **not** wired up by this skill:
- Env: `CLAUDE_CODE_ENABLE_TELEMETRY=1` + `OTEL_METRICS_EXPORTER=otlp` + `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317` (correct var is `CLAUDE_CODE_ENABLE_TELEMETRY`, **not** the `CLAUDE_CODE_OTLP_ENABLED` from the original note).
- Collector: clone `ColeMurray/claude-code-otel` (Docker Compose: collector + Prometheus + Grafana with prebuilt Claude Code dashboards).
- Do **not** set the OTLP env vars without a collector listening — Claude Code will retry a dead endpoint. This JSONL skill needs none of that and works today.

Reference: `_brain/Armory/Investigations/2026-05-26_inv_claude-code-opentelemetry-command-center.md`.
