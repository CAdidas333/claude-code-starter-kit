---
name: ingest
description: Ingest a URL (YouTube, TikTok, article) into The Armory knowledge vault. Downloads transcript, summarizes with Claude, creates structured note in Obsidian.
effort: max
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, WebFetch
---

Ingest a piece of content into The Armory knowledge vault.

**Usage:**
- `/ingest <url>` — Process a single URL
- `/ingest` (no args) — Process the next unprocessed item from the inbox
- `/ingest --batch` — Process ALL unprocessed inbox items sequentially
- `/ingest --inbox` — Show current inbox status

---

## Step 1: Determine Input

Check the skill args:

- **If a URL is provided:** Use that URL directly.
- **If `--batch` is provided:** Read `~/Projects/_brain/Armory/Inbox-Queue.md`, find ALL lines matching `- [ ]`, and process each one sequentially. After each, return to this step for the next item.
- **If `--inbox` is provided:** Read `~/Projects/_brain/Armory/Inbox-Queue.md` and display the pending items. Do NOT process anything — just show the list and stop.
- **If no args:** Read `~/Projects/_brain/Armory/Inbox-Queue.md`, find the FIRST line matching `- [ ]`, extract the URL. If the inbox is empty, tell the user and suggest they provide a URL directly.

## Step 1.5: Dedup Check

Before processing, check if this URL (or closely related content) is already in the Armory:

```bash
grep -r "source_url:" ~/Projects/_brain/Armory/Notes/ 2>/dev/null | grep -i "<URL or domain/path fragment>"
```

Also search by likely title keywords using the Armory MCP if available:
```
Use armory_search with keywords from the URL or title.
```

**If already ingested:**
- Tell the user: "Already in the Armory — ingested on [date] as [note title]. Key takeaway: [from the existing note]."
- If the existing note has an Implementation Blueprint, remind the user of its status.
- Do NOT re-ingest. Stop here.

**If not found:** Proceed to Step 2.

## Step 2: Detect Source Type

Parse the URL to determine the source type:
- **youtube** — Contains `youtube.com/watch`, `youtu.be/`, or `youtube.com/shorts/`
- **tiktok** — Contains `tiktok.com/`
- **twitter** — Contains `twitter.com/` or `x.com/`
- **article** — Any other HTTP(S) URL
- **other** — Anything else (ask user what it is)

## Step 3: Extract Metadata & Content

### For TikTok:

TikTok posts can be videos OR photo/carousel posts. The carousel slides often contain the actual knowledge as image text. If the user has a TikTok extractor script available, use it. Otherwise, fall back to `yt-dlp` for metadata and audio.

- **If the post is a carousel (images):** Download each image and read it with the Read tool — Claude can see image content. Extract all visible text from each slide. Concatenate the text from all slides as the "transcript." This is CRITICAL — carousel slides often contain the actual knowledge (repo names, commands, instructions). The caption alone is not enough.
- **If the post is a video:** Use the caption as supplementary context, then proceed to audio transcription (Step 4).

### For YouTube:

```bash
yt-dlp --print title --print channel --print duration_string --print upload_date --no-download "<URL>" 2>/dev/null
```

This outputs 4 lines: title, channel, duration (HH:MM:SS), upload date (YYYYMMDD).

If this fails (e.g., for articles), proceed without metadata — use the page title from WebFetch instead.

## Step 4: Extract Transcript

### For TikTok Photo/Carousel Posts:

Download each image:

```bash
curl -sL "<image_url>" -o "/tmp/armory_slide_N.webp" 2>/dev/null
```

Then read each image file with the Read tool. Extract all visible text from each slide. Concatenate the text from all slides as the "transcript."

### For TikTok Video Posts:

The caption provides context but usually doesn't contain the full spoken content. For the full transcript, download audio and transcribe:

```bash
yt-dlp -x --audio-format wav -o "/tmp/armory_audio.%(ext)s" "<URL>" 2>&1
whisper-cli -m <path-to-whisper-model> -f /tmp/armory_audio.wav -otxt -of /tmp/armory_transcript 2>&1
```

The whisper-cli binary ships with the `whisper-cpp` Homebrew formula. Model paths vary by install — common locations include `/opt/homebrew/share/whisper-cpp/models/ggml-base.en.bin` on Apple Silicon.

### For YouTube:

Try auto-captions first (fast, no download needed):

```bash
yt-dlp --write-auto-sub --sub-lang en --sub-format vtt --skip-download -o "/tmp/armory_sub" "<URL>" 2>&1
```

