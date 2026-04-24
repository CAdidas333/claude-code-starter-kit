---
name: scout
description: Autonomous Armory research agent — scans for new Claude Code tools, skills, MCPs, and techniques. Compares against current inventory. Auto-ingests what's relevant.
effort: medium
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, Agent
---

# Armory Scout — Autonomous Research Agent

Scan the landscape for new Claude Code tools, skills, and techniques. Compare against what we already have. Ingest what makes us better.

This skill is designed to run autonomously on a schedule (e.g., twice daily) via `claude schedule` or a cron trigger. It can also be invoked manually with `/scout`.

---

## Step 1: Load Current Inventory

Read the current state of the Armory to know what we already have:

```bash
# Get list of all existing note titles and URLs to avoid duplicates
grep -r "^source_url:" ~/Projects/_brain/Armory/Notes/ 2>/dev/null | sed 's/.*source_url: //'
```

Also read any cheatsheets that describe the current tool inventory:
- `~/Projects/_brain/Armory/Cheatsheets/Claude-Code.md` (if it exists)
- `~/Projects/_brain/Armory/Cheatsheets/Tools.md` (if it exists)
- `~/Projects/_brain/Armory/Cheatsheets/System-Manifest.md` (if it exists)

Build a mental inventory of: what tools/skills/MCPs do we currently use or know about?

If the Armory is empty (brand-new kit install), just note "Empty inventory" and scout will behave as a fresh crawl.

## Step 2: Search for New Developments

Use WebSearch to scan multiple sources. Focus on content from the **last 24 hours** to avoid re-finding old content.

### Search queries (run all in parallel via Agent subagents):

**Agent 1 — Anthropic Official:**
- WebSearch: `"claude code" new release OR update OR feature site:anthropic.com` (last 24h)
- WebSearch: `"claude code" changelog OR announcement site:docs.anthropic.com` (last 24h)

**Agent 2 — GitHub Trending:**
- WebSearch: `"claude code" github new repo OR tool OR skill OR mcp` (last 24h)
- WebSearch: `site:github.com "claude-code" OR "claude code" skills created:>YESTERDAY_DATE` (last 24h)

**Agent 3 — Community Content:**
- WebSearch: `"claude code" new tool OR skill OR mcp youtube OR reddit` (last 24h)
- WebSearch: `"claude code" tips OR tricks OR workflow reddit.com/r/ClaudeAI` (last 24h)

Replace `YESTERDAY_DATE` with yesterday's date in YYYY-MM-DD format.

Each agent should return a list of findings with: title, URL, one-line description, source type.

## Step 3: Filter and Deduplicate

For each finding from Step 2:

1. **Dedup check:** Compare the URL against existing note `source_url` values. If already ingested, skip it.
2. **Title similarity check:** If the title closely matches an existing note title, skip it (same content, different URL).
3. **Relevance pre-screen:** Based on title and description alone, would this score 3+ relevance for the user's active projects? Read `~/Projects/_brain/Dashboard.md` to know what those projects are. If not relevant, skip.
4. **Recency check:** Is this actually new content (last 24-48 hours)? Old content repackaged as new is noise.

Target: **3-5 items max** per run. Quality over quantity. The Armory is not a library.

## Step 4: Ingest Top Findings

For each item that passes filtering:

1. Run the full ingestion pipeline. Since this is an autonomous run, execute the /ingest skill steps directly:
   - Extract content (yt-dlp for YouTube, WebFetch for articles, etc.)
   - Summarize and categorize
   - Generate Implementation Blueprint if relevance 4+
   - Create the note
   - Update cheatsheet
   - **Auto-execute Tier 1 implementations immediately**

2. Track what was ingested for the summary report.

## Step 5: Report

Output a consolidated summary at the end of the run:

**If items were found and ingested:**
```
Armory Scout Report — [DATE] [AM/PM]

Found [N] new items worth ingesting:

1. [Title] — [one-line summary] (Relevance: X/5)
   [Tier/action: "Auto-implemented" OR "New skill available: ..." OR "Action needed: ..."]

2. [Title] — ...

[N] items scanned, [M] passed filters, [K] already known.

Nothing you need to do — [or specific actions if Tier 4].
```

**If nothing new was found:**
```
Armory Scout Report — [DATE] [AM/PM]

Scanned [N] sources. Nothing new worth ingesting. Current inventory is up to date.
```

Keep it concise.

If the user has configured an iMessage-sending script at `~/Projects/Armory/scripts/imessage-send.sh` or similar, also send the consolidated report there. If no script is configured, skip the notification silently — the report on stdout is enough.

## Step 6: Clean Up

```bash
rm -f /tmp/armory_sub* /tmp/armory_audio* /tmp/armory_transcript* /tmp/armory_slide* 2>/dev/null
```

---

## Rules

- **Max 5 ingestions per run.** Quality over quantity. If you find 10 interesting things, pick the 5 most relevant.
- **Dedup is non-negotiable.** Never ingest something we already have under a different URL.
- **Relevance 3+ only.** Don't ingest content just because it mentions Claude Code. It must be applicable to the user's projects or workflow.
- **One consolidated report per run.** Don't spam.
- **Tier 1 auto-execute.** If a finding is a direct improvement to something we do (like a better extraction tool), implement it immediately. That's the whole point.
- **Budget consciousness:** This can run twice daily. Keep search queries focused and limit to 3-5 ingestions max. Don't spider the entire internet.
- **No hallucinated tools.** Every finding must have a real URL. Verify before ingesting.
