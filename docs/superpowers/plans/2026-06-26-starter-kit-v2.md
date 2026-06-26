# Claude-Code-Starter-Kit v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v2 of the starter kit — bulletproof unattended Windows install + three months of new skills, MCPs, seeds, and patterns — usable end-to-end by a non-coder on Windows without the maintainer being present.

**Architecture:** Preserve v1's thin setup script → cross-platform Node.js finisher → in-Claude `/welcome` flow. Add a comprehensive `PRE-INSTALL.md` prep doc that front-loads accounts and tools (so the installer can assume prerequisites). Harden the finisher's most brittle bits (lean-ctx install vector, PATH refresh self-heal). Add a `/verify` smoke test, a Desktop error-report fallback channel, and a GitHub Actions CI matrix on Mac + Windows runners.

**Tech Stack:** Node.js 18+ (finisher), bash (Mac entry point), PowerShell 5+ (Windows entry point), Markdown (skills + docs), TypeScript (vendored Armory + Council MCP servers — unchanged from source), YAML (settings.json, mcp.json, GitHub Actions workflow).

## Global Constraints

- **Cross-platform parity:** every install path must work on macOS 13+ and Windows 10/11.
- **Idempotent finisher:** re-running `setup.sh` / `setup.ps1` or `bin/finish-setup.js` must produce the same result; partial failures recover on re-run.
- **No telemetry / phone-home.** v2 collects nothing.
- **Banned-strings sanitization:** every new file must pass `scripts/check-banned-strings.sh`. The maintainer's full surname is allow-listed only in `LICENSE`, `README.md`, `docs/CHEATSHEET.md`, and the v1 implementation plan. New content must use "the maintainer" or no name at all.
- **MCP key gating:** any MCP server requiring a third-party API key (Council's NVIDIA, OpenAI, Gemini voices) must null-no-op when the key is absent — never error, never block install.
- **No daemons during initial install.** macOS launchd daemons are gated behind an opt-in `docs/upgrades/mac-daemons.md` walkthrough run after first session.
- **Spec source of truth:** `docs/superpowers/specs/2026-06-26-starter-kit-v2-design.md` (commit `b33d730`). Any deviation must be discussed before implementing.

---

## File Structure

### Created files

```
docs/
  PRE-INSTALL.md                          # NEW — browser-only prep doc, Win + Mac tracks
  recipes/
    cron-loop.md                          # NEW — /schedule cloud routine walkthrough
  upgrades/
    mac-daemons.md                        # NEW — opt-in macOS launchd power upgrade
skills/
  verify/SKILL.md                         # NEW — /verify smoke test skill
  uptospeed/SKILL.md                      # NEW — sanitized from ~/.claude/skills/uptospeed
  audit-internal/SKILL.md                 # NEW — encodes 3 audit rules
  armory-cost/SKILL.md                    # NEW
  simplify/SKILL.md                       # NEW
  loop/SKILL.md                           # NEW
  schedule/SKILL.md                       # NEW
  run/SKILL.md                            # NEW
  speak/SKILL.md                          # NEW
mcp-servers/
  council/                                # NEW — full source tree, sanitized
templates/
  System-Manifest.md                      # NEW — operational-wisdom cheatsheet
  cron-loop-starter-routine.json          # NEW — /schedule routine starter
  launchd/                                # NEW — macOS daemon plists
    com.starter.watcher.plist
    com.starter.scout.plist
    com.starter.daily-audit.plist
    com.starter.investigator.plist
    com.starter.internal-auditor.plist
    com.starter.overwatch.plist
    com.starter.morning-brief.plist
    com.starter.digest.plist
    com.starter.nerve-center-watcher.plist
armory-seeds/
  rewind-discipline.md                    # NEW
  boris-cherny-claude-md.md               # NEW
  feature-completion-subtractive-pass.md  # NEW
  idempotency-keys.md                     # NEW
  adhd-prompts-kit.md                     # NEW
  jsonl-transcript-debugging.md           # NEW
  recoverable-delete-safety-net.md        # NEW
bin/lib/
  error-report.js                         # NEW — Desktop fallback writer
.github/workflows/
  install.yml                             # NEW — Mac + Windows CI matrix
```

### Modified files

```
README.md                                 # v2 status + new "what's in this kit" list
CLAUDE.md                                 # remove "design phase" framing
docs/INSTALL.md                           # refresh links + v2 references
docs/context/MASTER_CONTEXT.md            # update Status + Phase
docs/context/ACTIVE_PROJECTS.md           # v2 active work
docs/context/SESSION_LOG.md               # entry per task as plan executes
bin/lib/manifest.js                       # add 9 new skills + 7 seeds + Council MCP + System-Manifest
bin/lib/steps/07-install-mcps.js          # fix lean-ctx vector + add Council install
setup.sh                                  # error-report on failure + Mac PATH refresh
setup.ps1                                 # error-report on failure + PATH self-heal
skills/welcome/SKILL.md                   # two-track rewrite
mcp-servers/armory/                       # refresh tree against current source
```

### Boundary rationale

- One file per skill keeps each skill independently testable and reviewable. A bad skill doesn't block the rest.
- `bin/lib/error-report.js` is a single module called from BOTH setup scripts (DRY) — not duplicated per platform.
- launchd plists are individual files (not a single multi-plist bundle) because each daemon must register separately via `launchctl load`.
- Armory seeds are individual notes (matches Obsidian vault convention) — Armory MCP search reads them as separate notes.

---

## Task 0: Setup the v2 branch

Branch off `feat/v2-design` (where the spec lives) into the build branch. Refresh project context docs to reflect v2 state.

**Files:**
- Modify: `docs/context/MASTER_CONTEXT.md`
- Modify: `docs/context/ACTIVE_PROJECTS.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing
- Produces: `feat/v2-build` branch with refreshed context docs that downstream tasks reference

- [ ] **Step 1: Create v2 build branch**

```bash
cd ~/Projects/Claude-Code-Starter-Kit
git checkout feat/v2-design
git checkout -b feat/v2-build
git push -u origin feat/v2-build
```

Expected: `* feat/v2-build` shows in `git branch`.

- [ ] **Step 2: Refresh `CLAUDE.md` to remove "design phase" language**

Replace the "Status" section in `CLAUDE.md`:

Old:
```markdown
## Status

**Design phase.** No kit content has been built yet. The approved
design lives in a private file outside this repo. See the docs/context/
files for the current state of work.
```

New:
```markdown
## Status

**v2 build.** v1 shipped on `main`; v2 is under construction on `feat/v2-build`. The v2 design lives at `docs/superpowers/specs/2026-06-26-starter-kit-v2-design.md` and the implementation plan at `docs/superpowers/plans/2026-06-26-starter-kit-v2.md`. See the `docs/context/` files for current task state.
```

- [ ] **Step 3: Update `docs/context/ACTIVE_PROJECTS.md` to v2 phase**

Append a new section at the top:

```markdown
## Current Phase: v2 Build

**Priority:** HIGH
**Status:** Active

### Goal
Bulletproof unattended Windows install + 3 months of new skills, MCPs, seeds, and patterns. Target: usable by a non-coder on Windows without the maintainer present.

### Active tasks
See `docs/superpowers/plans/2026-06-26-starter-kit-v2.md` for the full task list.
```

- [ ] **Step 4: Verify banned-strings still passes**

Run: `bash scripts/check-banned-strings.sh`
Expected: `✓ Banned-strings check passed.`

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/context/ACTIVE_PROJECTS.md
git commit -m "Task 0: scaffold v2 build branch + refresh context"
git push
```

Expected: clean commit, banned-strings hook prints PASS.

---

## Task 1: Write PRE-INSTALL.md

The browser-only prep doc that handles all account creation and optional-tool setup before the friend ever opens PowerShell. Two parallel tracks (Windows + Mac), each with 7-8 sections that end in a self-check.

**Files:**
- Create: `docs/PRE-INSTALL.md`

**Interfaces:**
- Consumes: nothing
- Produces: a doc that `README.md` and `setup.ps1` reference; the doc lists the prerequisites that `bin/lib/steps/01-create-workspace.js` and the pre-flight check in setup.ps1 will detect

- [ ] **Step 1: Write the file with both tracks**

Create `docs/PRE-INSTALL.md`:

```markdown
# Before You Install

The starter-kit installer assumes you already have a few things set up. This doc walks you through every one of them, with self-checks so you know each step worked before moving on. Plan on 20-30 minutes start to finish — most of it is account creation, not technical work.

**Pick your platform and follow that track.** Don't skip steps. If a self-check fails, hit the troubleshooting section at the bottom of this doc before going further.

---

## Windows track

### 1. Create your GitHub account

GitHub is where the starter kit lives and where you'll push the code you build later. The account is free.

1. Go to [github.com/signup](https://github.com/signup).
2. Pick a username you wouldn't mind being your permanent identity for code work.
3. Use an email address you actually check — GitHub uses it for security notifications.
4. Click the link in the verification email when it lands.

**Self-check:** Log in at [github.com](https://github.com) — you should see your avatar in the top-right corner. If you can click it and see "Your repositories," you're good.

### 2. Create your Anthropic account + activate Claude Code

Claude Code is Anthropic's CLI tool. It uses your Anthropic account, but Claude Code is a *separate paid subscription* from the regular Claude.ai chat product. If you've been paying for Claude.ai Pro, that does NOT include Claude Code — you'll need a Claude Code pass too.

1. Go to [claude.com](https://claude.com).
2. Sign up with email, Google, or Apple SSO.
3. Find the **Claude Code** section in your account settings.
4. Activate a Claude Code pass — Pro, Max 5x, Max 20x, or Ultra. Start with whatever fits your budget; you can upgrade later.

**Self-check:** From your Claude.com dashboard, you can see your subscription tier and "Claude Code" appears as an active product.

### 3. Install winget (App Installer)

`winget` is Microsoft's command-line package installer. It's how the kit will install git, Node.js, and the GitHub CLI for you.

1. Open the **Microsoft Store** app.
2. Search for **App Installer**. (That's the official name for winget.)
3. Click **Install** or **Update**. If it says "Open" — you already have it.

**Self-check:** Press `Win+R`, type `powershell`, press Enter. In the window that opens, type:

```powershell
winget --version
```

You should see a version number like `v1.6.x`. If you see "winget is not recognized," restart your computer and try again — the install hasn't picked up yet.

### 4. Install Obsidian

Obsidian is a free markdown app that gives you a graph view, search, and backlinks over your "brain" folder (where the starter kit stores your notes). You don't have to use it, but it's a much better experience than reading markdown in Notepad.

1. Go to [obsidian.md](https://obsidian.md).
2. Click **Download for Windows**.
3. Run the installer with default settings.

Don't open Obsidian or set up a vault yet — the installer will create the brain folder, and you'll point Obsidian at it later.

**Self-check:** Obsidian appears in your Start menu.

### 5. Verify your terminal

Windows Terminal is built into Windows 10/11. It's a much better terminal than the old "Command Prompt" — colors, tabs, copy-paste that works.

1. Press `Win+R`.
2. Type `wt` and press Enter.

A terminal window should open. If `wt` opens nothing or errors out, you're probably on an older Windows version — install Windows Terminal from the Microsoft Store first.

**Self-check:** A terminal window opens and shows a `PS C:\Users\YourName>` prompt.

### 6. (Optional) Voice dictation

If you want to talk to Claude instead of typing, Windows has built-in dictation:

1. Press `Win+H` anywhere you can type.
2. Start talking.

If you want something fancier later, there are paid options — but Win+H is plenty for getting started.

### 7. Final health check

Open Windows Terminal (Win+R, `wt`, Enter) and run this exact sequence:

```powershell
winget --version
```

You should see a version number. If you don't, restart and re-do step 3.

### 8. You're ready

Now clone the kit and run the installer:

```powershell
cd $HOME
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
.\setup.ps1
```

The installer prints what it's about to do and asks for confirmation. Read each prompt and press Enter when ready.

---

## Mac track

### 1. Create your GitHub account
(Same as Windows step 1.)

### 2. Create your Anthropic account + activate Claude Code
(Same as Windows step 2.)

### 3. Install Homebrew

Homebrew is Mac's package manager. The kit uses it to install git, Node.js, and lean-ctx.

1. Open **Terminal** (Cmd+Space, type "Terminal", Enter).
2. Paste this exact command:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

3. Follow the prompts. You'll need your Mac password.

**Self-check:** In Terminal, type `brew --version`. You should see a version number.

### 4. Install Obsidian

```bash
brew install --cask obsidian
```

**Self-check:** Obsidian appears in your Applications folder.

### 5. (Optional) Install cmux ($)

[cmux](https://cmux.dev) is a paid Mac-only terminal multiplexer many people love for Claude Code workflows. The kit works fine without it.

### 6. (Optional) Install Wispr Flow ($)

[Wispr Flow](https://wisprflow.ai) is paid voice dictation. Much better than the built-in dictation on Mac. Optional.

### 7. Final health check

```bash
brew --version
which git
```

Both commands should print a path.

### 8. You're ready

```bash
cd ~
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
./setup.sh
```

---

## Troubleshooting

### "winget is not recognized" after installing App Installer
Restart Windows. The PATH update doesn't apply to already-open shells.

### "git is not recognized" on Windows after the installer ran step 3
The installer is supposed to install git via winget. If it didn't run, open Microsoft Store and search for `App Installer` — make sure it's installed, then re-run `.\setup.ps1`.

### "homebrew command not found" after install
Homebrew installs to `/opt/homebrew/bin/brew` on Apple Silicon. Run:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Then re-test with `brew --version`.

### Anthropic account doesn't show "Claude Code"
Make sure you signed up at [claude.com](https://claude.com), not [claude.ai](https://claude.ai) (the chat product). The Claude Code subscription tile lives in your claude.com account settings.

### Browser opens but the installer "hangs"
The installer is waiting for you to finish in the browser, then come back to the terminal and press Enter. Switch back to the terminal window after you finish authenticating.

### Setup hit an error you can't get past
The installer writes a structured error report to your Desktop named `starter-kit-broke-<timestamp>.txt`. Send it to the kit maintainer along with a short description of what happened. They can debug from the report without being at your machine.
```

- [ ] **Step 2: Validate the file**

Run: `bash scripts/check-banned-strings.sh`
Expected: `✓ Banned-strings check passed.`

- [ ] **Step 3: Sanity-check internal links**

Run: `grep -oE '\(http[^)]+\)' docs/PRE-INSTALL.md | sort -u`
Expected: only github.com, claude.com, claude.ai, obsidian.md, cmux.dev, wisprflow.ai, raw.githubusercontent.com URLs — no broken or weird ones.

- [ ] **Step 4: Commit**

```bash
git add docs/PRE-INSTALL.md
git commit -m "Task 1: PRE-INSTALL.md with Windows + Mac tracks"
git push
```

Expected: banned-strings hook prints PASS, push succeeds.

---

## Task 2: Fix lean-ctx install vector in step 07

Replace the npm guess (`@lean-ctx/cli` — verified broken) with real detection: brew tap on Mac, scoop or winget on Windows, manual instruction fallback otherwise. The override env var (`LEAN_CTX_PACKAGE`) stays for advanced users.

**Files:**
- Modify: `bin/lib/steps/07-install-mcps.js`
- Create: `bin/lib/steps/__tests__/07-lean-ctx-detect.test.js`

**Interfaces:**
- Consumes: `process.platform`, `process.env.PATH`, `process.env.LEAN_CTX_PACKAGE`
- Produces: `installLeanCtx()` returns `{present, action, entry}` where `action` is now one of `detected`, `installed`, `failed`, or `skipped-manual`

- [ ] **Step 1: Write the failing test**

Create `bin/lib/steps/__tests__/07-lean-ctx-detect.test.js`:

```js
const assert = require('node:assert');
const { test } = require('node:test');
const step07 = require('../07-install-mcps');

test('lean-ctx detection picks brew on Mac when present', () => {
  const result = step07._internal.pickLeanCtxInstaller({
    platform: 'darwin',
    has: { brew: true, scoop: false, winget: false },
  });
  assert.equal(result.kind, 'brew');
  assert.deepEqual(result.cmd, ['brew', 'install', 'lean-ctx']);
});

test('lean-ctx detection picks scoop on Windows when present', () => {
  const result = step07._internal.pickLeanCtxInstaller({
    platform: 'win32',
    has: { brew: false, scoop: true, winget: true },
  });
  assert.equal(result.kind, 'scoop');
  assert.deepEqual(result.cmd, ['scoop', 'install', 'lean-ctx']);
});

test('lean-ctx detection falls back to winget on Windows without scoop', () => {
  const result = step07._internal.pickLeanCtxInstaller({
    platform: 'win32',
    has: { brew: false, scoop: false, winget: true },
  });
  assert.equal(result.kind, 'winget');
});

test('lean-ctx detection returns manual when no installer is found', () => {
  const result = step07._internal.pickLeanCtxInstaller({
    platform: 'linux',
    has: { brew: false, scoop: false, winget: false },
  });
  assert.equal(result.kind, 'manual');
  assert.equal(result.cmd, null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test bin/lib/steps/__tests__/07-lean-ctx-detect.test.js`
Expected: All 4 tests FAIL with "_internal.pickLeanCtxInstaller is not a function".

- [ ] **Step 3: Implement `pickLeanCtxInstaller` and rewire `installLeanCtx`**

Edit `bin/lib/steps/07-install-mcps.js`. Replace the entire `LEAN_CTX_DEFAULT_PACKAGE` constant and `installLeanCtx()` function with:

```js
// Pick the right installer for lean-ctx based on platform + what's on PATH.
// Returns: { kind: 'brew'|'scoop'|'winget'|'manual', cmd: string[]|null, message: string }
function pickLeanCtxInstaller({ platform, has }) {
  if (platform === 'darwin') {
    if (has.brew) {
      return {
        kind: 'brew',
        cmd: ['brew', 'install', 'lean-ctx'],
        message: 'detected Homebrew on macOS',
      };
    }
    return {
      kind: 'manual',
      cmd: null,
      message: 'Homebrew not found on macOS — install brew first, then re-run',
    };
  }
  if (platform === 'win32') {
    if (has.scoop) {
      return {
        kind: 'scoop',
        cmd: ['scoop', 'install', 'lean-ctx'],
        message: 'detected scoop on Windows',
      };
    }
    if (has.winget) {
      return {
        kind: 'winget',
        cmd: ['winget', 'install', '--id', 'lean-ctx.lean-ctx', '-e', '--silent', '--accept-source-agreements', '--accept-package-agreements'],
        message: 'detected winget on Windows',
      };
    }
    return {
      kind: 'manual',
      cmd: null,
      message: 'neither scoop nor winget found — install one, then re-run',
    };
  }
  return {
    kind: 'manual',
    cmd: null,
    message: `no automatic installer for platform: ${platform}`,
  };
}

function hasOnPath(binary) {
  const pathEnv = process.env.PATH || '';
  if (!pathEnv) return false;
  const isWindows = process.platform === 'win32';
  const sep = isWindows ? ';' : ':';
  const exts = isWindows
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const dir of pathEnv.split(sep)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = `${dir}/${binary}${ext}`;
      try {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) return true;
      } catch {
        // try the next candidate
      }
    }
  }
  return false;
}

function installLeanCtx() {
  if (hasLeanCtxBinary()) {
    log.ok('lean-ctx already on PATH');
    return {
      present: true,
      action: 'detected',
      entry: { command: 'lean-ctx', args: ['mcp'] },
    };
  }

  // Honor explicit override first (advanced users on weird stacks).
  if (process.env.LEAN_CTX_PACKAGE) {
    const packageName = process.env.LEAN_CTX_PACKAGE;
    if (!isValidNpmPackageName(packageName)) {
      log.warn(`Refusing to install lean-ctx: invalid LEAN_CTX_PACKAGE "${packageName}"`);
      return { present: false, action: 'failed', entry: null };
    }
    log.step(`Installing lean-ctx via npm (override): ${packageName}`);
    try {
      runNpm(['install', '-g', packageName], { stdio: 'pipe' });
    } catch (err) {
      log.warn(`lean-ctx npm install failed: ${err.message.split('\n')[0]}`);
      return { present: false, action: 'failed', entry: null };
    }
    if (!hasLeanCtxBinary()) {
      log.warn('npm install finished but lean-ctx is still not on PATH');
      return { present: false, action: 'failed', entry: null };
    }
    log.ok(`lean-ctx installed via npm (${packageName})`);
    return { present: true, action: 'installed', entry: { command: 'lean-ctx', args: ['mcp'] } };
  }

  // Normal path: detect platform-appropriate installer.
  const has = {
    brew: hasOnPath('brew'),
    scoop: hasOnPath('scoop'),
    winget: hasOnPath('winget'),
  };
  const choice = pickLeanCtxInstaller({ platform: process.platform, has });

  if (choice.kind === 'manual') {
    log.warn(`lean-ctx: ${choice.message}`);
    log.warn('You can install lean-ctx later. The kit still works without it.');
    log.warn('See: https://github.com/lean-ctx/lean-ctx');
    return { present: false, action: 'skipped-manual', entry: null };
  }

  log.step(`Installing lean-ctx (${choice.message})`);
  try {
    execFileSync(choice.cmd[0], choice.cmd.slice(1), { stdio: 'pipe' });
  } catch (err) {
    log.warn(`lean-ctx ${choice.kind} install failed: ${err.message.split('\n')[0]}`);
    log.warn('You can install lean-ctx later. The kit still works without it.');
    return { present: false, action: 'failed', entry: null };
  }

  if (!hasLeanCtxBinary()) {
    log.warn(`lean-ctx ${choice.kind} install reported success but binary is still not on PATH`);
    return { present: false, action: 'failed', entry: null };
  }

  log.ok(`lean-ctx installed (${choice.kind})`);
  return { present: true, action: 'installed', entry: { command: 'lean-ctx', args: ['mcp'] } };
}
```

Also remove the now-unused `LEAN_CTX_DEFAULT_PACKAGE` constant. And add `pickLeanCtxInstaller` to the `_internal` export at the bottom:

```js
  _internal: { mergeSettings, unionArray, mergeHooks, mergePermissions, pickLeanCtxInstaller },
```

Wait — `_internal` is exported from step 06, not 07. Add a new export to step 07:

```js
module.exports._internal = { pickLeanCtxInstaller };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test bin/lib/steps/__tests__/07-lean-ctx-detect.test.js`
Expected: All 4 tests PASS.

- [ ] **Step 5: Smoke-test on Mac**

Run: `HOME=/tmp/sk-test node bin/finish-setup.js`
Expected: step 07 prints `detected Homebrew on macOS` and either `lean-ctx already on PATH` (if you have it) or installs via brew. No "best-guess" warning anymore.

- [ ] **Step 6: Commit**

```bash
git add bin/lib/steps/07-install-mcps.js bin/lib/steps/__tests__/07-lean-ctx-detect.test.js
git commit -m "Task 2: fix lean-ctx install vector (brew/scoop/winget detection)"
git push
```

---

## Task 3: Refresh the Armory MCP server vendor

`mcp-servers/armory/` was vendored in April. The current source has evolved (new tools, fixed bugs). Refresh against `~/Projects/Armory/mcp-server/`, sanitize, verify the build still works.

**Files:**
- Modify: `mcp-servers/armory/` (entire tree)

**Interfaces:**
- Consumes: source tree at `~/Projects/Armory/mcp-server/`
- Produces: refreshed `mcp-servers/armory/` that builds cleanly and exposes 7 tools (`armory_search`, `armory_briefing`, `armory_ingest`, `armory_cheatsheet`, `armory_stats`, `armory_send_message`, `armory_read_messages`)

- [ ] **Step 1: Back up the current vendored copy**

```bash
mv mcp-servers/armory mcp-servers/armory.v1-backup
```

- [ ] **Step 2: Copy fresh tree from source**

```bash
mkdir -p mcp-servers/armory
rsync -av --exclude node_modules --exclude dist ~/Projects/Armory/mcp-server/ mcp-servers/armory/
```

- [ ] **Step 3: Run banned-strings against the fresh tree**

Run: `bash scripts/check-banned-strings.sh`
Expected: probably FAILS — the source has references the v1 vendor sanitized out.

- [ ] **Step 4: Sanitize each violation**

For each violation listed, hand-edit the offending file. Pattern from v1:
- Replace business project names with generic equivalents (e.g., `<business-project-A>` → `ProjectA`)
- Replace any internal paths with `~/Projects/<project>/` placeholders
- Replace personal/business identifiers with generic ones

Re-run banned-strings after each fix until PASS.

- [ ] **Step 5: Verify the build works**

```bash
cd mcp-servers/armory
npm install
npm run build
ls dist/index.js
```

Expected: `dist/index.js` exists, no build errors.

- [ ] **Step 6: Smoke-test the tool list**

```bash
cd mcp-servers/armory
node dist/index.js --list-tools 2>&1 | head -20
```

Expected: lists the 7 tools by name. If the server doesn't support `--list-tools`, skip this — Step 4 of Task 13 (CI) catches it.

- [ ] **Step 7: Delete the backup**

```bash
cd ~/Projects/Claude-Code-Starter-Kit
rm -rf mcp-servers/armory.v1-backup
```

- [ ] **Step 8: Commit**

```bash
git add mcp-servers/armory
git commit -m "Task 3: refresh Armory MCP vendor against current source"
git push
```

---

## Task 4: Vendor the Council MCP server

New MCP server in v2. Copy + sanitize from `~/Projects/Armory/council-server/`. Apply the same null-no-op gating-on-missing-key pattern Armory uses.

**Files:**
- Create: `mcp-servers/council/` (entire tree)

**Interfaces:**
- Consumes: source tree at `~/Projects/Armory/council-server/`
- Produces: `mcp-servers/council/dist/index.js` that exposes 6 tools (`council_consult`, `council_code_review`, `council_save`, `council_status`, `council_design_generate`, `council_design_review`)

- [ ] **Step 1: Copy fresh tree**

```bash
mkdir -p mcp-servers/council
rsync -av --exclude node_modules --exclude dist ~/Projects/Armory/council-server/ mcp-servers/council/
```

- [ ] **Step 2: Run banned-strings against fresh tree**

Run: `bash scripts/check-banned-strings.sh`
Expected: probably FAILS — sanitize as in Task 3 Step 4 until PASS.

- [ ] **Step 3: Verify null-no-op gating in models.ts**

Read `mcp-servers/council/src/models.ts`. Confirm each voice (Gemini, GPT, NVIDIA) has this exact pattern:

```typescript
const NVIDIA_KEY = readKeyFromConfig('COUNCIL_NVIDIA_API_KEY');
const nvidiaClient = NVIDIA_KEY
  ? new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
  : null;

function queryNvidia(...) {
  if (!nvidiaClient) return null;  // <-- this is the null-no-op
  // ...real call
}
```

If any voice errors instead of returning `null` when its key is missing, edit `models.ts` to return `null` instead.

- [ ] **Step 4: Verify the build works**

```bash
cd mcp-servers/council
npm install
npm run build
ls dist/index.js
```

Expected: `dist/index.js` exists.

- [ ] **Step 5: Smoke-test no-key behavior**

```bash
unset COUNCIL_GEMINI_API_KEY COUNCIL_OPENAI_API_KEY COUNCIL_NVIDIA_API_KEY
cd mcp-servers/council
node dist/index.js --list-tools 2>&1 | head -20
```

Expected: lists 6 tools, no errors, no warnings about missing keys.

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/Claude-Code-Starter-Kit
git add mcp-servers/council
git commit -m "Task 4: vendor Council MCP server with null-no-op key gating"
git push
```

---

## Task 5: Wire Council into the finisher's step 07

Step 07 currently installs lean-ctx + Armory. Add Council with the same vendor-copy-build pattern as Armory.

**Files:**
- Modify: `bin/lib/steps/07-install-mcps.js`

**Interfaces:**
- Consumes: `mcp-servers/council/` tree from Task 4
- Produces: `~/.claude-starter-kit/mcp-servers/council/dist/index.js` after install; `.mcp.json` entry for `council`

- [ ] **Step 1: Add the Council install function**

In `bin/lib/steps/07-install-mcps.js`, copy `installArmoryMcp` to a new `installCouncilMcp` function below it. Replace `armory` → `council` throughout. The function signature is identical:

```js
function installCouncilMcp(kitRoot) {
  const src = joinUnder(kitRoot, 'mcp-servers/council');
  if (!fs.existsSync(src)) {
    log.warn('Council MCP source not vendored yet — skipping');
    return { present: false, action: 'skipped', entry: null };
  }

  const installBase = joinUnder(paths.HOME, INSTALL_ROOT_REL);
  const dst = joinUnder(installBase, 'council');
  const distEntry = `${dst}/dist/index.js`;

  log.step(`Copying Council MCP to ${dst}`);
  fs.mkdirSync(installBase, { recursive: true });
  copyDirRecursive(src, dst);

  try {
    log.step('Running npm install in Council MCP copy');
    runNpm(['install'], { cwd: dst, stdio: 'pipe' });
  } catch (err) {
    log.warn(`council mcp: npm install failed: ${err.message.split('\n')[0]}`);
    return { present: false, action: 'failed', entry: null };
  }

  let hasBuildScript = false;
  try {
    const pkg = JSON.parse(fs.readFileSync(`${dst}/package.json`, 'utf8'));
    hasBuildScript = Boolean(pkg.scripts && pkg.scripts.build);
  } catch {}

  if (hasBuildScript) {
    try {
      log.step('Running npm run build in Council MCP copy');
      runNpm(['run', 'build'], { cwd: dst, stdio: 'pipe' });
    } catch (err) {
      log.warn(`council mcp: npm run build failed: ${err.message.split('\n')[0]}`);
      return { present: false, action: 'failed', entry: null };
    }
  }

  if (!fs.existsSync(distEntry)) {
    log.warn(`council mcp: expected entry point missing: ${distEntry}`);
    return { present: false, action: 'failed', entry: null };
  }

  log.ok(`Council MCP built at ${dst}`);
  return {
    present: true,
    action: 'installed',
    entry: {
      command: 'node',
      args: ['--no-deprecation', distEntry],
    },
  };
}
```

- [ ] **Step 2: Call it from `run()` and upsert the `.mcp.json` entry**

In the `module.exports.run` function, after the existing `armory = installArmoryMcp(kitRoot)` line, add:

```js
const council = installCouncilMcp(kitRoot);
```

After the existing armory upsert block, add:

```js
if (council.present && council.entry) {
  const result = upsertMcpEntry(config, 'council', council.entry);
  log.ok(`.mcp.json council: ${result}`);
  if (result === 'added') changed = true;
}
```

- [ ] **Step 3: Smoke-test on Mac scratch HOME**

```bash
rm -rf /tmp/sk-test
HOME=/tmp/sk-test node bin/finish-setup.js 2>&1 | grep -i council
```

Expected: lines showing Council install + `.mcp.json council: added`.

Verify the resulting `.mcp.json`:

```bash
cat /tmp/sk-test/.mcp.json
```

Expected: contains a `"council"` entry under `mcpServers`.

- [ ] **Step 4: Commit**

```bash
git add bin/lib/steps/07-install-mcps.js
git commit -m "Task 5: wire Council MCP install into step 07"
git push
```

---

## Task 6: Import 9 new skills

Copy each skill from `~/.claude/skills/<name>/SKILL.md` into `skills/<name>/SKILL.md`. Sanitize. Update `bin/lib/manifest.js` to register them in `KIT_FILES.skills`.

**Files:**
- Create: `skills/{uptospeed,audit-internal,armory-cost,simplify,loop,schedule,run,speak}/SKILL.md` (8 skills)
- Create: `skills/verify/SKILL.md` — note: Task 7 builds this one from scratch, not from copy
- Modify: `bin/lib/manifest.js`

**Interfaces:**
- Consumes: live skill sources at `~/.claude/skills/<name>/SKILL.md`
- Produces: 8 skill directories importable by step 03 of the finisher; manifest lists all 21 skills

- [ ] **Step 1: Copy each skill source**

For each of the 8 skills (uptospeed, audit-internal, armory-cost, simplify, loop, schedule, run, speak) — `/verify` is built separately in Task 7:

```bash
for skill in uptospeed audit-internal armory-cost simplify loop schedule run speak; do
  mkdir -p skills/$skill
  cp ~/.claude/skills/$skill/SKILL.md skills/$skill/SKILL.md
  # If the skill has helper files (references/, scripts/, etc.), copy those too
  if [ -d ~/.claude/skills/$skill/references ]; then
    cp -r ~/.claude/skills/$skill/references skills/$skill/
  fi
done
```

- [ ] **Step 2: Sanitize each skill's SKILL.md**

For each new skill, open `skills/<name>/SKILL.md` and:
1. Remove any references to specific business project names (use generic placeholders).
2. Remove any references to the maintainer's full name (use "the maintainer" or remove).
3. Replace specific internal paths with `~/Projects/<project>/` placeholders.
4. Reframe Chris-specific examples to project-agnostic ones.

Run banned-strings after each skill's edit:

```bash
bash scripts/check-banned-strings.sh
```

Expected after all 8: `✓ Banned-strings check passed.`

- [ ] **Step 3: Add a "What this skill does" newcomer intro paragraph to each**

For each skill, just above the existing `## Step 0` or first `##` heading, insert a 2-3 sentence intro for newcomers:

Example for `/uptospeed`:
```markdown
## What this skill does

Re-enter a project after time away with confidence. Reads the project's context docs, latest handoff, roadmap position, and outstanding items, then synthesizes a briefing showing where you left off and what to do next. Run it at the start of any session where you don't remember exactly where you stopped.
```

Add this section to all 8 imported skills. (uptospeed, audit-internal, armory-cost, simplify, loop, schedule, run, speak)

- [ ] **Step 4: Update `bin/lib/manifest.js` to register the new skills**

Open `bin/lib/manifest.js`. Find `KIT_FILES.skills` (it currently lists 12 v1 skills). Replace the entire `skills` array with all 21 names alphabetically sorted:

```js
skills: [
  'armory-cost',
  'audit',
  'audit-internal',
  'digest',
  'ingest',
  'investigate',
  'loop',
  'memory-md-management',
  'morning-brief',
  'new-project',
  'run',
  'schedule',
  'scout',
  'simplify',
  'speak',
  'status-report',
  'today',
  'uptospeed',
  'verify',
  'welcome',
  'wrap',
],
```

- [ ] **Step 5: Smoke-test the finisher installs all 21 skills**

```bash
rm -rf /tmp/sk-test
HOME=/tmp/sk-test node bin/finish-setup.js 2>&1 | grep -i "skills:"
```

Expected: a line like `Skills: 21 installed` (or `20 installed, 1 source missing` if Task 7 hasn't run yet — that's expected).

```bash
ls /tmp/sk-test/.claude/skills | wc -l
```

Expected: 20 (or 21 once Task 7 runs).

- [ ] **Step 6: Commit**

```bash
git add skills/ bin/lib/manifest.js
git commit -m "Task 6: import 8 new skills + register all 21 in manifest"
git push
```

---

## Task 7: Build the /verify smoke test skill

New skill written from scratch (not imported). Performs the 5 checks from spec §5.4. Used by the installer at the end of the run AND user-invocable.

**Files:**
- Create: `skills/verify/SKILL.md`

**Interfaces:**
- Consumes: `~/.claude/settings.json`, `.mcp.json` (or `~/.mcp.json`), `~/Projects/_brain/`, `gh auth status`
- Produces: prints VERIFY OK or detailed failure list

- [ ] **Step 1: Write the skill file**

Create `skills/verify/SKILL.md`:

```markdown
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
```

- [ ] **Step 2: Verify banned-strings**

Run: `bash scripts/check-banned-strings.sh`
Expected: PASS.

- [ ] **Step 3: Smoke-test by running /verify against current Mac install**

Run: `claude -p "/verify"`
Expected: all 5 checks PASS (assuming you actually have everything installed). If any FAIL, the skill itself works correctly — fix the underlying issue.

- [ ] **Step 4: Commit**

```bash
git add skills/verify/SKILL.md
git commit -m "Task 7: build /verify smoke test skill"
git push
```

---

## Task 8: Create the fallback error-report helper

A shared Node.js module called from both `setup.sh` and `setup.ps1` when an unrecoverable error happens. Writes `~/Desktop/starter-kit-broke-<UTC-timestamp>.txt` with structured diagnostic info.

**Files:**
- Create: `bin/lib/error-report.js`
- Create: `bin/lib/__tests__/error-report.test.js`

**Interfaces:**
- Consumes: `{step, command, stderr, extra}` object describing the failure
- Produces: returns the path of the written error-report file as a string

- [ ] **Step 1: Write the failing test**

Create `bin/lib/__tests__/error-report.test.js`:

```js
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { writeErrorReport } = require('../error-report');

test('writeErrorReport creates a file on the Desktop with expected fields', () => {
  const tmpDesktop = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-'));
  const reportPath = writeErrorReport({
    step: 'step 07: install MCPs',
    command: 'npm run build',
    stderr: 'ENOENT: no such file',
    desktopOverride: tmpDesktop,
  });
  assert.ok(fs.existsSync(reportPath), 'report file was not created');
  const contents = fs.readFileSync(reportPath, 'utf8');
  assert.match(contents, /step 07/);
  assert.match(contents, /npm run build/);
  assert.match(contents, /ENOENT/);
  assert.match(contents, /System Info/);
  assert.match(contents, /Text this file/);
  fs.rmSync(tmpDesktop, { recursive: true });
});

test('writeErrorReport redacts ANTHROPIC_API_KEY value', () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-secret-value';
  const tmpDesktop = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-'));
  const reportPath = writeErrorReport({
    step: 'step 99: testing redaction',
    command: 'echo test',
    stderr: '',
    desktopOverride: tmpDesktop,
  });
  const contents = fs.readFileSync(reportPath, 'utf8');
  assert.doesNotMatch(contents, /sk-ant-secret-value/);
  assert.match(contents, /ANTHROPIC_API_KEY: \[present\]/);
  delete process.env.ANTHROPIC_API_KEY;
  fs.rmSync(tmpDesktop, { recursive: true });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `node --test bin/lib/__tests__/error-report.test.js`
Expected: FAIL with "Cannot find module '../error-report'".

- [ ] **Step 3: Implement `error-report.js`**

Create `bin/lib/error-report.js`:

```js
// error-report.js — write a Desktop-level diagnostic file when the
// installer cannot recover. Same module called from setup.sh and setup.ps1
// via `node bin/lib/error-report.js --json '<payload>'`.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

function desktopPath() {
  if (process.platform === 'win32') {
    return path.join(process.env.USERPROFILE || os.homedir(), 'Desktop');
  }
  return path.join(os.homedir(), 'Desktop');
}

function safeCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 3000 }).trim();
  } catch {
    return '(unavailable)';
  }
}

