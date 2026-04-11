---
name: digest
description: Generate a weekly Armory digest — top discoveries, actionable items, cheatsheet updates. Optionally delivers it via iMessage.
effort: low
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

Generate a weekly digest of everything ingested into The Armory.

---

## Step 1: Determine the Week

Get the current ISO week number and year. The digest covers the 7 days ending today.

```bash
date "+%Y-W%V"
```

Check if `~/Projects/_brain/Armory/Digests/{year}-W{week}.md` already exists. If it does, tell the user and ask if they want to regenerate.

## Step 2: Gather Notes from This Week

Use Glob to find all notes in `~/Projects/_brain/Armory/Notes/`.
Read the YAML frontmatter of each note. Filter to notes where `date_ingested` falls within the current week (last 7 days).

For each qualifying note, extract:
- title, category, relevance_score, tags, related_projects
- TL;DR section
- Key Takeaways section (first 3 bullets)

If there are no notes this week, tell the user and skip generation — don't write an empty digest.

## Step 3: Compute Statistics

- Total notes ingested this week
- Breakdown by category
- Breakdown by source_type (youtube, tiktok, article)
- Average relevance score
- Highest relevance notes (score 4-5)

## Step 4: Generate the Digest

Write to `~/Projects/_brain/Armory/Digests/{year}-W{week}.md`:

```markdown
---
week: {year}-W{week}
date_generated: {today YYYY-MM-DD}
notes_ingested: {count}
tags: [digest, armory, weekly]
---

# Weekly Digest — Week {week}, {year}

## This Week's Highlights
- Ingested **{count} notes** ({breakdown by source_type})
- Top category: **{category}** ({count} notes)
- Highest relevance: "{title}" (score: {X}/5)

## Top Discoveries
{For each note with relevance_score >= 4, ordered by score desc:}

### {title} ({category}, {score}/5)
{TL;DR}
**Key takeaway:** {most actionable bullet from Key Takeaways}
→ [[{note filename}]]

## Actionable This Week
{Scan all "Actionable for Your Projects" sections across this week's notes.
Group by project. List only items that are concrete and doable:}
- [ ] **{Project}:** {action item}

## Category Breakdown
| Category | Count | Avg Score |
|----------|-------|-----------|
| {each category} | {count} | {avg} |

## Cheatsheets Updated
{List any cheatsheets that were created or appended to this week}

---
*Generated {today} by The Armory*
```

## Step 5: Optional iMessage Delivery

iMessage delivery is OPTIONAL and depends on the user having an iMessage-sending script configured. Check if one exists at any of these common locations before trying:

- `~/Projects/Armory/scripts/imessage-send.sh`
- `~/bin/imessage-send`
- Any script referenced in `~/.claude/armory-config.sh`

If no script is available, skip this step entirely — don't print an error. The digest is written to disk and that's enough.

If a script IS available, build a phone-friendly summary (no markdown tables, no wikilinks, just plain text):

```
Armory Weekly Digest — Week {week}

{count} notes ingested. Top finds:

1. {highest relevance title} ({score}/5)
   {one-line TL;DR}

2. {second highest title} ({score}/5)
   {one-line TL;DR}

3. {third highest title} ({score}/5)
   {one-line TL;DR}

Action items: {count} across {N} projects.
Full digest in Obsidian → _brain/Armory/Digests/
```

Then ask the user: "Want me to text this to you?" Only send if they say yes.

## Step 6: Report

Tell the user:
- Digest saved to `_brain/Armory/Digests/{year}-W{week}.md`
- Whether iMessage was sent (or skipped)
- Top 3 discoveries with one-line summaries
- How many actionable items were identified

---

## Rules

- iMessage delivery is OPTIONAL and degrades gracefully — never block the digest on it
- Keep the iMessage version SHORT — scannable on a phone screen in 10 seconds
- Notes from previous weeks are NOT included, even if recently modified
- If no notes were ingested this week, say so and skip — don't generate an empty digest
- Use absolute dates, never relative
- Digest filename uses ISO week format: `2026-W13.md`
