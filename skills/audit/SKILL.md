---
name: audit
description: Audit Armory knowledge adoption — check which ingested tips, tools, and techniques are actually being used across all projects.
effort: max
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch
---

Audit how well the user's projects are using knowledge from The Armory.

**Usage:**
- `/audit` — Full audit across all projects
- `/audit <project>` — Audit a single project by name (match against `~/Projects/<project>/`)
- `/audit --quick` — Summary only, no deep grep (faster)

---

## Step 1: Load All Armory Notes

Read every note in `~/Projects/_brain/Armory/Notes/*.md`. If the directory is empty or doesn't exist, tell the user there's nothing to audit yet and stop.

For each note, extract from the frontmatter and content:

- `title`
- `category`
- `relevance_score`
- `related_projects`
- `date_ingested`
- **Key Takeaways** — the bullet points under `## Key Takeaways`
- **Actionable Items** — the entries under `## Actionable for Your Projects`

Build a list of **auditable items** — specific, grepable things from the takeaways:
- Tool names (e.g., `whisper-cli`, `Firecrawl`)
- Config keys (e.g., `cleanup_period_days`, `auto_compact_percentage_override`)
- Commands (e.g., `--permission-mode auto`, `--agent`)
- Code patterns (e.g., `isolation: "worktree"`, `subagent_type`)
- File paths or conventions mentioned (e.g., `.claude/agents/`, `design.md`)

Not everything is auditable — skip vague advice like "be more specific in prompts." Focus on concrete, searchable artifacts.

## Step 2: Discover the User's Projects

Use Glob to find project directories:

```bash
ls -d ~/Projects/*/ 2>/dev/null
```

Filter out `_brain/`, `Ideas/`, and any hidden directories. The remaining list is the set of projects to audit.

## Step 3: Check for Evidence of Adoption

For each auditable item, search for evidence across the discovered projects:

### Config/Settings checks:
```bash
# Check Claude settings
grep -r "<item>" ~/.claude/settings.json 2>/dev/null
grep -r "<item>" ~/Projects/*/.claude/ 2>/dev/null
grep -r "<item>" ~/Projects/*/CLAUDE.md 2>/dev/null
```

### Codebase checks:
```bash
# Search across all discovered project source directories
for proj in ~/Projects/*/; do
  grep -rl "<item>" "$proj" 2>/dev/null
done
```

### Git history checks (for recent adoption):
```bash
# Check if something was added in recent commits
cd ~/Projects/<project> && git log --oneline --all --since="{earliest_ingest_date}" --grep="<item>" 2>/dev/null
cd ~/Projects/<project> && git log --oneline --all --since="{earliest_ingest_date}" -S "<item>" 2>/dev/null
```

### Skills/Hooks/Agents checks:
```bash
ls ~/.claude/skills/ 2>/dev/null
ls ~/.claude/agents/ 2>/dev/null
grep -r "<item>" ~/.claude/skills/*/SKILL.md 2>/dev/null
```

### Installed tools:
```bash
which <tool> 2>/dev/null
brew list <tool> 2>/dev/null
```

Be efficient — batch related checks. Don't grep for the same thing twice.

## Step 4: Classify Each Item

For each auditable item, assign a status:

- **ADOPTED** — Found in code, config, or active use. Include where.
- **PARTIALLY ADOPTED** — Related work exists but the specific technique isn't fully implemented.
- **NOT YET TRIED** — No evidence of use. Could be valuable.
- **NOT APPLICABLE** — Doesn't apply to the user's current projects or tech stack.
- **ALREADY KNEW** — Was already in use before ingestion (check git dates).

## Step 5: Generate the Report

Create/update the report at `~/Projects/_brain/Armory/Audit-Report.md`:

```markdown
---
last_audit: {today YYYY-MM-DD}
total_notes: {count}
total_auditable_items: {count}
adopted: {count}
partially_adopted: {count}
not_yet_tried: {count}
not_applicable: {count}
adoption_rate: {percentage}
---

# Armory Adoption Audit — {today}

## Summary
- **{adopted}** items adopted ({adoption_rate}%)
- **{partially}** partially adopted
- **{not_yet}** not yet tried
- **{N/A}** not applicable
- **Notes audited:** {total} | **Since:** {earliest ingestion date}

## Adopted (Working For You)

### From: {note title}
- **{item}** — Found in {location}. {brief context}
...

## Partially Adopted (In Progress)

### From: {note title}
- **{item}** — {what exists vs what's missing}
...

## Not Yet Tried (Opportunities)

### High Relevance (score 4-5)
- **{item}** from "{note title}" — {why it could help}. **Suggested project:** {project}
...

### Lower Relevance (score 1-3)
- **{item}** from "{note title}" — {brief description}
...

## Not Applicable
- {item} — {why it doesn't apply}
...
```

## Step 6: Report to User

Show the full report in the terminal. Highlight:
- The adoption rate trend (if previous audit exists, compare)
- The top 3 untried items worth implementing
- Any items that were adopted since last audit (new wins)

If a `~/Projects/Armory/scripts/imessage-send.sh` script exists, optionally send a condensed summary:

```
Armory Audit — {date}

Adoption rate: {X}% ({adopted}/{total} items)

Top wins:
- {best adopted item + where}
- {second best}

Try next:
- {highest-relevance untried item}
- {second highest}
```

Skip the iMessage send silently if no script is configured.

---

## Rules

- Focus on CONCRETE evidence, not assumptions — if you can't find it in code/config/git, it's "not yet tried"
- Don't count the same item twice across different notes
- When checking git history, use the note's ingestion date as the baseline — adoption after ingestion = influenced by Armory
- Be generous with "ADOPTED" — if the user is using the concept even if not the exact tool name, count it
- Be honest with "NOT YET TRIED" — don't inflate the adoption rate
- The report should be useful, not just a scorecard — the "Try next" suggestions should be specific and actionable
- If `--quick` flag is set, skip the git history checks and deep greps. Just check settings.json, installed tools, and skill/agent directories.
- Update `~/Projects/_brain/Armory/Audit-Report.md` every run (overwrite, not append)
- If the Armory is empty (no notes yet), report "Nothing to audit — Armory is in learning mode" and stop