function gatherSystemInfo() {
  const info = {
    'OS platform': process.platform,
    'OS release': os.release(),
    'Node version': process.version,
    'npm version': safeCmd('npm --version'),
    'git path': safeCmd(process.platform === 'win32' ? 'where git' : 'which git'),
    'gh path': safeCmd(process.platform === 'win32' ? 'where gh' : 'which gh'),
    'claude path': safeCmd(process.platform === 'win32' ? 'where claude' : 'which claude'),
    'HOME': os.homedir(),
    'PATH (truncated)': (process.env.PATH || '').slice(0, 500) + '...',
  };
  if (process.platform === 'win32') {
    info['PowerShell version'] = safeCmd('powershell -Command "$PSVersionTable.PSVersion.ToString()"');
    info['APPDATA'] = process.env.APPDATA || '(unset)';
  }
  // Redacted secret presence flags
  info['ANTHROPIC_API_KEY'] = process.env.ANTHROPIC_API_KEY ? '[present]' : '[absent]';
  info['COUNCIL_GEMINI_API_KEY'] = process.env.COUNCIL_GEMINI_API_KEY ? '[present]' : '[absent]';
  info['COUNCIL_OPENAI_API_KEY'] = process.env.COUNCIL_OPENAI_API_KEY ? '[present]' : '[absent]';
  info['COUNCIL_NVIDIA_API_KEY'] = process.env.COUNCIL_NVIDIA_API_KEY ? '[present]' : '[absent]';
  return info;
}