This creates `/tmp/armory_sub.en.vtt`. Strip VTT formatting to get clean text:

```bash
# Clean VTT to plain text - remove headers, timestamps, positioning, and deduplicate
cat /tmp/armory_sub.en.vtt 2>/dev/null | grep -v "^WEBVTT" | grep -v "^Kind:" | grep -v "^Language:" | grep -v "^$" | grep -v "^[0-9][0-9]:[0-9][0-9]" | grep -v "^<" | grep -v "align:" | grep -v "position:" | sed 's/<[^>]*>//g' | awk '!seen[$0]++' > /tmp/armory_transcript.txt
```

If no captions are available, download audio and transcribe with whisper-cli as shown above.

### For Articles:
Use WebFetch to get the page content. Extract the main article text.

### For Twitter/X:
Use WebFetch to get the thread content.

**Read the transcript** from `/tmp/armory_transcript.txt` (or wherever it landed). If the transcript is longer than 5000 words, note that it's long but still read it all — you'll summarize it.

## Step 5: Summarize and Categorize (In-Session)

Now YOU (Claude, in the active session) analyze the transcript and generate:

### 5a. TL;DR
Write 1-2 sentences capturing the core value of this content.

### 5b. Key Takeaways
Extract 3-7 bullet points of the most useful, actionable information. Focus on:
- Specific techniques, commands, or configurations
- Tools or MCPs mentioned
- Patterns or workflows demonstrated
- Non-obvious insights

### 5c. Actionable Items
Map takeaways to the user's active projects where applicable. Read `~/Projects/_brain/Dashboard.md` to see what projects exist and what tech stacks they use, then write the actionable items against those real project names. If the dashboard doesn't exist yet, use the category `General` only.

### 5d. Category
Assign ONE category from the controlled vocabulary:
- `ai-coding` — General AI-assisted coding tips
- `prompt-engineering` — Prompt techniques, system prompts, context management
- `mcp` — Model Context Protocol servers, tools, patterns
- `claude-code` — Claude Code specific features, skills, hooks, commands
- `workflow` — Developer workflow, productivity, tooling setup
- `tools` — Specific tools, extensions, libraries
- `devops` — Deployment, CI/CD, infrastructure
- `design` — UI/UX, design patterns
- `business` — SaaS, pricing, marketing, business strategy
- `other` — Doesn't fit above

### 5e. Tags
Generate 3-7 freeform tags (lowercase, hyphenated). Be specific.

### 5f. Relevance Score
Rate 1-5 based on applicability to the user's active projects:
- **5** — Directly applicable RIGHT NOW to an active project
- **4** — Highly relevant to current tech stack or workflow
- **3** — Good to know, moderately applicable
- **2** — Interesting but tangential
- **1** — Low relevance to current work

### 5g. Related Projects
List any of the user's projects this applies to (pulled from the dashboard). If unsure, leave empty.

## Step 5.5: Implementation Blueprint (Relevance 4+ only)

If the relevance score is 4 or 5, generate a concrete Implementation Blueprint. This is NOT documentation — it's an action plan. The Armory exists to make the user better, not to file things away.

### Before writing the blueprint, search the Armory:
```
Use armory_search or armory_cheatsheet to check: do we already have this capability? Is this replacing something we do today?
```

### Generate the blueprint:

```markdown
## Implementation Blueprint
- **Tier:** 1 | 2 | 3 | 4
- **Type:** `auto-implement` | `skill-install` | `config-change` | `manual-action`
- **What changes:** One sentence — the specific improvement
- **Replaces:** What current approach this improves on (or "New capability" if novel)
- **Steps:**
  1. Specific, numbered, executable steps
  2. Include actual commands where applicable
  3. Include verification step
- **Priority:** `now` (implement this session) | `next-session` | `backlog`
- **Session requirement:** `immediate` (works now) | `next-session` (needs restart to load)
```

### Implementation Tiers:

**Tier 1 — Fully Automatic (the user never needs to think about it)**
Types: `auto-implement`, some `config-change` (CLAUDE.md)
Claude implements it and starts using it automatically. The user just notices things working better. Examples: new extraction scripts, improved processing logic, CLAUDE.md behavioral rules.

**Tier 2 — New Capability (the user gains a new tool to call)**
Types: `skill-install`, some `auto-implement`
Installs a new skill or tool that expands what's possible. Claude will auto-invoke when context matches, but the user can also call it directly.

**Tier 3 — Config/Settings (Transparent improvement)**
Types: `config-change` (settings.json, hooks)
Changes Claude's underlying behavior or environment. The user doesn't invoke anything — things just work differently.

