# Mac Power Upgrade — Daemon Fleet

You've been running the starter kit on macOS for a while and want to step up to the full daemon fleet — autonomous watcher, scout, audit, investigator, all of it. This upgrade installs 9 launchd jobs that run continuously in the background. It is NOT included in the default install because it's macOS-only and powerful enough that you want to opt into it deliberately.

## What you get

| Daemon | Schedule | What it does |
|---|---|---|
| watcher | every 2 min | Polls for new URLs (from your iMessage capture or iCloud file drop) and ingests them. |
| scout | 8 AM + 6 PM | Autonomous discovery — finds new tools/patterns and ingests them. |
| daily-audit | 8 PM daily | Runs `/audit` if anything got ingested today, texts you adoption metrics. |
| investigator | every 30 min | Fact-checks claims in pending notes via `/investigate`. |
| internal-auditor | every hour | Drift detection in `_brain/` via `/audit-internal`. |
| overwatch | every 5 min + WatchPaths | Reactive per-file audit. |
| morning-brief | 8 AM daily | Gmail triage brief. |
| digest | Sundays 1 PM | Weekly Armory digest. |
| nerve-center-watcher | every 30s | Monitors `_brain/Comms/` for inter-project messages. |

## What you need before starting

- macOS 13 or later.
- The starter kit installed and `/verify` reporting OK.
- `claude` on PATH and working from any directory.
- A scripts directory at `~/Projects/_brain/scripts/` containing the daemon shell scripts (the kit ships templates — you customize for your environment).

## Installation

### Step 1: Copy plist templates

```bash
cp templates/launchd/*.plist ~/Library/LaunchAgents/
```

### Step 2: Replace placeholders

Each plist has `{USER_HOME}` placeholders. Replace them with your actual home directory:

```bash
USER_HOME="$HOME"
for f in ~/Library/LaunchAgents/com.starter.*.plist; do
  sed -i '' "s|{USER_HOME}|$USER_HOME|g" "$f"
done
```

### Step 3: Grant Full Disk Access (if your daemons read chat.db or other protected data)

If you customize the watcher to read iMessage:
1. Open System Settings → Privacy & Security → Full Disk Access.
2. Click the + button.
3. Add the binary the watcher invokes (typically a compiled Swift binary at `~/Projects/_brain/scripts/check-imessage-urls`).
4. Confirm the toggle is ON.

This step is required ONLY if a daemon needs access to protected files. Most don't.

### Step 4: Load each daemon

```bash
for f in ~/Library/LaunchAgents/com.starter.*.plist; do
  launchctl load "$f"
done
```

### Step 5: Verify all 9 are running

```bash
launchctl list | grep com.starter
```

Expected: 9 lines, each with a PID (non-zero means running).

## Maintenance

### Reload a single daemon after editing its plist

```bash
launchctl unload ~/Library/LaunchAgents/com.starter.watcher.plist
launchctl load ~/Library/LaunchAgents/com.starter.watcher.plist
```

### View daemon logs

```bash
tail -f ~/Library/Logs/starter-kit-watcher.log
```

### Disable a daemon temporarily

```bash
launchctl unload ~/Library/LaunchAgents/com.starter.watcher.plist
```

## Setting up the autoloop cloud routine alongside

The Mac daemons are local — they only run when your Mac is awake. For cross-machine background work (running while your Mac sleeps, or while you're on Windows), pair this upgrade with a cloud cron routine via `/schedule`. See `docs/recipes/cron-loop.md`.

## Rollback

To uninstall:

```bash
for f in ~/Library/LaunchAgents/com.starter.*.plist; do
  launchctl unload "$f"
done
rm ~/Library/LaunchAgents/com.starter.*.plist
```

That's it. The daemons stop, the plists are gone, your machine is back to baseline kit state.
