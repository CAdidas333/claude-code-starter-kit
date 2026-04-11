# Updating the Kit

The kit is a living thing. New skills get added. Hooks get
improved. The brain scaffold picks up useful templates. When you
want the latest version, you pull it and re-run the finisher.

---

## When to update

- **Periodically.** Once a week or once a month, depending on how
  active you want to be.
- **When a new version is announced.** If you follow the kit's
  GitHub releases or are in a comms channel where new versions
  get called out, update when you see the announcement.
- **When you hit a bug that might already be fixed.** Before
  debugging deeply, update and see if the problem goes away.

You are not obligated to update. The kit you installed on day
one will keep working for as long as you don't delete anything.
If you're happy with your current version, stay on it.

## How to update

One command, assuming you're in whatever directory you originally
cloned the kit into:

```bash
cd wherever-you-cloned-the-kit
git pull
./scripts/update.sh
```

On Windows, the equivalent:

```powershell
cd wherever-you-cloned-the-kit
git pull
.\scripts\update.ps1
```

That's it. The update script re-runs the finisher in update mode,
which applies any new files or settings that shipped in the
pulled version.

## What the update does

The update script is a thin wrapper around `bin/finish-setup.js`
— the same finisher that ran during the initial install. It is
**idempotent**, meaning running it twice does not do anything
twice. You can safely re-run it as many times as you want.

Specifically, the update:

- **Copies new or changed skills** into `~/.claude/skills/`
  (overwriting existing skill files with the kit's versions —
  see the troubleshooting section below if you customized any)
- **Copies new or changed agents** into `~/.claude/agents/`
- **Copies new or changed hooks** into `~/.claude/hooks/` and
  re-applies execute permissions
- **Merges `~/.claude/settings.json`** with any new kit additions
  while preserving your existing custom settings
- **Re-applies the brain scaffold** — but only for files that
  don't already exist. Your existing brain files (profile,
  working-style, focus, dashboard, notes) are NEVER touched.
- **Updates `~/.mcp.json`** if the kit's MCP wiring has changed
- **Re-runs `npm install` in `mcp-servers/armory/`** if the
  Armory MCP has updates

Nothing gets destroyed. The finisher uses "copy if not exists"
semantics for your personal files and "overwrite from kit" only
for kit-owned files.

## Troubleshooting

### "I edited a brain file and my edit got reverted"

It didn't. The finisher's brain scaffold step uses `if (!exists) copy`
semantics — existing brain files are skipped entirely during an
update. If you're seeing a file you edited get reverted, it's
almost certainly something else:

1. Did you run `/wrap` to commit the edit? If not, it's still in
   your working tree, not reverted.
2. Is the file in `~/Projects/_brain/` (safe, skipped by update)
   or in `~/.claude/` (kit-owned, overwritten by update)?
3. Run `git log` in your brain folder to see the actual commit
   history — the edit is probably there.

If you're absolutely sure a brain file got reverted, file an
issue on the kit repo with the specific file path. That would be
a bug worth fixing.

### "A skill stopped working after update"

This one does happen. The kit updates skill files by overwriting
the ones in `~/.claude/skills/`. If you had customized a skill
file, your customizations are gone.

To recover:

1. Check the git history of the file:
   ```bash
   cd ~/.claude/skills/<skill-name>
   git log -p SKILL.md
   ```
2. If `~/.claude/skills/` isn't a git repo (it usually isn't),
   check your backup system — Time Machine on Mac, File History
   on Windows, or whatever backup tool you use.
3. If you want to keep your customized version permanently, move
   it out of `~/.claude/skills/<name>/` to a differently-named
   directory like `~/.claude/skills/<name>-mine/`. The kit will
   only overwrite `<name>/`, not `<name>-mine/`.

**Going forward:** if you plan to customize a kit skill, copy it
to a new name first (`/my-wrap` instead of `/wrap`). That way
your version and the kit's version coexist, and updates don't
touch yours.

If you think the kit's new version of a skill is broken (not
just different), file an issue with the before and after
behavior.

### "The update hung on npm install"

Armory's MCP server needs an `npm install` run every time its
dependencies change. If that step hangs, check your network and
your Node version:

```bash
node --version    # should be 20 or newer
npm config get registry    # should be https://registry.npmjs.org
```

If npm itself is hanging (not just slow), check if you're behind
a proxy or firewall that's blocking the registry. You can skip
the npm install step and Armory MCP will just not update — the
rest of the kit still works.

### "I want to stop getting updates"

Just don't run `git pull` and don't run `./scripts/update.sh`.
Your installed kit stays at whatever version you last applied,
forever, with no nag and no drift. The repo you cloned is a
reference — nothing on your machine automatically syncs with it
unless you explicitly run the update command.

If you want to be extra-sure, you can delete the cloned repo
entirely after an update:

```bash
rm -rf ~/claude-code-starter-kit
```

Your installed kit (under `~/.claude/` and `~/Projects/_brain/`)
keeps working because it's already copied onto your machine. The
clone is only needed when you want to run the update or
installer scripts.

### "I updated and now two things are broken"

Worst case, revert:

```bash
cd wherever-you-cloned-the-kit
git log    # find the commit you were on before the update
git checkout <previous-commit>
./scripts/update.sh
```

This re-runs the finisher with the older version of the kit,
which should put your install back the way it was. Then file an
issue on the kit repo describing what broke — there's probably a
bug in the newer version.

## How to report issues

GitHub issues are the right place:
[github.com/CAdidas333/claude-code-starter-kit/issues](https://github.com/CAdidas333/claude-code-starter-kit/issues)

Good issue reports include:

- The kit version you're on (run `git log -1` in your kit clone
  directory and paste the top commit SHA)
- The command you ran
- The full error output
- What you expected to happen
- What actually happened
- Your OS and version

The more specific the report, the faster the fix.