function formatReport({ step, command, stderr, sysinfo, timestamp }) {
  const truncatedStderr = (stderr || '').slice(0, 4096);
  const lines = [
    'Claude Code Starter Kit — Install Error Report',
    '='.repeat(60),
    '',
    `Timestamp:  ${timestamp}`,
    `Step:       ${step}`,
    `Command:    ${command}`,
    '',
    'Error output (truncated to 4KB):',
    '-'.repeat(60),
    truncatedStderr,
    '-'.repeat(60),
    '',
    'System Info',
    '-'.repeat(60),
    ...Object.entries(sysinfo).map(([k, v]) => `${k}: ${v}`),
    '-'.repeat(60),
    '',
    'What to do next',
    '-'.repeat(60),
    'Text this file to the kit maintainer along with one sentence',
    'describing what you were trying to do when the installer broke.',
    'No secrets are in this file — API keys are flagged only as present/absent.',
    '',
  ];
  return lines.join('\n');
}

function writeErrorReport({ step, command, stderr, extra, desktopOverride }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = desktopOverride || desktopPath();
  fs.mkdirSync(dir, { recursive: true });
  const filename = `starter-kit-broke-${timestamp}.txt`;
  const filepath = path.join(dir, filename);
  const sysinfo = gatherSystemInfo();
  const body = formatReport({ step, command, stderr, sysinfo, timestamp });
  fs.writeFileSync(filepath, body);
  return filepath;
}

