---
name: verify
description: Confirms the starter kit installed cleanly. Runs 5 checks — MCPs respond, hooks fire, brain folder exists with templates, GitHub auth works, settings.json merged. Used by the installer's smoke test and invocable any time you want to confirm everything's still in order.
effort: low
allowed-tools: Read, Write, Edit, Bash, Glob
---

## What this skill does

Five quick checks that confirm the starter kit is working end-to-end. Run it right after install (the installer runs it for you), or any time something feels off and you want a sanity check before opening a ticket.

---

## Checks

Run all five sequentially. Print PASS/FAIL per check at the end. If anything fails, print a one-line remediation.

### Check 1: MCP servers respond

Run: `claude mcp list 2>&1`

Expected output contains all three: `lean-ctx`, `armory`, `council`.

If `lean-ctx` is missing: PASS this check anyway (lean-ctx may have been skipped if no installer was available). Note "lean-ctx not registered — install manually if you want context-engineering" in the output but do NOT fail.

If `armory` or `council` is missing: FAIL. Remediation: re-run the installer's step 07 with `node bin/finish-setup.js` from the kit directory.

### Check 2: Hooks fire on a test edit

Create a throwaway file at `~/Projects/_starter-kit-verify/probe.md` with the line `# probe`. Edit it (append a line). Verify the code-reviewer-prompt hook output appeared (it prints a banner before/after the edit).

If the hook didn't fire: FAIL. Remediation: check `~/.claude/settings.json` has a `hooks.PostToolUse` entry referencing `code-reviewer-prompt.md`.

Clean up: delete the probe file.

### Check 3: Brain folder + templates exist

Verify the directory tree:

- `~/Projects/_brain/` exists
- `~/Projects/_brain/Dashboard.md` exists
- `~/Projects/_brain/Armory/Notes/` exists
- `~/Projects/_brain/Armory/Cheatsheets/System-Manifest.md` exists
- At least one armory-seed note exists under `~/Projects/_brain/Armory/Notes/`

If any missing: FAIL. Remediation: re-run `node bin/finish-setup.js` to re-execute step 02.

### Check 4: GitHub auth

Run: `gh auth status 2>&1`

Expected: lists your authenticated GitHub account.

If unauthenticated: FAIL. Remediation: `gh auth login`.

### Check 5: settings.json merged

Read `~/.claude/settings.json`. Verify at least one of these kit-specific keys is present:
- `enabledPlugins` (object, non-empty)
- `permissions.allow` (array containing at least one entry that mentions `armory_*` or `Bash(.*scripts.*)`)
- `hooks.PostToolUse` (array with at least one entry referencing `code-reviewer-prompt`)

If none present: FAIL. Remediation: re-run `node bin/finish-setup.js` step 06.

---

## Output format

After running all 5 checks, print:

```
VERIFY SMOKE TEST
─────────────────
✓ Check 1: MCPs responded (3 servers registered)
✓ Check 2: Hooks fired on test edit
✓ Check 3: Brain folder + templates present
✓ Check 4: GitHub auth OK (signed in as <username>)
✓ Check 5: settings.json merged (X kit keys present)

VERIFY OK — your starter kit is working.
```

Or, on any failure:

```
VERIFY SMOKE TEST
─────────────────
✓ Check 1: MCPs responded
✗ Check 2: Hooks did NOT fire on test edit
  Remediation: check ~/.claude/settings.json has hooks.PostToolUse with code-reviewer-prompt entry
✓ Check 3: Brain folder + templates present
✓ Check 4: GitHub auth OK
✓ Check 5: settings.json merged

VERIFY FAILED — fix the items above and re-run /verify.
```

---

## When called from the installer

The installer calls this skill with `claude -p "/verify"` after step 10 completes. Exit code 0 on PASS, 1 on FAIL. The installer reads the exit code and either celebrates or writes a Desktop error report (see `bin/lib/error-report.js`).

## When called by the user

Just type `/verify` in a Claude Code session. Same five checks, same output. No side effects beyond the probe file (which gets cleaned up).
