---
name: wrap
description: End-of-session wrap-up — updates all context docs, generates status report, commits, pushes, and produces a handoff prompt for the next session. Use this skill whenever the user says "wrap up", "end session", "close out", "session end", "let's wrap", or any variation of finishing a work session. Also use proactively when the session feels complete and the user hasn't explicitly asked to wrap yet.
effort: max
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, AskUserQuestion
---

# Session Wrap-Up

One command to close a session cleanly and prepare the next one. No steps skipped, no docs drifted, no context lost.

---

## Step 1: Determine the Current Project

Check the current working directory to identify which project this session belongs to. Walk up from `pwd` and find the nearest directory that contains either a `docs/context/` folder or a `CLAUDE.md` — that's the project root.

If the working directory is `~/Projects/` itself (the workspace root, not a specific project), ask the user which project to wrap.

## Step 2: Run Context-Updater Agent

Dispatch the context-updater agent to update the current project's docs:

```
Use the Agent tool with subagent_type="context-updater"
```

Prompt it with:
- The project name and directory path
- A summary of what happened this session (synthesize from the conversation)
- Key decisions made
- Files added/changed
- What's next

The agent updates:
- `docs/context/SESSION_LOG.md` — new session entry prepended
- `docs/context/ACTIVE_PROJECTS.md` — status updates, items checked off
- `docs/context/MASTER_CONTEXT.md` — architecture/decisions if changed
- `docs/context/LESSONS.md` — any lessons learned (surprising outcomes, failed approaches)

Wait for it to complete before proceeding.

## Step 3: Run Brain-Updater Agent (if needed)

If the project's status, phase, or priority changed this session, dispatch the brain-updater agent:

```
Use the Agent tool with subagent_type="brain-updater"
```

This updates `~/Projects/_brain/Dashboard.md` with current state across all projects.

Skip this step if nothing changed at the project-status level (routine work within the same phase doesn't need a Dashboard update). Also skip silently if the brain-updater agent isn't installed.

## Step 4: Generate Status Report

Run the /status-report skill to generate a printable HTML status report:

```bash
# The status-report skill creates docs/Status_Report_YYYY-MM-DD.html
```

Invoke the status-report skill for the current project. This creates a timestamped HTML file with scoreboard, checklists, and technical notes.

If the status-report skill isn't installed, skip this step and note it — don't block the wrap on a status report.

## Step 5: Commit and Push

Stage all changes from this session (including the context doc updates and status report):

```bash
git add -A
git status  # Review what's being committed
```

Review the staged files. Exclude any sensitive files (.env, credentials). Then commit and push:

```bash
git commit -m "Session N wrap — [brief description of session work]"
git push
```

Use the actual session number from the SESSION_LOG entry that was just written. If the repo has no remote, skip the push step and note it in the final report.

## Step 6: Generate Handoff Prompt

Build a concise handoff prompt (~10-15 lines) that the next session can use to get up to speed immediately. The prompt should contain:

```
Session [N+1] Handoff — [Project] (YYYY-MM-DD)

Read: docs/context/MASTER_CONTEXT.md, docs/context/ACTIVE_PROJECTS.md, docs/context/SESSION_LOG.md

Session [N] completed [brief description of what was accomplished].

Key changes:
- [2-5 bullet points of what was built/changed]

What's pending:
1. [Next priority item]
2. [Second priority]
3. [Third priority]

Commits: [hash1], [hash2]
```

This is NOT a full briefing — the context docs have the depth. This prompt just tells the new Claude what happened and where to look.

## Step 7: Copy to Clipboard and Report

Copy the handoff prompt to the clipboard (macOS):

```bash
echo '<handoff prompt>' | pbcopy
```

On Linux, use `xclip -selection clipboard` if available, or write the prompt to `docs/context/last-handoff.md` as a fallback so the user can grab it manually.

Then tell the user:
- Session wrapped successfully
- Which docs were updated
- Commit hash and push status
- "Handoff prompt copied to clipboard — paste it into your next session." (Or, on Linux fallback: "Handoff prompt written to `docs/context/last-handoff.md`.")

---

## Rules

- ALWAYS run the context-updater agent. This is non-negotiable. Docs drift fast when this step is skipped.
- ALWAYS commit. Push only if a remote is configured.
- The handoff prompt goes to clipboard via pbcopy (or xclip on Linux), not to a file — unless the clipboard tool is unavailable, in which case write it to `docs/context/last-handoff.md`.
- If the status-report skill fails or isn't available, skip it and note it — don't block the wrap on a status report.
- The handoff prompt uses the NEXT session number (current + 1).
- Include all commit hashes from this session in the handoff, not just the wrap commit.
- Don't include file contents in the handoff prompt — just pointers. The context system handles the rest.
- If there are uncommitted changes from other projects (e.g., LESSONS.md files in other project directories), mention them but don't commit them from this project's directory.
- Works for ANY project structure, not just one specific layout. If the project doesn't have `docs/context/`, degrade gracefully: still commit and push, still produce a handoff prompt, but note that context docs weren't updated because the structure isn't set up.
