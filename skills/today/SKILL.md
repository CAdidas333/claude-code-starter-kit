---
name: today
description: Generate a daily briefing across all projects — priorities, Armory inbox status, recent activity, and relevant knowledge tips.
effort: low
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion
---

Generate a concise daily briefing. This is the "morning standup" — scan everything, surface what matters.

---

## Step 1: Read the Dashboard

Read `~/Projects/_brain/Dashboard.md`. Extract:
- Any "Finish These First" items (if the dashboard has such a section)
- The Active Projects table (status, phase, priority, next action)
- Any "Critical Path" or top-of-funnel section the user has defined
- Recent Activity (last 3-5 entries)

If `_brain/Dashboard.md` doesn't exist, tell the user the briefing will be thin until they've run `/new-project` for at least one project and populated the dashboard.

## Step 2: Read All Active Project Statuses

For each project row in the Active Projects table, read its `docs/context/ACTIVE_PROJECTS.md` at `~/Projects/<project-name>/docs/context/ACTIVE_PROJECTS.md`.

Use Glob to discover projects if the dashboard is incomplete:
```
~/Projects/*/docs/context/ACTIVE_PROJECTS.md
```

From each file, extract:
- Current phase and status
- Any unchecked tasks marked as in-progress or high priority
- Blockers or items waiting on the user

## Step 3: Check Armory Status

Read `~/Projects/_brain/Armory/Inbox-Queue.md` if it exists — count pending items.
Count total notes in `~/Projects/_brain/Armory/Notes/` (use Glob).

If the Armory isn't set up yet, skip this section silently.

## Step 4: Synthesize the Briefing

Present the briefing in this format:

```
# Daily Briefing — {today's date}

## Priorities Today
1. {highest priority item from Dashboard or top-of-funnel section}
2. {next priority}
3. {next priority}

## Project Status
| Project | Status | What's Next |
|---------|--------|-------------|
| {each active project} | {phase} | {specific next action} |

## Armory
- {X} notes in vault | {Y} items in inbox pending
- {If inbox has items:} Run `/ingest --batch` to process

## Recent Activity (Last 48h)
- {most recent entries from Dashboard}

## Tips for Today's Work
{If working on a specific project, pull 1-2 relevant Armory notes. Read the _brain/Armory/Cheatsheets/ for applicable categories. Keep to 2-3 lines max. If Armory is empty, skip this section.}
```

---

## Rules

- Keep the briefing scannable — no walls of text
- Use today's actual date
- Don't include projects in MAINTENANCE status unless something changed
- Priorities should be opinionated — rank them, don't just list everything
- If Dashboard has a "Finish These First" section, those come FIRST
- This skill is read-only — it reports, it doesn't make changes
- Gracefully degrade when the brain/Armory isn't fully set up yet — a new kit user should still get something useful
