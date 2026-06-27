---
name: uptospeed
description: Catch up on a project fast — synthesizes current context, latest handoff, roadmap position, outstanding items, and ranked next actions into a conversational briefing. Use when entering a new session on a project and you want to confidently continue where you left off without drift. Detects project from cwd; supports any structured projects under ~/Projects/ — customize the list in Step 1 to match your setup.
effort: medium
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion
---

# Up to Speed

One command to re-enter a project with confidence. Synthesizes all available context into a briefing that demonstrates — not just asserts — that nothing has drifted.

---

## What this skill does

Re-enter a project after time away with confidence. Reads the project's context docs, latest handoff, roadmap position, and outstanding items, then synthesizes a briefing showing where you left off and what to do next. Run it at the start of any session where you don't remember exactly where you stopped.

## Step 1: Detect the Current Project

1. **Check for argument**: If the user invoked `/uptospeed <ProjectName>`, skip detection and use that project directly.
2. **Otherwise, run `pwd`** and walk upward looking for a recognized project root. **Customize this list for your projects:**
   - `~/Projects/my-project-1/` → my-project-1 (structured)
   - `~/Projects/my-project-2/` → my-project-2 (structured)
   - `~/Projects/Armory/` → Armory (structured)
   - `~/Projects/Ideas/` → Ideas (special flow)
   _(Add or remove entries to match your ~/Projects/ directory. Each entry maps a path to a project name and flow type.)_
3. **If cwd is exactly `~/Projects/`** (root, no project): use `AskUserQuestion` to offer active projects from `~/Projects/_brain/Dashboard.md`.
4. **If cwd is unrelated** (outside `~/Projects/`): tell the user `/uptospeed` is scoped to known projects and suggest `/today` for a cross-project briefing. Exit.
5. **Dispatch**:
   - Project is `Ideas` → jump to Step 3 (Ideas flow).
   - All other structured projects → jump to Step 2 (Structured flow).

---

## Step 2: Structured Project Flow

Read these files silently (do not narrate reading). Some may not exist — that is fine, note absence silently and continue.

### 2a. Read ground-truth context
- `<project>/CLAUDE.md` — project-level rules and pointers
- `<project>/docs/context/MASTER_CONTEXT.md` — architecture + decisions
- `<project>/docs/context/ACTIVE_PROJECTS.md` — roadmap + unchecked items
- `<project>/docs/context/SESSION_LOG.md` — latest 2–3 entries only (use `head` or limit read)

### 2b. Read the handoff (priority order — use first one found)
- **Primary**: `<project>/docs/context/NEXT_SESSION.md` — freshest structured handoff (written by `/wrap`)
- **Fallback**: Latest `<project>/docs/Status_Report_*.html` by filename date — extract handoff prompt section semantically
- **If neither exists**: note "no prior handoff" silently; synthesize from SESSION_LOG instead.

Use Glob pattern `<project>/docs/Status_Report_*.html` and sort by filename (dates in YYYY-MM-DD format sort naturally).

### 2c. Read cross-project context
- `~/Projects/_brain/Dashboard.md` — extract THIS project's row for roadmap position + critical-path context. Also scan "Critical Path to Revenue" and "Key Numbers" sections for any dated milestones affecting this project.
- `~/Projects/_brain/Comms/inbox-<project-lowercase>.md` — pending messages from other threads (if file exists)
- `~/Projects/_brain/Launch/` directory listing — if any files exist (e.g., `Pricing-Notes.md`, `Roadmap.md`, `Trial-Schedule.md`), scan them for dated milestones affecting this project.

### 2c.i. Extract dated milestones

While reading 2a and 2c files, actively hunt for dated items:
- Any `YYYY-MM-DD` date paired with a trial, demo, deadline, launch, or release
- Section headers like "Next milestone", "Upcoming", "Deadline", "Trial", "Demo"
- Mentions like "April 15 trial", "May 1 demo", "by Friday" — resolve relative dates against today

Compute proximity to today (days out) and surface the nearest 1–3 in the output's "Roadmap Position" section. If a milestone is <3 days out, it's near-critical and should influence the #1 ranked next action.

### 2d. Reality check
- Run `git -C <project> log --oneline -10` — recent commits (for staleness cross-check vs SESSION_LOG)
- Run `git -C <project> log -1 --format=%as` — latest commit date (for staleness math)

### 2e. Proceed to Step 4 (Staleness Detection).

---

## Step 3: Ideas Workspace Flow

The Ideas workspace has a different shape — no `docs/context/`, no HTML status reports. It uses `_Inbox.md`, `Braindumps/`, `Explored/`, and back-flows to `_brain/`.

Read these silently:

### 3a. Ideas workspace local
- `~/Projects/Ideas/CLAUDE.md` — the Ideas contract (required-reading rules)
- `~/Projects/Ideas/_Inbox.md` — raw captures (read fully)
- Glob `~/Projects/Ideas/Braindumps/*.md` — get newest 2–3 by date-prefixed filename (YYYY-MM-DD_*)
- `ls ~/Projects/Ideas/Explored/` — directory listing only, for count + titles

### 3b. Brain mirror (for back-flow integrity check)
- `~/Projects/_brain/Ideas/_Inbox.md` — the Brain's copy; compare against local
- `~/Projects/_brain/Ideas/NEXT_SESSION.md` — Ideas handoff (written at back-flow time)
- `ls ~/Projects/_brain/Ideas/Braindumps/` — directory listing for mirror verification

### 3c. Cross-workspace context
- `~/Projects/_brain/Dashboard.md` — IDEAS table section
- `~/Projects/_brain/Comms/inbox-ideas.md` — pending Brain-thread messages
- `ls ~/Projects/_brain/Features/` — listing to identify which ideas have matured to feature docs

### 3d. Back-flow integrity signals (prepare for staleness check)
- Compare bullet count in local `~/Projects/Ideas/_Inbox.md` vs Brain mirror `~/Projects/_brain/Ideas/_Inbox.md`
- Compare Braindump filenames in both dirs — any local-only files = back-flow break
- Note newest Braindump date vs `_Inbox.md` mtime (for freshness flag)

### 3e. Proceed to Step 4 (Staleness Detection).

---

## Step 4: Staleness Detection

Run these checks using the signals gathered in Steps 2/3. Warnings surface ONLY when triggered — be silent otherwise.

### For structured projects

Collect three dates:
- `handoff_date` = date of latest `Status_Report_*.html` filename (or mtime of `NEXT_SESSION.md` if present — prefer NEXT_SESSION if both exist)
- `session_log_date` = date of first entry in `SESSION_LOG.md` (typically ISO format at top)
- `commit_date` = output of `git log -1 --format=%as`

Flag rules (emit only if true):
1. **Stale handoff**: `session_log_date` is more than 1 day newer than `handoff_date` → emit "⚠️ Handoff is older than last session — may not reflect latest state."
2. **Missing wrap**: `commit_date` is more than 1 day newer than `session_log_date` → emit "⚠️ Git shows commits after the last SESSION_LOG entry — last session may not have run `/wrap`."
3. **Abandoned**: all three dates are older than 14 days → emit "⚠️ This project hasn't been touched in 2+ weeks — re-read MASTER_CONTEXT before acting."
4. **No handoff exists**: silent; just note "no prior handoff" in the output body.

### For Ideas workspace

Different flags, emit only if true:
1. **Orphan inbox items**: count of bullets in local `Ideas/_Inbox.md` > count in Brain mirror → emit "⚠️ Local `_Inbox.md` has N entries not mirrored to `_brain/Ideas/_Inbox.md` — back-flow incomplete."
2. **Orphan braindumps**: Braindump files in local but not in Brain mirror → emit "⚠️ N braindump(s) not mirrored to _brain/ — back-flow incomplete."
3. **Stale NEXT_SESSION**: `_brain/Ideas/NEXT_SESSION.md` is older than newest Braindump → emit "⚠️ Ideas handoff is older than most recent Braindump — may not reflect latest thinking."
4. **No handoff**: silent.

### Be specific when flagging

Good: "⚠️ Handoff prompt is 8 days old but last session was 2 days ago — may not reflect latest state."
Bad: "⚠️ Something might be stale."

Include the actual numbers / file references so the flag is actionable.

---

## Step 5: Output the Briefing

Render a single markdown briefing to the terminal. Do NOT write a file. Structure below.

### 5a. Structured project output shape

````
# Up to Speed — [Project Name]
_Detected from cwd: [full cwd path]_

## ⚠️ Flags
[Only include this section if any flags triggered. List each one as a bullet.]