// CLI entry: `node bin/lib/error-report.js --json '<payload>'`
if (require.main === module) {
  const args = process.argv.slice(2);
  const jsonIdx = args.indexOf('--json');
  if (jsonIdx === -1 || !args[jsonIdx + 1]) {
    console.error('Usage: error-report.js --json \'<{step,command,stderr}>\'');
    process.exit(2);
  }
  let payload;
  try {
    payload = JSON.parse(args[jsonIdx + 1]);
  } catch (err) {
    console.error('Invalid JSON payload:', err.message);
    process.exit(2);
  }
  const reportPath = writeErrorReport(payload);
  console.log(reportPath);
}

module.exports = { writeErrorReport, gatherSystemInfo, formatReport };
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `node --test bin/lib/__tests__/error-report.test.js`
Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/lib/error-report.js bin/lib/__tests__/error-report.test.js
git commit -m "Task 8: error-report.js fallback channel for unrecoverable installs"
git push
```

---

## Task 9: Wire error-report into setup.sh and setup.ps1

Both setup scripts call `node bin/lib/error-report.js --json ...` when they exit non-zero. The friend sees a clear "I wrote a report to your Desktop" message before the script bails.

**Files:**
- Modify: `setup.sh`
- Modify: `setup.ps1`

**Interfaces:**
- Consumes: `bin/lib/error-report.js` from Task 8
- Produces: when setup fails, a Desktop report file exists AND the friend sees its path on stderr

- [ ] **Step 1: Add trap-based error handler to `setup.sh`**

Open `setup.sh`. At the top of the script (after the shebang and any initial comments but before any commands run), add:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Error-report fallback. Called via trap on any unhandled error.
KIT_SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CURRENT_STEP="initializing"
CURRENT_CMD=""

write_error_report() {
  local exit_code=$?
  if [ $exit_code -eq 0 ]; then return; fi
  echo ""
  echo "❌ Setup failed at: $CURRENT_STEP" >&2
  echo "" >&2
  local payload
  payload=$(printf '{"step":"%s","command":"%s","stderr":"setup.sh exited with code %d"}' "$CURRENT_STEP" "$CURRENT_CMD" "$exit_code")
  local report_path
  report_path=$(node "$KIT_SCRIPT_DIR/bin/lib/error-report.js" --json "$payload" 2>/dev/null) || report_path="(error-report writer also failed)"
  echo "Wrote diagnostic report to:" >&2
  echo "  $report_path" >&2
  echo "" >&2
  echo "Text or email this file to the kit maintainer along with what you were trying to do." >&2
  echo "No secrets are in this file." >&2
  exit $exit_code
}

trap write_error_report EXIT
```

