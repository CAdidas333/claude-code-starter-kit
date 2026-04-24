---
name: status-report
description: Generate a printable project status report with scoreboard, checklists, handoff prompt, and technical notes. Creates a print-ready HTML file and opens it in the browser for Cmd+P to PDF.
effort: max
disable-model-invocation: false
allowed-tools: Read, Write, Bash, Glob, Grep
---

Generate a printable project status report for the current project.

## What to do

1. **Gather context** — Read these files in order (skip any that don't exist):
   - `CLAUDE.md`
   - `docs/context/MASTER_CONTEXT.md`
   - `docs/context/ACTIVE_PROJECTS.md`
   - `docs/context/SESSION_LOG.md`
   - `README.md`
   - Check `git log --oneline -20` for recent activity
   - Check `git status` for current state
   - Check `git remote -v` for repo URL

2. **Build the report** — Create an HTML file at `docs/Status_Report_[DATE].html` styled for printing. The report MUST include these sections:

   **Header:** Project name, one-line description, today's date

   **Scoreboard:** 4-5 key metrics as large numbers with labels (pick the most relevant KPIs for THIS project — could be test coverage, feature count, uptime, open PRs, whatever matters for the current work). Never hardcode metrics that don't apply to the project you're looking at.

   **Where We Are:** Honest 2-3 sentence summary of current state. What works, what doesn't.

   **What's Built (checklist):** Everything that's done, with checkmarks

   **What's Next (checklist):** Prioritized next steps with arrows for immediate and hourglasses for future

   **Known Issues / Gaps:** Anything broken, incomplete, or concerning

   **Handoff Prompt:** A yellow highlighted box containing a copy-paste prompt for the next Claude Code session. This prompt should:
   - Tell Claude what context files to read
   - Summarize what happened in the most recent session
   - State what the user likely wants to work on next
   - Be specific enough that a cold-start Claude instance can pick up immediately

   **Key Technical Notes:** 2-4 "info boxes" with things that would trip up a new session (gotchas, patterns, important constraints)

   **Where Everything Lives:** Table mapping what to where (repo, files, docs, drives)

   **Footer:** Project name, date, "Built with Claude Code"

3. **Style it for print** — Use this exact CSS approach:
   - Clean sans-serif font (-apple-system, Helvetica Neue, Arial)
   - Color-coded section headers with left border (green=done, orange=next, red=issues, blue=info, purple=handoff)
   - Scoreboard as flex cards with large numbers
   - Tables with alternating row colors and dark header
   - Checklist items with emoji markers (checkmark for done, play arrow for next, hourglass for future)
   - Handoff box: yellow background (#fef9e7), gold border (#f1c40f), monospace pre block
   - Info boxes: light blue background (#eaf2f8)
   - @page rules for letter size, 0.75in margins
   - Page break before second page content
   - print media query tweaks (no padding on body, break-inside: avoid on key sections)
   - Score cards: large 32px bold numbers, light gray background, rounded corners
   - Section header colors: green (#2ecc71) for done, orange (#f39c12) for next, red (#e74c3c) for issues, blue (#3498db) for info, purple (#9b59b6) for handoff

4. **Open it** — Run `open [filepath]` on macOS (or `xdg-open` on Linux) to launch in the browser so the user can Cmd+P to Save as PDF

5. **Tell the user** — "Report is open in your browser. Cmd+P, then Save as PDF to print it."

## Important rules
- Adapt the scoreboard metrics to whatever matters for THIS project (not hardcoded to any specific project's stats)
- Pull real numbers from the codebase/context — don't make anything up
- The handoff prompt should reference actual file paths and actual recent work
- Keep it to 2 pages when printed
- Make it scannable and visual, not wall-of-text — the point is fast re-orientation after a break
- If no context docs exist, gather what you can from README, CLAUDE.md, git log, and the codebase itself