**Tier 4 — User Must Act (Specific instructions provided)**
Types: `manual-action`
Something only the user can do — permissions, accounts, API keys, system settings.

### Decision rules:
- **Tier 1 + Priority `now`**: Execute immediately after creating the note. Don't just document — do it.
- **Tier 2 + Priority `now`**: Install the skill/tool now. It'll be available next session. Tell the user what they gained.
- **Tier 2 + Priority `next-session`**: Document the install command. Execute when the relevant project is active.
- **Tier 3**: Apply the config change now if safe. Tell the user it takes effect next session.
- **Tier 4**: Report full instructions. Don't proceed until the user confirms.
- **Freight train rule:** Don't install tools speculatively. Only implement things that solve a current pain point or replace a worse approach. Three good tools > thirty unused ones.

## Step 6: Create the Note

Generate a slug from the title (lowercase, hyphens, no special chars, max 50 chars).
Get today's date as `YYYY-MM-DD`.

Write the note to: `~/Projects/_brain/Armory/Notes/{date}_{slug}.md`

Use this structure:

```markdown
---
title: "{title}"
source_url: {url}
source_type: {type}
channel: "{channel}"
duration: "{duration}"
date_published: {YYYY-MM-DD}
date_ingested: {today YYYY-MM-DD}
category: {category}
tags: [{tag1}, {tag2}, {tag3}]
relevance_score: {score}
related_projects: [{project1}, {project2}]
status: processed
investigation_status: {pending if relevance_score >= 3, otherwise skipped}
aliases: [{short title}, {alternative name}]
---

# {Title}

## TL;DR
{1-2 sentence summary}

## Key Takeaways
- {takeaway 1}
- {takeaway 2}
- {takeaway 3}
...

## Actionable for Your Projects
- **{Project}:** {how this applies}
...

## Full Summary
{2-3 paragraph detailed summary}

## Source Transcript
<details>
<summary>Full transcript (click to expand)</summary>

{raw transcript text}

</details>
```

## Step 7: Update Index

Read `~/Projects/_brain/Armory/Index.md`. The Dataview queries handle dynamic listing, but add a comment marker at the bottom tracking the note was added:

```markdown
<!-- Last ingested: {date} | {title} | {category} -->
```

## Step 8: Update System Manifest (if applicable)

Read `~/Projects/_brain/Armory/Cheatsheets/System-Manifest.md` if it exists.

Check if the ingested content produces any of:

1. **A new installed component** (tool, skill, MCP, plugin) → Add to the appropriate table in Section 1 (System Manifest). One row: name, purpose, invocation/status.

2. **A new operational principle** (non-automatable wisdom about how to work better) → Add to the appropriate subsection in Section 2 (Operational Wisdom). One bullet.

3. **Neither** → The note is searchable via armory_search. No manifest update needed. Most notes fall here — that's fine.

Do NOT append raw video summaries. Do NOT create per-category files. The manifest is synthesized, not appended.

If the manifest file doesn't exist yet, skip this step.

## Step 9: Update Inbox (if applicable)

If the URL came from `Inbox-Queue.md`, change its line from:
```
- [ ] {url} | {date} | {note}
```
to:
```
- [x] {url} | {date} | {note} — Processed {today}, see [[{note filename}]]
```

Move the processed line from the `## Pending` section to the `## Processed` section.

## Step 10: Clean Up

```bash
rm -f /tmp/armory_sub* /tmp/armory_audio* /tmp/armory_transcript* 2>/dev/null
```

## Step 11: Report

Tell the user:
- Note title and where it was saved
- TL;DR
- Relevance score and why
- Which cheatsheet was updated
- If batch mode: how many remaining, then loop back to Step 1

---

## Rules

- ALWAYS clean up /tmp/armory_* files when done
- NEVER skip the transcript extraction — the raw transcript in the note is valuable for future search
- If yt-dlp fails on a URL, try WebFetch as a fallback before giving up
- If whisper-cli isn't installed, warn the user and suggest `brew install whisper-cpp` (binary is whisper-cli) — don't silently skip transcription. `yt-dlp` is available via `brew install yt-dlp` or `pipx install yt-dlp`.
- Use today's ACTUAL date, not a placeholder
- Category MUST be from the controlled vocabulary — don't invent new categories
- Keep the TL;DR genuinely brief — 1-2 sentences max
- For batch mode, process items oldest-first (top of inbox to bottom)
- If a video is very long (>30 min), note this in the summary and focus takeaways on the most actionable portions