Then, throughout the script, before each major step, update `CURRENT_STEP` and `CURRENT_CMD`:

```bash
CURRENT_STEP="prereq check"; CURRENT_CMD="..."
# ...existing prereq logic...

CURRENT_STEP="github auth"; CURRENT_CMD="gh auth login"
# ...existing gh auth logic...

CURRENT_STEP="cross-platform finisher"; CURRENT_CMD="node bin/finish-setup.js"
node "$KIT_SCRIPT_DIR/bin/finish-setup.js"
```

- [ ] **Step 2: Add try/catch-based error handler to `setup.ps1`**

Open `setup.ps1`. After the `$ErrorActionPreference = "Stop"` line, add:

```powershell
$Script:CurrentStep = "initializing"
$Script:CurrentCmd  = ""

function Write-ErrorReportAndExit {
    param([int]$ExitCode = 1, [string]$Stderr = "")
    Write-Host ""
    Write-Host "❌ Setup failed at: $Script:CurrentStep" -ForegroundColor Red
    Write-Host ""
    $payload = @{
        step    = $Script:CurrentStep
        command = $Script:CurrentCmd
        stderr  = $Stderr
    } | ConvertTo-Json -Compress
    try {
        $reportPath = & node (Join-Path $ScriptDir "bin\lib\error-report.js") --json $payload 2>$null
    } catch {
        $reportPath = "(error-report writer also failed)"
    }
    Write-Host "Wrote diagnostic report to:" -ForegroundColor Yellow
    Write-Host "  $reportPath"
    Write-Host ""
    Write-Host "Text or email this file to the kit maintainer along with what you were trying to do."
    Write-Host "No secrets are in this file."
    exit $ExitCode
}
```

Wrap the existing main body in a try/catch:

```powershell
try {
    $Script:CurrentStep = "prereq check"
    # ...existing prereq logic...

    $Script:CurrentStep = "github auth"
    $Script:CurrentCmd  = "gh auth login"
    # ...existing gh auth logic...

    $Script:CurrentStep = "cross-platform finisher"
    $Script:CurrentCmd  = "node bin\finish-setup.js"
    node (Join-Path $ScriptDir "bin\finish-setup.js")
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorReportAndExit -ExitCode $LASTEXITCODE -Stderr "finisher exited with code $LASTEXITCODE"
    }
} catch {
    Write-ErrorReportAndExit -ExitCode 1 -Stderr $_.Exception.Message
}
```

- [ ] **Step 3: Simulate a failure on Mac**

```bash
# Make finisher exit non-zero by pointing it at a bogus kit root
cd /tmp
mkdir -p sk-fail-test
cp ~/Projects/Claude-Code-Starter-Kit/setup.sh sk-fail-test/
cp -r ~/Projects/Claude-Code-Starter-Kit/bin sk-fail-test/
cd sk-fail-test
# Force the finisher to fail by removing manifest dependencies
rm -rf bin/lib/steps
./setup.sh
```

Expected: `❌ Setup failed at: cross-platform finisher`. A file appeared at `~/Desktop/starter-kit-broke-*.txt`. Read it:

```bash
cat ~/Desktop/starter-kit-broke-*.txt
```

Expected: contains step/command/stderr/system info/instructions block.