## Where We Left Off
[2–4 sentences synthesized from SESSION_LOG's latest entry and NEXT_SESSION.md. Name the last-session date. Describe last state concretely.]

## Handoff From Last Session
[If NEXT_SESSION.md exists: quote its "Where we left off" + top action verbatim in a blockquote, cite source.
 If only Status_Report HTML exists: extract handoff prompt section, quote, cite.
 If neither: skip this section.]

## Roadmap Position
[One-line phase + next milestone with distance. Pulled from Dashboard + ACTIVE_PROJECTS.]

## Outstanding Items
[Bullet list of unchecked items from ACTIVE_PROJECTS.md — cap at ~8, most relevant first. Mark blockers/critical items.]

## Next Actions (ranked)
▶ **1. [RECOMMENDED]** [action — one-line why]
  2. [action — one-line why]
  3. [action — one-line why]
  4. [action — one-line why]

[Use NEXT_SESSION.md's ranking as primary source if present; otherwise synthesize from outstanding items + flags.]

---
[Conversational close — 3–4 sentences. MUST name: the user's identity, this project/workspace, roadmap phase + proximity to next milestone, the last-session state concretely, and the recommended next action. End with an ATC-style readiness signal — "I'm with you" or a natural variant — and "ready when you are" or equivalent.]
````

### 5b. Ideas workspace output shape

````
# Up to Speed — Ideas Think Tank
_Detected from cwd: ~/Projects/Ideas_

## ⚠️ Flags
[Only if triggered]

## Recent Thinking (last 3 braindumps)
- [date]: [title]
- [date]: [title]
- [date]: [title]

## Inbox Status
- N raw ideas captured
- N flagged for exploration
- N ideas awaiting promotion to Explored/

## Ideas Awaiting Promotion (aging)
[Unexplored items with some age — include days-since. Cap at ~5.]

## Pending Messages
[From _brain/Comms/inbox-ideas.md — one-line summary of each message, if any.]

## Next Actions (ranked)
▶ **1. [RECOMMENDED]** [action — why]
  2. [action — why]
  3. [action — why]

[If back-flow integrity flag triggered, #1 MUST be "fix back-flow" regardless.]

---
[Conversational close — 3–4 sentences naming: the user, Ideas workspace context, what we're deep in (from recent Braindumps), any heads-up the flags surface, recommended next move. End with "I'm with you" + a natural question that invites the next idea — like "What brilliant thing did you come up with today?" or "What are we thinking about?" Vary the question; don't repeat verbatim.]
````

### 5c. Conversational close — design principle

The close must **demonstrate** synthesis, not just claim it. Every close names:
- Who the user is (identity anchor)
- What project / workspace (location anchor)
- Roadmap phase + proximity (phase anchor)
- What was last happening (state anchor)
- Recommended next action (action anchor)

The "I'm with you" signal confirms readiness. The paragraph before it is the EVIDENCE the confirmation is earned. Be conversational and natural. Vary phrasing. Do not recite facts robotically.

**Never** hallucinate identifiers. If something isn't in the source files, don't invent it.

### 5d. Ranking rules

- If `NEXT_SESSION.md` has author-ranked next actions, use that ranking as primary. The author ranked fresh; trust it.
- If no `NEXT_SESSION.md`, synthesize from ACTIVE_PROJECTS unchecked items + flags + roadmap proximity.
- When a staleness flag fires, the #1 recommended action should often be "resolve the staleness" (e.g., re-read docs, run /wrap on the prior session, fix back-flow) UNLESS an external deadline dominates.
- Always include 3–4 ranked options. The goal is to keep targets fresh, not to pre-select the only move.

---

## Rules

- **Never hallucinate**. If a file is missing, say it's missing. Don't invent roadmap milestones, handoff content, or session summaries.
- **Be concise in the body, conversational in the close**. The body is scannable bullets. The close is human.
- **Flags are silent unless triggered**. Don't add "everything looks fine" noise.
- **Don't write files**. `/uptospeed` is read-only. Persistence belongs to `/status-report` and `/wrap`.
- **Respect the author-time ranking**. If `NEXT_SESSION.md` has ranked actions, lead with those.
- **Handle missing docs gracefully**. A new or lightly-structured project should get a useful briefing from whatever is there — CLAUDE.md + git log at minimum.
- **The conversational close is not optional**. It's the signal the user uses to confirm nothing drifted. Always include it. Always name the anchors.
- **"With you" is the spirit, not the script**. Vary the phrasing. Stay natural.
- **Trust file mtime and bullet content, not frontmatter dates**. Obsidian-style `updated: YYYY-MM-DD` frontmatter is often stale even when the file is actively edited. Use `stat`/mtime or the content itself as the source of truth. Only surface the frontmatter date if it agrees with the content.
- **Back-flow direction matters**. For Ideas workspace integrity:
  - **Local > Brain mirror** (local has items mirror doesn't) → typical failure: last session didn't back-flow to Brain. Flag with "N items captured locally but not mirrored."
  - **Brain mirror > Local** (mirror has items local doesn't) → atypical but not necessarily broken. Usually means: another thread wrote to Brain, OR an in-progress session hasn't synced down yet. Flag with "N items in Brain mirror not present locally — check whether another thread added them or current session hasn't synced back yet." Don't treat this as a hard failure without context.

## When done

Do not offer to take the first recommended action automatically. The user decides. Wait for their next instruction.
