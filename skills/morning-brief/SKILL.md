---
name: morning-brief
description: Generate a morning briefing focused on Gmail triage + today's schedule + priority alerts. Categorizes unread emails, drafts responses, and assembles an 8 AM brief with priority emails, meetings, and anything else that should be on your radar. Complements /today (which is the dev-project briefing) with inbox/calendar/personal surface. Designed to be run manually or via the schedule skill. REQUIRES Gmail MCP (optional dependency) — degrades gracefully if not connected.
effort: high
allowed-tools: Read, Write, Bash, mcp__claude_ai_Gmail__gmail_list_labels, mcp__claude_ai_Gmail__gmail_search_messages, mcp__claude_ai_Gmail__gmail_read_message, mcp__claude_ai_Gmail__gmail_read_thread, mcp__claude_ai_Gmail__gmail_create_draft, mcp__claude_ai_Gmail__gmail_list_drafts, mcp__claude_ai_Google_Calendar__authenticate
---

# Morning Brief — Gmail Triage + Schedule + Priority Alerts

Move from "email creator" to "email approver." Scan the inbox, surface what matters, draft responses where appropriate, and assemble a concise morning brief.

This is distinct from `/today` (which is the cross-project dev briefing). Use `/today` for project status and next actions. Use `/morning-brief` for inbox, calendar, and personal-business surface.

## Optional dependency: Gmail MCP

This skill works best with the Gmail MCP connected (`mcp__claude_ai_Gmail__*` tools). It is NOT required to ship with the kit. If Gmail MCP isn't connected, the skill falls back to a degraded version that assembles the brief from `_brain/Armory/Focus.md`, the current project dashboard, and anything else the user has captured locally.

## Philosophy

Creative willpower is finite. The first unit of willpower in the day is the cheapest; each unit after costs more. Spend the 9 AM version on the things that matter — don't burn it drafting email replies.

The goal is to eliminate decision fatigue at the start of the day. Claude handles categorization and drafting. The user handles approval.

## MCP Priority Hierarchy (honor this)

When integrating with external systems, prefer in this order:
1. **MCP connections** (Gmail MCP, Calendar MCP) — fastest, most reliable
2. **Local files** (downloaded exports, cached state) — fallback when MCP unavailable
3. **Computer use / desktop automation** — last resort, slow, unreliable

## Execution Steps

### Step 1: Check which integrations are available

Attempt to call `mcp__claude_ai_Gmail__gmail_list_labels` with no arguments. If it fails (tool not found, auth error, or empty result), Gmail MCP is not connected — proceed to the degraded flow below.

Also check if Google Calendar MCP is available by attempting to call any calendar tool. If not, note it in the brief and skip the schedule section.

### Step 2 (Gmail path): Triage unread emails

Search for unread messages in the primary inbox:
```
mcp__claude_ai_Gmail__gmail_search_messages(query="is:unread -category:promotions -category:social -category:updates -category:forums", max_results=25)
```

For each message, categorize it into one of:

- **PRIORITY** — requires the user's direct attention today (customer issues, time-sensitive, from a known priority sender, action requested)
- **INFORMATIONAL** — the user should see it but no action needed (confirmations, updates, FYIs)
- **DRAFT** — a response would be appropriate, Claude can draft it (routine replies, scheduling confirmations, acknowledgements)
- **ARCHIVE** — nothing needed (newsletters not opted out, notifications)

Use `mcp__claude_ai_Gmail__gmail_read_message` for any message where the snippet isn't enough to classify.

### Step 3 (Gmail path): Draft responses for the DRAFT category

For each DRAFT item, use `mcp__claude_ai_Gmail__gmail_create_draft` with a response written in the user's voice:

- Concise, direct, no filler
- Match the user's tone from their profile file (`~/Projects/_brain/*-Profile.md`) if it exists
- No emojis unless the original used them
- Never commit to anything that would require approval (numbers, dates, promises)
- Never send — only draft

Leave the draft IDs for the brief.

### Step 4 (Calendar path): Pull today's calendar

If Google Calendar MCP is available, fetch today's events. If not, skip this section with a note: "Calendar MCP not connected — add for meeting integration."

### Step 5 (Degraded path): Assemble brief from local files only

If neither Gmail nor Calendar MCPs are available, build the brief from what's on disk:

- Read `~/Projects/_brain/Armory/Focus.md` if it exists — this is the user's focus file, typically listing today's priorities
- Read `~/Projects/_brain/Dashboard.md` for project statuses
- Read the top of each active project's `docs/context/ACTIVE_PROJECTS.md`
- If a `~/Projects/_brain/Armory/Inbox-Queue.md` exists and has pending items, mention the count

The degraded brief has the same format as the full brief, but the "Priority Emails" / "Drafts" / "Schedule" sections are replaced with a "Focus" section pulled from Focus.md, and a note at the top that says "Gmail/Calendar integration not connected — showing local focus only. See skill docs to wire up Gmail MCP."

### Step 6: Assemble the brief

Format:

```markdown
# Morning Brief — {YYYY-MM-DD}

## Priority Emails ({count})            (omit if Gmail MCP unavailable)
For each: sender, subject, one-line summary, action required, [link to email]

## Drafts Ready for Approval ({count})  (omit if Gmail MCP unavailable)
For each: to, subject, one-line preview, [link to draft in Gmail]

## Today's Schedule ({count})           (omit if Calendar MCP unavailable)
For each: time, title, location/attendees

## Focus Today
{From Focus.md or Dashboard.md top-of-funnel items}

## Informational ({count})              (Gmail path only)
One-line-per-item list. No action needed, just awareness.

## Archive Candidates ({count})         (Gmail path only)
One-line-per-item list. Bulk-archivable if none look interesting.

## Inbox Zero Progress                  (Gmail path only)
- Unread count before triage: {N}
- After drafts + archives: {M}
- Requires your touch: {K}
```

### Step 7: Deliver the brief

Write the brief to `~/Projects/_brain/Armory/Morning-Briefs/{YYYY-MM-DD}.md` (create the directory if needed) so it's archivable and searchable.

Then output it to the user in the current session.

## Token Budget Awareness

Scheduled tasks consume tokens — don't over-schedule.

Recommended cadence:
- **Morning brief:** 1x daily at 8 AM
- **Inbox triage only:** 2x daily at 9 AM and 5 PM (lighter version — just categorize, don't draft)

Do NOT schedule this every 10 minutes. You will burn the token budget and add nothing.

## Scheduling

To run this on a cron schedule, invoke the `schedule` skill with:
```
/schedule create "morning-brief" "8 0 * * *" "/morning-brief"
```

(Exact invocation depends on the current schedule skill's API.)

## Notes

- The kit ships /morning-brief but it is OPTIONAL in practice — if the user doesn't wire up Gmail MCP, the skill still produces a useful Focus-driven brief on day one.
- To wire up Gmail MCP: see Anthropic's connector docs or run `claude mcp add gmail` if the connector is installed.