Clean up: `rm ~/Desktop/starter-kit-broke-*.txt; rm -rf /tmp/sk-fail-test`.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/Claude-Code-Starter-Kit
git add setup.sh setup.ps1
git commit -m "Task 9: wire error-report fallback into setup.sh + setup.ps1"
git push
```

---

## Task 10: PATH refresh self-heal in setup.ps1

When `claude` is invisible after `npm install -g @anthropic-ai/claude-code` (a real Windows scenario per v1), the script spawns a child PowerShell with refreshed PATH and re-invokes itself instead of telling the friend "close and re-run."

**Files:**
- Modify: `setup.ps1`

**Interfaces:**
- Consumes: `Update-PathFromEnvironment` (already exists in v1)
- Produces: when claude is still invisible after Update-PathFromEnvironment, spawn child shell + retry once

- [ ] **Step 1: Add the self-heal block**

In `setup.ps1`, find the existing block that exits when `claude` isn't on PATH after npm install:

```powershell
if (-not (Test-Command "claude")) {
    Write-Host ""
    Write-Host "Claude Code was installed via npm, but 'claude' is not on PATH." -ForegroundColor Red
    Write-Host "Close this PowerShell window, open a new one, and re-run setup.ps1."
    ...
    exit 1
}
```

Replace with:

```powershell
if (-not (Test-Command "claude")) {
    Write-Host ""
    Write-Host "Claude was installed but isn't on PATH yet in this shell." -ForegroundColor Yellow
    Write-Host "Re-launching setup in a fresh PowerShell with refreshed PATH..."
    Write-Host ""
    # Spawn a child PowerShell that re-runs this script with fresh env.
    # The child inherits the latest registry PATH, so claude will be visible.
    $childScript = Join-Path $ScriptDir "setup.ps1"
    & powershell -NoProfile -ExecutionPolicy Bypass -File $childScript
    exit $LASTEXITCODE
}
```

- [ ] **Step 2: Add a guard against infinite recursion**

Before the self-heal block, add an env-var check. Set it on first invocation so the child knows it was re-launched:

```powershell
if (-not (Test-Command "claude")) {
    if ($env:KIT_SETUP_RELAUNCHED -eq "1") {
        # Already relaunched once and claude still invisible — give up.
        Write-ErrorReportAndExit -ExitCode 1 -Stderr "claude not on PATH after PowerShell relaunch"
    }
    Write-Host ""
    Write-Host "Claude was installed but isn't on PATH yet in this shell." -ForegroundColor Yellow
    Write-Host "Re-launching setup in a fresh PowerShell with refreshed PATH..."
    Write-Host ""
    $env:KIT_SETUP_RELAUNCHED = "1"
    $childScript = Join-Path $ScriptDir "setup.ps1"
    & powershell -NoProfile -ExecutionPolicy Bypass -File $childScript
    exit $LASTEXITCODE
}
```

- [ ] **Step 3: Mac equivalent in setup.sh**

`source ~/.zshrc` after brew installs in setup.sh is fragile because the user's shell config is unpredictable. Instead, after any install that touches PATH, exec a fresh login shell that runs the rest of the script:

In `setup.sh`, after the prereq install block, add:

```bash
# If we just installed things that change PATH (Node, brew packages),
# re-exec the script in a fresh shell so subsequent commands see the new PATH.
if [ "${KIT_SETUP_RELAUNCHED:-0}" != "1" ] && ! command -v claude >/dev/null 2>&1; then
    echo ""
    echo "Re-launching setup in a fresh shell with refreshed PATH..."
    echo ""
    export KIT_SETUP_RELAUNCHED=1
    exec "$SHELL" -l -c "$KIT_SCRIPT_DIR/setup.sh"
fi
```

Add the same guard against infinite recursion: if `KIT_SETUP_RELAUNCHED=1` and `claude` is still invisible, write error report + exit.

- [ ] **Step 4: Smoke-test the recursion guard**

```bash
KIT_SETUP_RELAUNCHED=1 PATH=/usr/bin ./setup.sh
```

Expected: writes error report saying "claude not on PATH after shell relaunch" and exits.

- [ ] **Step 5: Commit**

```bash
git add setup.ps1 setup.sh
git commit -m "Task 10: PATH refresh self-heal in setup.ps1 + setup.sh"
git push
```

---

## Task 11: Two-track /welcome rewrite

Major rewrite. The skill detects coding-experience answer and routes to Track A (full v1 interview) or Track B (new Adopter content).

**Files:**
- Modify: `skills/welcome/SKILL.md`

**Interfaces:**
- Consumes: marker file `~/.claude/.welcome-pending`, existing profile files
- Produces: same files v1 produces (`~/Projects/_brain/{Name}-Profile.md`, `Focus.md`, `Working-Style.md`) plus updated Adopter-track files

- [ ] **Step 1: Back up the v1 welcome SKILL.md**

```bash
cp skills/welcome/SKILL.md skills/welcome/SKILL.v1-backup.md
```

(The backup gets deleted at the end of this task — used to lift verbatim sections.)

- [ ] **Step 2: Rewrite the routing section**

Open `skills/welcome/SKILL.md`. Replace the existing "First-run flow" → "Opening message" → "Section 1: Identity" sequence with a two-track router:

```markdown
## First-run flow

### Opening message

Your very first message to the user should be short and direct. Something like:

> Hey — welcome. I'll ask you a few questions so this kit knows who you are and how you work. About 5 to 10 minutes. Then we'll start the real thing.
>
> First question: where are you at with coding?
>
> A. I haven't really written code before.
> B. I've used Claude (chat / Claude.ai / projects) but never the CLI tool itself.
> C. I've done some scripting before.
> D. I'm a developer.

Wait for their answer. Then route:

- **A → Track A (Beginner).** Continue with the full Beginner flow below.
- **B, C, or D → Track B (Adopter).** Continue with the Adopter flow below. For D, skip the "what's new vs Claude.ai" preamble.

---

## Track A — Beginner

[Full v1 interview content goes here verbatim — Section 1 Identity, Section 2 Focus three-path fork, Section 3 Working Style, Section 4 Communication Style, ending with the braindump invitation. Lift this content from skills/welcome/SKILL.v1-backup.md.]

---

## Track B — Adopter

### Section 1: Identity

Three questions, one at a time. Acknowledge briefly between each.

1. **Name** — "What should I call you?"
2. **Platform** — "Mac or Windows?"
3. **Current Claude usage** — "What do you currently use Claude for? Chat, projects, Claude.ai for work, all of the above?"

After all three, write the profile file at `~/Projects/_brain/{Name}-Profile.md`:

```markdown
---
updated: {TODAY}
tags: [profile]
---

# {NAME}

> Who I am, how I work, what I'm into. Claude reads this at session start.

## Background

**Platform:** {MAC_OR_WINDOWS}
**Current Claude usage:** {WHAT_THEY_USE}
**Coding experience:** {LEVEL_FROM_ROUTING_QUESTION}

## How I got here

_This section fills in over time as Claude learns more about you._

## What I'm working on

_Will be set during Track B Section 3._
```

### Section 2: What's new vs Claude.ai (skip for D)

If they answered B or C in the routing question, send this verbatim:

> Quick orientation — here's what this CLI tool gives you on top of what you already have in Claude.ai:
>
> - **Skills as callable functions.** Instead of typing the same long prompt every time, you say `/ingest <url>` or `/uptospeed` and Claude runs a pre-defined workflow.
> - **Hooks that fire on every Edit/Write.** A code-reviewer hook runs after every change so issues get caught at write-time, not later.
> - **A persistent brain folder you can open in Obsidian.** Your notes, project context, and learnings live in markdown files on your machine. Claude reads them at the start of every session.
> - **Armory ingestion.** Drop a YouTube link or article into `/ingest`, get a structured note in your brain folder. Searchable forever via the `armory_search` MCP tool.
>
> That's the core. There's more, but that's what you'll feel first.

### Section 3: Path branch

Ask:

> Two paths from here. Pick one:
>
> A. **Bring an existing project over.** You have something you've been working on in Claude.ai or Co-Work that you want to continue in Claude Code with all the new tooling.
> B. **Set up an ongoing workflow.** You want to build the muscle of using Claude Code daily — ingesting content, running cron loops, accumulating a brain.

If A: walk them through:

1. Copying their project files into `~/Projects/<project-name>/`
2. Running `/uptospeed` to read whatever context they bring with them
3. Continuing the existing work from there

Write a `~/Projects/_brain/{Name}-Focus.md` capturing what project they're bringing over.

If B: walk them through:

1. Picking one piece of content they've been meaning to consume (YouTube video, article, blog post)
2. Running `/ingest <url>` on it — explain what's about to happen (transcript extract, Claude summary, structured note written, iMessage summary)
3. Showing them the resulting note in `~/Projects/_brain/Armory/Notes/`
4. Explaining how `armory_search "<topic>"` finds knowledge later

Write a `~/Projects/_brain/{Name}-Focus.md` capturing what kind of workflow they want.

### Section 4: Power moves

End with 2-3 concrete things to try in their first session:

> Three things to try right now:
>
> 1. Run `/uptospeed` from any project folder. It synthesizes everything Claude knows about that project into a 30-second briefing.
> 2. Drop a YouTube link you've been meaning to watch into `/ingest`. Five minutes later you have a searchable note.
> 3. Try `/schedule` to set up an hourly cron routine. Useful when you have an inbox or backlog you want Claude to check on every hour even when you're not online.
>
> Pick one. Type `claude` from `~/Projects/<your-project>` and start. I'll be there.

