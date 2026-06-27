# Recipe: Your First Cron Loop

A cron loop is a Claude Code session that wakes up on a schedule, checks for new work, does it if it's safe to do, and goes back to sleep. Yours can do whatever you want — check an inbox, audit a folder, summarize a feed.

This recipe walks you through creating an hourly loop using the `/schedule` skill. The whole thing runs in Anthropic's cloud (not on your machine), which means it works the same on Mac and Windows — no daemons, no Task Scheduler, no platform-specific anything.

## What you need

- A Claude Code session running on your machine.
- 5 minutes.

## Step 1: Pick what your loop should do

Before you run `/schedule`, decide what the loop is for. Some examples:

- **Inbox watcher.** Check a markdown file for new messages from another tool or person; act on them; leave a status update.
- **Folder auditor.** Look at a directory; if anything's new or stale, flag it.
- **Content digest.** Look at an Obsidian folder; if there are unprocessed items, summarize them.

The most useful loops are **reactive and idempotent**: they read state, do something only if there's work, and never repeat their own past actions.

## Step 2: Run /schedule

In your Claude Code session:

```
/schedule create — Set up an hourly loop that checks <your-thing> and does <action>.
```

`/schedule` will ask you a few questions:
- What's the prompt? (You can paste in the starter template below.)
- What cron schedule? (Use `0 * * * *` for "every hour on the hour, UTC". The minimum is hourly — `/schedule` will reject anything tighter.)
- Which repos to clone into the cloud session?
- Which model? (Default is Sonnet — good balance of speed and cost for reactive work.)

## Step 3: Use the starter template

Copy `templates/cron-loop-starter-routine.json` from the kit. Replace the placeholders:
- `{YOUR_TASK_DESCRIPTION}` — what the loop is actually doing.
- `{YOUR_INBOX_FILE}` — the markdown file the loop should read for new work.
- `{YOUR_REPO_URL}` — the GitHub repo containing your inbox file.

Paste the customized prompt into the `/schedule` interview.

## Step 4: Confirm and watch

`/schedule` confirms the routine details and creates it. You'll get a URL like `https://claude.ai/code/routines/trig_<id>` — that's where you'll watch the loop work.

First tick fires at the next hour boundary (UTC). After that, hourly forever (or until you disable it at the routines URL).

## Conservative defaults to bake into your prompt

Cloud loops are powerful but unsupervised. The starter template includes these safeguards:
- **Max 5 file modifications per tick** — prevents runaway edits.
- **Max 1 commit per repo per tick** — prevents commit-spam.
- **Recognize own commits via `[autoloop]` prefix** — so the loop doesn't react to its own past work.
- **Escalate uncertainty** — anything ambiguous gets written to an inbox file for human review, never auto-acted-on.
- **No-op exit when nothing's new** — silent success, no empty commits.

## When to add a second loop

After the first one's been running a week without surprises. Then you can pattern-match: same prompt shape, different inbox file, different cron line.

## Troubleshooting

- **First tick fired but nothing happened.** Check the URL — the loop probably no-op'd because nothing was actionable. That's correct behavior.
- **Loop is committing wrong things.** Disable it at the routines URL (toggle "enabled" to false), then update the prompt's "NEVER do" section to forbid the bad behavior, then re-enable.
- **Cost is creeping up.** Check `/armory-cost` to see per-tick token usage. Lower the model tier from Sonnet to Haiku if the task is reactive (most loop work is).

## Reference

The `/schedule` skill itself runs in your interactive session — you don't pre-author the routine, you converse with `/schedule` and it builds the routine config from your description. The starter template below is a known-good prompt skeleton you can paste in.
