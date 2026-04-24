---
name: investigate
description: Investigate claims and tools from ingested Armory notes. Verifies repos exist, checks compatibility, and produces implementation plans.
effort: high
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
---

Investigate claims and tools from ingested Armory notes. Verifies repos exist, checks compatibility, and produces implementation plans.

**Usage:**
- `/investigate <note-slug>` — Investigate a specific note (filename without .md)
- `/investigate` — Investigate the oldest note with `investigation_status: pending`
- `/investigate --batch` — Investigate up to 3 pending notes sequentially
- `/investigate --status` — Show investigation pipeline status (pending/investigated/skipped counts)

---

## Step 1: Determine Target

Check the skill args:

- **If a slug/filename is provided:** Find the note at `~/Projects/_brain/Armory/Notes/{slug}.md` (try with and without .md extension). If not found, search for partial matches.
- **If `--batch` is provided:** Find ALL notes with `investigation_status: pending` in their frontmatter. Process up to 3, oldest first (by `date_ingested`). After each, return to this step for the next.
- **If `--status` is provided:** Count notes by investigation_status (pending, investigated, skipped, none). Display summary and stop.
- **If no args:** Find the FIRST note with `investigation_status: pending` (oldest by date_ingested). If none pending, tell the user and stop.

If the target note has `investigation_status: investigated`, warn the user and ask if they want to re-investigate. Proceed if they confirm.

## Step 2: Read and Parse the Note

Read the full note from `~/Projects/_brain/Armory/Notes/`. Extract:

- **Key Takeaways** section (bullet points)
- **Actionable for Your Projects** section
- **Full Summary** section
- Frontmatter: `category`, `tags`, `relevance_score`, `related_projects`, `source_url`
- **Source Transcript** (for context on ambiguous claims — skim, don't analyze line by line)

## Step 3: Extract Investigable Items

Analyze the note content and extract a structured list of **investigable items** — concrete, verifiable things. Classify each:

| Type | What to Look For | Priority |
|------|-----------------|----------|
| **TOOL** | Named tools, repos, packages, services, MCPs, extensions | Highest |
| **CONFIG** | Settings, flags, config values, environment variables | High |
| **TECHNIQUE** | Named methodologies, frameworks, workflows, patterns | Medium |
| **NUMERIC** | Star counts, performance claims, benchmarks, percentages | Low |
| **COMPAT** | Platform claims, version requirements, integration claims | Medium |

**Rules:**
- Cap at **5 items per note** (budget control)
- Prioritize TOOL items — they are the most concretely verifiable
- Skip vague advice ("write better prompts", "use sub-agents more")
- Skip items that are clearly just opinions without verifiable claims
- If a note has fewer than 2 investigable items, set `investigation_status: insufficient` on the note and skip

For each item, write down:
1. The item name/identifier
2. What the note claimed about it
3. The claim type (TOOL/CONFIG/TECHNIQUE/NUMERIC/COMPAT)
4. What source to check first

## Step 4: Investigate Each Item

For each item, follow the appropriate verification ladder. Stop as soon as you have enough evidence for a verdict.

### For TOOL/REPO Items:

**4a. Existence Check**
Use WebSearch to find the tool:
```
WebSearch: "{tool name} github {author if mentioned}"
```
Does the repo/package exist? Get the actual URL.

**4b. Vitals Check**
Use WebFetch on the GitHub repo page or package registry:
- Star count (compare to claim)
- Last commit date (is it maintained? commit in last 90 days = active)
- Open issues count
- License (MIT/Apache = good, proprietary = flag it)
- Language/runtime

**4c. Installability Check**
Run in bash (quick checks, no actual installs):
```bash
brew search {tool} 2>/dev/null | head -5
npm search {tool} 2>/dev/null | head -5
pip index versions {tool} 2>/dev/null | head -3
which {tool} 2>/dev/null
```
If not in package managers, check the README for install instructions via WebFetch.

**4d. Compatibility Check**
From the README/docs, verify:
- Works on the user's platform (check macOS / Linux / Windows as applicable)?
- Runtime version requirements (Node.js, Python, etc.)?
- Any heavy dependencies (Docker, databases, cloud services)?
- API keys required? Paid service? Free tier?

**4e. Stack Fit Assessment**
Does it map to the user's tech stack? Read `~/Projects/_brain/Dashboard.md` and the `docs/context/MASTER_CONTEXT.md` of each active project to find the real tech stacks in play. Don't assume — look.

### For CONFIG Items:

**4a. Documentation Check**
```
WebSearch: "claude code {setting name}" OR "anthropic {setting name} documentation"
```
Use WebFetch on the most relevant result (official docs preferred).

**4b. Local Verification**
```bash
grep -r "{setting}" ~/.claude/settings.json 2>/dev/null
grep -r "{setting}" ~/Projects/*/CLAUDE.md 2>/dev/null
```
Is it already in use? Does the setting actually exist in the current version?

### For TECHNIQUE Items:

**4a. Source Credibility**
```
WebSearch: "{technique name} {attributed source}"
```
Is this from Anthropic, a major engineering blog, peer-reviewed research, or a random content creator?

**4b. Cross-Reference**
Search existing Armory notes for corroboration:
```bash
grep -rl "{technique keywords}" ~/Projects/_brain/Armory/Notes/*.md 2>/dev/null
```
Do multiple independent sources agree?

### For NUMERIC Claims:

**4a. Source Verification**
```
WebSearch: "{exact claim}" OR "{tool name} benchmark"
```
Find the original data source. Is it from the tool's own marketing, or independent testing?

### For COMPAT Claims:

**4a. Version/Platform Check**
```
WebSearch: "{tool} {target platform} compatibility"
WebFetch: Release notes or requirements page
```

## Step 5: Assign Verdicts

For each investigated item, assign ONE verdict:

### VERIFIED + PLAN
The claim checks out AND it's useful for the user's projects. Requirements:
1. It exists and works (repo real, maintained, installable)
2. Compatible with the user's platform
3. Maps to at least one of the user's projects
4. Effort is justified (benefit > setup cost)
5. No blocking prerequisites (missing API keys, paid services without free tier)

### VERIFIED (NO ACTION)
The claim is true but:
- Doesn't apply to the user's tech stack or projects
- Already in use (check with grep)
- Too much effort for marginal benefit
- Requires infrastructure the user doesn't run

### DEBUNKED / STALE
- Repo doesn't exist or was deleted
- Star count wildly inflated in the claim
- Last commit > 6 months ago with open issues (abandoned)
- Doesn't work on the user's platform
- Requires paid service with no free tier (and claim didn't mention this)
- Performance claims not reproducible or from marketing only

### INSUFFICIENT EVIDENCE
- Can't find enough information to verify
- Tool is too new to evaluate
- Ambiguous claim that resists verification

## Step 6: Generate Implementation Plans

For each **VERIFIED + PLAN** item, generate a concrete implementation plan:

```markdown
#### Implementation Plan for {Project Name}
**What:** {one-sentence description of what this enables}
**Effort:** {Low (<15 min) / Medium (15-60 min) / High (1+ hours)}
**Risk:** {Low / Medium / High} — {why}

Steps:
1. {Specific command or action — use actual file paths from the user's system}
2. {Next step}
3. {Verification step — how to know it worked}

**Prerequisites:** {any deps that need to be installed first, or "None"}
```

Be specific. Reference actual paths (`~/Projects/<project-name>/`, `~/.claude/settings.json`, etc.). Include install commands. Include a verification step.

## Step 7: Write Investigation Report

Create the report at: `~/Projects/_brain/Armory/Investigations/{date}_inv_{original-note-slug}.md`

Use this structure:

```markdown
---
title: "Investigation: {original note title}"
source_note: "[[{original note filename without .md}]]"
date_investigated: {YYYY-MM-DD}
items_investigated: {count}
verdict_verified_plan: {count}
verdict_verified_no_action: {count}
verdict_debunked: {count}
verdict_insufficient: {count}
tags: [investigation, armory, {category}]
---

# Investigation: {Original Note Title}

> Source: [[{original note filename without .md}]] | Investigated: {date}

## Executive Summary
{2-3 sentences: how many items investigated, what passed, what's actionable. Be direct.}

## Findings

### {Item Name} — VERIFIED + PLAN
- **Claim:** {what the note said}
- **Reality:** {what investigation found — specific evidence}
- **GitHub:** {url} | Stars: {actual count} | Last commit: {date} | License: {license}
- **Install:** `{one-liner command}`
- **Effort:** {Low/Medium/High}
- **Cost:** {Free / $X/mo / requires API key}

#### Implementation Plan for {Project}
**What:** {one-sentence}
**Effort:** {level}

1. {Step with actual path}
2. {Step}
3. {Verification}

---

### {Item Name} — VERIFIED (NO ACTION)
- **Claim:** {what the note said}
- **Reality:** {confirmed, but...}
- **Why no action:** {specific reason}

---

### {Item Name} — DEBUNKED
- **Claim:** {what the note said}
- **Reality:** {what's actually true — cite evidence}

---

### {Item Name} — INSUFFICIENT EVIDENCE
- **Claim:** {what the note said}
- **Issue:** {why verification failed}

---

## Action Items
- [ ] {Highest-priority VERIFIED+PLAN item — specific action}
- [ ] {Second priority}
...
```

## Step 8: Update Source Note

Edit the original note's YAML frontmatter. Add these fields (after the existing `status: processed` line):

```yaml
investigation_status: investigated
investigation_date: {YYYY-MM-DD}
investigation_report: "[[{report filename without .md}]]"
verified_items: {count of VERIFIED+PLAN}
actionable_items: {count of items with implementation plans}
debunked_items: {count of DEBUNKED}
```

Do NOT change any existing frontmatter fields — only add the new investigation fields.

## Step 9: Report to Terminal

Tell the user:
- Note investigated and report location
- Executive summary (2-3 sentences)
- Count of each verdict type
- Top actionable item if any
- If batch mode: how many remaining, then loop to Step 1

---

## Rules

- NEVER install tools during investigation — only check if they CAN be installed
- NEVER modify code during investigation — only produce plans
- Cap at 5 items per note — prioritize TOOL items over others
- If WebSearch or WebFetch fails for an item, mark it INSUFFICIENT EVIDENCE and move on
- Be honest in verdicts — don't inflate relevance to make the investigation look productive
- Star counts from claims should be compared to actual GitHub counts — note discrepancies > 20%
- "Maintained" means commit in last 90 days. 90-180 days = "aging". 180+ days = "stale"
- Use today's ACTUAL date, not a placeholder
- For batch mode, process oldest-pending-first (FIFO)
- If a note has already been investigated, the report filename uses today's date (re-investigation creates a new report)
- WebFetch GitHub READMEs can be very long — focus on: install section, requirements, first 200 lines
- When checking installability, do NOT run `pip install`, `npm install`, or `brew install` — only search/check