End the interview. No braindump invitation in Track B — Adopters know what they want to do.
```

- [ ] **Step 3: Copy Track A content from v1 backup**

In `skills/welcome/SKILL.md`, replace the `[Full v1 interview content goes here verbatim...]` placeholder with the actual content from `skills/welcome/SKILL.v1-backup.md`. Lift the existing Section 1, 2, 3, 4 + braindump verbatim. This is mechanical — copy the v1 content into the Track A section.

- [ ] **Step 4: Delete the v1 backup**

```bash
rm skills/welcome/SKILL.v1-backup.md
```

- [ ] **Step 5: Verify banned-strings**

Run: `bash scripts/check-banned-strings.sh`
Expected: PASS.

- [ ] **Step 6: Manual smoke**

Re-install kit into scratch HOME, run `claude -p "/welcome"`, answer "A" to the routing question, verify it walks the Beginner flow. Repeat with "B", verify Adopter flow.

```bash
rm -rf /tmp/sk-test
HOME=/tmp/sk-test node bin/finish-setup.js
HOME=/tmp/sk-test claude -p "/welcome" --once
# In the session, answer A first, then exit. Repeat with B.
```

- [ ] **Step 7: Commit**

```bash
git add skills/welcome/SKILL.md
git commit -m "Task 11: two-track /welcome (Beginner + Adopter) with implicit routing"
git push
```

---

## Task 12: System-Manifest template + 7 new Armory seeds

Operational-wisdom cheatsheet template + foundational notes. All sanitized.

**Files:**
- Create: `templates/System-Manifest.md`
- Create: `armory-seeds/rewind-discipline.md`
- Create: `armory-seeds/boris-cherny-claude-md.md`
- Create: `armory-seeds/feature-completion-subtractive-pass.md`
- Create: `armory-seeds/idempotency-keys.md`
- Create: `armory-seeds/adhd-prompts-kit.md`
- Create: `armory-seeds/jsonl-transcript-debugging.md`
- Create: `armory-seeds/recoverable-delete-safety-net.md`
- Modify: `bin/lib/manifest.js`
- Modify: `bin/lib/steps/02-install-brain-templates.js` (if seed install isn't already generic)

**Interfaces:**
- Consumes: source `_brain/Armory/Cheatsheets/System-Manifest.md` for shape, and existing Armory notes for content
- Produces: 1 template + 7 seed notes that step 02 copies into `~/Projects/_brain/`

- [ ] **Step 1: Create the System-Manifest template**

Create `templates/System-Manifest.md`. Lift the operational-wisdom section structure from `~/Projects/_brain/Armory/Cheatsheets/System-Manifest.md`, but sanitize:
- Strip the "Live Systems" daemon table (it's Mac-specific power-user content; surfaced only via the upgrade doc)
- Strip references to specific business projects
- Keep the Operational Wisdom headings: Planning, Coding, Context Management, Skill Design, Working with Maintainer, Observability
- Seed each with 3-5 representative entries from current source, sanitized

This is content work, not boilerplate. Read the current System-Manifest.md in source and translate.

- [ ] **Step 2: Create 7 seed notes**

For each seed, create the file with this frontmatter pattern (vary content per topic):

```markdown
---
title: "{Title}"
source: starter-kit-seed
date_ingested: 2026-06-26
category: {category}
tags: [{topic-tags}]
relevance_score: 5
related_projects: []
status: processed
investigation_status: not-needed
aliases: [{topic aliases}]
---

# {Title}

## TL;DR
{One sentence summary.}

## Key Takeaways
- {Bullet 1}
- {Bullet 2}
- {Bullet 3}

## Actionable for your projects
- {Concrete action 1}
- {Concrete action 2}
```

Topics + content sources (lift + sanitize from current `_brain/Armory/Notes/`):

1. **`rewind-discipline.md`** — `/rewind` instead of "try again" when Claude fails. Source: `~/Projects/_brain/Armory/Notes/2026-04-20_never-hit-claude-session-limit.md` Key Takeaways.
2. **`boris-cherny-claude-md.md`** — CLAUDE.md as accumulating learnings file. Source: `2026-04-02_boris-cherny-claude-md-rules.md` (canonical).
3. **`feature-completion-subtractive-pass.md`** — Run `/simplify` or the deleting-code prompt at feature close. Source: `2026-06-18_most-useful-claude-prompt-is-deleting-code.md`.
4. **`idempotency-keys.md`** — Every mutating endpoint accepts `Idempotency-Key`. Source: `2026-05-19_api-idempotency-keys-prevent-duplicate-writes.md`.
5. **`adhd-prompts-kit.md`** — Task Paralysis Shatterer, Dopamine Menu, Body Doubling templates. Source: `2026-05-28_claude-adhd-executive-function-prompts.md`.
6. **`jsonl-transcript-debugging.md`** — Debug skills from JSONL, not memory. Source: `~/.claude/projects/<slug>/<session>.jsonl` pattern explained.
7. **`recoverable-delete-safety-net.md`** — `brew install trash` + alias rm. Source: `2026-05-19_brew-install-trash-vibe-coding-safety-net.md`.

For each: write the file, then run `bash scripts/check-banned-strings.sh` and fix violations.

- [ ] **Step 3: Update manifest.js**

In `bin/lib/manifest.js`, find `KIT_FILES.armorySeedNotes` (or similar — look at what step 02 imports). If the v1 has a hardcoded list of seeds, expand it. If it's glob-based, no change needed.

If hardcoded, replace the 3-element list with the 10 names (3 old + 7 new), alphabetically sorted.

If there's a `KIT_FILES.cheatsheets` or similar for the System-Manifest, add `'System-Manifest.md'` to it.

- [ ] **Step 4: Smoke-test step 02 installs them**

```bash
rm -rf /tmp/sk-test
HOME=/tmp/sk-test node bin/finish-setup.js 2>&1 | grep -i "brain\|seed\|manifest"
ls /tmp/sk-test/Projects/_brain/Armory/Notes/
ls /tmp/sk-test/Projects/_brain/Armory/Cheatsheets/
```

Expected: 10 seed notes in `Notes/`, `System-Manifest.md` in `Cheatsheets/`.

- [ ] **Step 5: Commit**

```bash
git add templates/System-Manifest.md armory-seeds/ bin/lib/manifest.js
git commit -m "Task 12: System-Manifest template + 7 new Armory seed notes"
git push
```

---

## Task 13: Cron loop recipe + starter routine template

Documented walkthrough of creating an hourly cloud routine via `/schedule`. Cross-platform (works on Mac AND Windows because the routine runs in Anthropic's cloud).

**Files:**
- Create: `docs/recipes/cron-loop.md`
- Create: `templates/cron-loop-starter-routine.json`

**Interfaces:**
- Consumes: nothing
- Produces: a doc the friend can follow + a JSON template he can customize and pass to `/schedule`

- [ ] **Step 1: Write the recipe doc**

Create `docs/recipes/cron-loop.md`:

```markdown
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
```

- [ ] **Step 2: Create the starter routine template**

Create `templates/cron-loop-starter-routine.json`:

```json
{
  "prompt": "You are an hourly cloud loop for {YOUR_TASK_DESCRIPTION}. This is ONE TICK. Fresh session, no memory.\n\nWhat to do:\n1. git -C <repo> pull --ff-only. On conflict: stop, append a one-line stall note to <inbox-file>, commit + push, exit.\n2. Read <inbox-file>. Find any messages NOT marked PROCESSED and not your own prior [autoloop] entries.\n3. Act ONLY within these safe scopes: <list-your-safe-actions>. NEVER prune, delete, or edit source code.\n4. For anything outside safe scope: append a question to <escalation-file>, do not auto-act.\n5. Commit any changes with message starting [autoloop]. Push.\n6. If nothing actionable: exit silently. No empty commits.\n\nSelf-throttle (hard caps per tick):\n- Max 5 file modifications.\n- Max 1 commit per repo.\n\nRecognize own work via [autoloop] commit prefix. Don't react to your own past ticks.\n\nBegin.",
  "cron_expression": "0 * * * *",
  "model": "claude-sonnet-4-6",
  "notes": "Replace {YOUR_TASK_DESCRIPTION}, <repo>, <inbox-file>, <escalation-file>, and <list-your-safe-actions> with your specifics before passing this to /schedule."
}
```

- [ ] **Step 3: Verify banned-strings**

Run: `bash scripts/check-banned-strings.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/recipes/ templates/cron-loop-starter-routine.json
git commit -m "Task 13: cron loop recipe + starter routine template"
git push
```

---

## Task 14: Mac power upgrade — docs + launchd templates

Opt-in macOS upgrade path. Document the daemon ecosystem and ship plist templates the user can `launchctl load`.

**Files:**
- Create: `docs/upgrades/mac-daemons.md`
- Create: `templates/launchd/com.starter.{watcher,scout,daily-audit,investigator,internal-auditor,overwatch,morning-brief,digest,nerve-center-watcher}.plist` (9 plists)

**Interfaces:**
- Consumes: source plists at `~/Library/LaunchAgents/com.armory.*.plist` and `~/Library/LaunchAgents/com.cwi.nerve-center-watcher.plist`
- Produces: 9 generic plists the user copies + customizes + loads

- [ ] **Step 1: Generate generic plist templates**

For each daemon, take the source plist and sanitize:
- Replace specific binary paths with `{USER_HOME}/...` placeholders
- Replace specific Standard*Path log file paths with `{USER_HOME}/Library/Logs/starter-kit-<name>.log`
- Strip references to specific business projects
- Keep schedule (StartInterval / StartCalendarInterval), keep WatchPaths if present, keep ProgramArguments shape

Example for watcher (`templates/launchd/com.starter.watcher.plist`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.starter.watcher</string>
    <key>ProgramArguments</key>
    <array>
        <string>{USER_HOME}/Projects/_brain/scripts/watcher.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>120</integer>
    <key>StandardOutPath</key>
    <string>{USER_HOME}/Library/Logs/starter-kit-watcher.log</string>
    <key>StandardErrorPath</key>
    <string>{USER_HOME}/Library/Logs/starter-kit-watcher.log</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

Repeat for the other 8 daemons.

- [ ] **Step 2: Write the upgrade walkthrough**

Create `docs/upgrades/mac-daemons.md`:

```markdown
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
```

- [ ] **Step 3: Verify banned-strings**

Run: `bash scripts/check-banned-strings.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/upgrades/ templates/launchd/
git commit -m "Task 14: Mac power upgrade docs + 9 launchd plist templates"
git push
```

---

## Task 15: GitHub Actions CI workflow

Mac + Windows runners run `setup.sh` / `setup.ps1` on every push. CI failure blocks merge.

**Files:**
- Create: `.github/workflows/install.yml`

**Interfaces:**
- Consumes: GitHub Actions secrets `GH_TOKEN` (for `gh auth login --with-token`) and `ANTHROPIC_API_KEY` (for non-interactive claude auth or credential-file mock)
- Produces: green check on PRs when both runners pass

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/install.yml`:

```yaml
name: Install Smoke Test

on:
  push:
    branches: [main, 'feat/**']
  pull_request:
    branches: [main]

jobs:
  mac:
    runs-on: macos-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Set up gh auth (non-interactive)
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        run: |
          echo "$GH_TOKEN" | gh auth login --with-token
          gh auth status
      - name: Run unit tests
        run: node --test bin/lib/__tests__/ bin/lib/steps/__tests__/
      - name: Run setup.sh in scratch HOME
        env:
          KIT_SETUP_RELAUNCHED: '1'
          HOME: /tmp/sk-test-home
        run: |
          mkdir -p $HOME
          ./setup.sh || (cat $HOME/Desktop/starter-kit-broke-*.txt 2>/dev/null; exit 1)
      - name: Verify install
        env:
          HOME: /tmp/sk-test-home
        run: |
          ls $HOME/Projects/_brain/ || exit 1
          test -f $HOME/.claude/settings.json || exit 1
          # Skip the full /verify check (it needs a real Claude session); instead verify file shape.
          test -f $HOME/Projects/_brain/Armory/Cheatsheets/System-Manifest.md || exit 1
          ls $HOME/Projects/_brain/Armory/Notes/ | wc -l

  windows:
    runs-on: windows-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Set up gh auth (non-interactive)
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        run: |
          echo "$env:GH_TOKEN" | gh auth login --with-token
          gh auth status
      - name: Run unit tests
        run: node --test bin/lib/__tests__/ bin/lib/steps/__tests__/
      - name: Run setup.ps1 in scratch USERPROFILE
        env:
          KIT_SETUP_RELAUNCHED: '1'
          USERPROFILE: C:\sk-test-home
          HOME: C:\sk-test-home
        run: |
          New-Item -ItemType Directory -Force -Path $env:USERPROFILE | Out-Null
          .\setup.ps1
          if ($LASTEXITCODE -ne 0) {
            Get-Content -Path "$env:USERPROFILE\Desktop\starter-kit-broke-*.txt" -ErrorAction SilentlyContinue
            exit 1
          }
      - name: Verify install
        env:
          USERPROFILE: C:\sk-test-home
        run: |
          if (-not (Test-Path "$env:USERPROFILE\Projects\_brain")) { exit 1 }
          if (-not (Test-Path "$env:USERPROFILE\.claude\settings.json")) { exit 1 }
          if (-not (Test-Path "$env:USERPROFILE\Projects\_brain\Armory\Cheatsheets\System-Manifest.md")) { exit 1 }
```

- [ ] **Step 2: Document required secrets**

Append to the workflow file as a top comment:

```yaml
# Required repository secrets:
# - GH_TOKEN: a fine-grained GitHub PAT with no scopes (just for gh auth login --with-token).
#   In repo settings → Secrets and variables → Actions → New repository secret.
# - ANTHROPIC_API_KEY: (currently unused — placeholder for future claude-auth tests).
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/install.yml
git commit -m "Task 15: GitHub Actions install smoke-test on Mac + Windows runners"
git push
```

- [ ] **Step 4: Watch first CI run**

Go to the repo's Actions tab. The push you just made triggers both runners. Watch for ~10 minutes. If either fails, capture the log and iterate on the runners-specific config (probably PATH issues or auth token gotchas).

Expected: both runners green on the first push. Realistic: at least one round of fixing — that's why CI exists.

---

## Task 16: Pre-publish sanitization sweep + final review

Comprehensive review of every changed file before merging to main. Run the banned-strings check across the entire tree. Read each new file as if you're seeing it for the first time.

**Files:** All v2 changes — no specific edits in this task unless the sweep finds issues.

- [ ] **Step 1: Run the banned-strings check across the full tree**

```bash
git ls-files | xargs -I {} bash scripts/check-banned-strings.sh {} 2>&1 | grep -v "^$"
```

Expected: zero violations. If any appear, fix them and re-run.

- [ ] **Step 2: List every file changed since v1**

```bash
git diff --name-only main..feat/v2-build
```

Expected: ~40 files (16 new files, ~10 modified, plus test files and content updates).

- [ ] **Step 3: Read each new/modified file for sanity**

For each file in the diff:
- Open it.
- Skim for anything that looks like a leak, a placeholder that didn't get filled in, a TODO comment, or a reference to a v1 structure that no longer exists.
- Fix anything that looks wrong.

Spend ~30 seconds per file on average; longer for the larger ones (SKILL.md files, PRE-INSTALL.md, mac-daemons.md).

- [ ] **Step 4: Run the full test suite**

```bash
node --test bin/lib/__tests__/ bin/lib/steps/__tests__/
```

Expected: all tests PASS.

- [ ] **Step 5: Run setup.sh in scratch HOME one more time**

```bash
rm -rf /tmp/sk-test-final
HOME=/tmp/sk-test-final ./setup.sh
ls /tmp/sk-test-final/Projects/_brain/Armory/Notes/ | wc -l
cat /tmp/sk-test-final/.mcp.json | python3 -m json.tool | head -30
```

Expected: 10 seed notes, `.mcp.json` lists `lean-ctx`, `armory`, `council`.

- [ ] **Step 6: Commit any sweep fixes**

```bash
git add .
git commit -m "Task 16: pre-publish sanitization sweep + final cleanups"
git push
```

(Skip this step if the sweep produced no changes.)

---

## Task 17: Windows manual smoke + merge + tag + ship

The one task that cannot be automated: actual hands-on Windows install. Use Windows Sandbox (free, built into Windows 11 Pro) or a Parallels/UTM VM.

**Files:** None modified in this task — verification only.

- [ ] **Step 1: Set up a Windows sandbox**

Options:
- **Windows Sandbox** (Win 11 Pro): enable "Windows Sandbox" feature, launch from Start menu. Each session is throwaway.
- **UTM** (Mac): create a Windows 11 VM with 60 GB disk.
- **Parallels** ($): same.

Whichever you pick, the goal is a fresh Windows 11 environment with nothing installed.

- [ ] **Step 2: Walk through PRE-INSTALL.md as the friend would**

Without using your developer instincts, follow `docs/PRE-INSTALL.md` Windows track top to bottom. Create a fresh GitHub test account (or use a throwaway). Activate a Claude Code pass (or stop here if cost is a blocker — at minimum verify steps 1-7).

- [ ] **Step 3: Run setup.ps1**

```powershell
cd $HOME
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
git checkout feat/v2-build
.\setup.ps1
```

Watch the prereq check + auth checkpoints + finisher + smoke test. Note anything that's unclear or breaks.

- [ ] **Step 4: Run /verify**

```powershell
claude -p "/verify"
```

Expected: all 5 checks PASS.

- [ ] **Step 5: Run /welcome and answer "B" (Adopter)**

```powershell
claude -p "/welcome"
```

Follow the Adopter track. Verify it lands cleanly on a "next thing to try" prompt.

- [ ] **Step 6: Fix anything that broke**

For each issue: file a separate commit on `feat/v2-build` that fixes it. Re-run setup in a fresh sandbox to confirm.

- [ ] **Step 7: Merge feat/v2-build → main**

After everything's green and sandbox-tested:

```bash
cd ~/Projects/Claude-Code-Starter-Kit
git checkout main
git merge --no-ff feat/v2-build -m "Merge feat/v2-build: v2 kit"
git tag v2.0.0
git push origin main --tags
```

- [ ] **Step 8: Send the friend the kit**

Send him:
1. The link: https://github.com/CAdidas333/claude-code-starter-kit
2. A one-liner: "Read PRE-INSTALL.md first, then run setup.ps1. Text me the file on your Desktop if anything breaks."

---

## Self-Review

After writing this plan, checking it against the spec:

**1. Spec coverage:**
- Spec §1 (Why v2) → covered by plan goal + Task 0 context refresh.
- Spec §2 (Scope ceiling: Full surface) → Tasks 3-7, 12-14 ship the new content.
- Spec §3 (Overall flow) → Tasks 1, 9, 11 implement the pre-install → setup → welcome flow.
- Spec §4 (What ships) → Tasks 3 (Armory), 4 (Council), 6 (8 skills), 7 (/verify), 12 (manifest + seeds), 13 (cron recipe), 14 (Mac upgrade).
- Spec §5 (Install choreography) → Tasks 1 (pre-install), 2 (lean-ctx), 5 (Council wiring), 8-10 (error report + PATH self-heal).
- Spec §6 (/welcome two-track) → Task 11.
- Spec §7 (Verification + CI) → Tasks 7 (/verify), 8-9 (error channel), 15 (CI), 17 (manual smoke).

No gaps.

**2. Placeholder scan:** No "TBD", "TODO", or "implement later" in steps. Some content steps reference source files (e.g., "lift content from `~/Projects/_brain/Armory/Notes/<source>`") — that's correct because the source notes already contain the verified content; the task is sanitize-and-import, not invent-from-scratch.

**3. Type consistency:**
- `pickLeanCtxInstaller({platform, has})` signature consistent in Task 2 test and implementation.
- `writeErrorReport({step, command, stderr, desktopOverride})` signature consistent in Task 8 test and implementation.
- `KIT_FILES.skills` array updated in Tasks 6 and 12 to consistent ordering.

**4. Ambiguity:**
- Task 7's `/verify` Check 2 "hooks fire on a test edit" — flagged in spec §10. The plan specifies a stable path (`~/Projects/_starter-kit-verify/probe.md`) and cleanup. Less flaky than relying on whatever directory the user is in.
- Task 12's manifest update has a conditional ("If hardcoded… If glob-based…"). Plan-time uncertainty; resolution depends on what v1's manifest actually does. Either branch produces the same end state. Acceptable.

End of plan.
