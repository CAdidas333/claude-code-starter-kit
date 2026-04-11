# Claude Code Starter Kit v1 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete, opinionated Claude Code starter kit that takes a new user from zero to productive in under 20 minutes, cross-platform (Mac + Windows), with guided onboarding via a `/welcome` skill, all content sanitized clean of the maintainer's private project references.

**Architecture:** Five-layer design. Layer 1 = tiny OS-specific installers (`setup.sh` / `setup.ps1`). Layer 2 = cross-platform Node.js finisher (`bin/finish-setup.js`) that does 90% of the heavy lifting identically on both platforms. Layer 3 = `/welcome` skill that runs inside Claude Code and personalizes via interactive interview. Layer 4 = documentation set. Layer 5 = content payload (templates, skills, hooks, MCP servers).

**Tech Stack:** Bash (Mac installer), PowerShell (Windows installer), Node.js 20+ (cross-platform finisher), Markdown (docs + skills + templates), git + gh CLI (installer deps), lean-ctx MCP (bundled via npm), Armory MCP (vendored from `CAdidas333/Armory`).

**Private Reference:** The full design doc with banned strings list, scope rationale, and sanitization procedures lives at `~/Projects/_brain/docs/plans/2026-04-10-claude-code-starter-kit-design.md`. This plan references that doc rather than duplicating sensitive content.

**Execution Discipline:**
- TDD where applicable (installer code, /welcome skill, pre-commit hook)
- Verification-based where TDD doesn't fit (markdown content, sanitization)
- Every phase ends with a hard verification gate before moving on
- Pre-publish review checkpoint (Phase 12) is a mandatory stop — no content goes public until maintainer approves

---

## Phase 0 — Maintainer Review of This Plan

**Before any task in Phase 1 begins**, the maintainer reviews this plan end-to-end and either approves it or requests changes. No implementation work starts until the plan is approved.

**Gate:** Maintainer types "approved" or equivalent. Any pushback resets that phase's tasks.

---

## Phase 1 — Sanitization Tooling (Build the Safety Net First)

**Why first:** Every subsequent phase writes files that must pass the banned-strings check. We build the check before we write anything else, so it's impossible to commit contamination from Task 1 onward.

### Task 1.1: Create the local banned-strings config mechanism

**Files:**
- Create: `scripts/check-banned-strings.sh`
- Create: `.banned-strings.example` (template committed to repo)
- Modify: `.gitignore` (add `.banned-strings` to the private, local list)

**Step 1: Update `.gitignore`**

Add these lines to `.gitignore`:
```
# Maintainer's private banned-strings list (not committed)
.banned-strings
```

**Step 2: Write `.banned-strings.example`**

This is the PUBLIC example that ships with the repo. It contains placeholder categories only — no actual sensitive strings:

```
# Banned Strings — Example Template
#
# Copy this file to `.banned-strings` (which is .gitignored) and fill in
# with any strings you want the pre-commit hook to block from public commits.
# Use one entry per line. Blank lines and lines starting with # are ignored.
# Matching is word-boundary regex (case-insensitive by default).
#
# Example categories:
#
# Your project names:
# MyProject
# MyApp
#
# People and entities you don't want to mention:
# SomeCompany
# SomePerson
#
# Industry jargon from your work:
# DomainTerm
# JargonWord
#
# ALLOW LIST: strings that are banned elsewhere but OK in specific files.
# Format: "string" allowed_in: path1,path2
# Example:
# Your Name | LICENSE,README.md,docs/CHEATSHEET.md
```

**Step 3: Write `scripts/check-banned-strings.sh`**

```bash
#!/usr/bin/env bash
# Banned-strings pre-commit check
# Reads .banned-strings (if present), uses word-boundary matching,
# supports path-scoped exceptions.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
BANNED_FILE="${REPO_ROOT}/.banned-strings"

# If no banned-strings file, skip silently (not configured)
if [ ! -f "$BANNED_FILE" ]; then
    echo "ℹ️  No .banned-strings file found. Skipping banned-strings check."
    echo "   To enable, copy .banned-strings.example to .banned-strings and fill it in."
    exit 0
fi

# Parse banned-strings file into two lists: strict bans and allow-list exceptions
STRICT_BANS=()
declare -A ALLOW_LIST  # string -> comma-separated paths

while IFS= read -r line; do
    # Skip blank lines and comments
    [[ -z "$line" || "$line" =~ ^# ]] && continue

    # Check for allow-list syntax: "string | path1,path2"
    if [[ "$line" =~ ^(.+)\|(.+)$ ]]; then
        key="$(echo "${BASH_REMATCH[1]}" | xargs)"
        paths="$(echo "${BASH_REMATCH[2]}" | xargs)"
        ALLOW_LIST["$key"]="$paths"
    else
        STRICT_BANS+=("$(echo "$line" | xargs)")
    fi
done < "$BANNED_FILE"

# Files to check (staged if in a git commit context, otherwise all tracked files)
if git diff --cached --name-only --quiet 2>/dev/null; then
    FILES=$(git ls-files 2>/dev/null || find . -type f -not -path './.git/*' -not -path './node_modules/*')
else
    FILES=$(git diff --cached --name-only --diff-filter=ACMR)
fi

VIOLATIONS=0

# Strict ban check
for ban in "${STRICT_BANS[@]}"; do
    [ -z "$ban" ] && continue
    # Word-boundary, case-insensitive regex
    # Use \b in Perl mode for proper word boundaries
    if echo "$FILES" | xargs -I {} grep -lniE "\b${ban}\b" {} 2>/dev/null | head -20 > /tmp/ban_hits_$$; then
        if [ -s /tmp/ban_hits_$$ ]; then
            echo "❌ Banned string found: \"$ban\""
            while IFS= read -r file; do
                grep -niE "\b${ban}\b" "$file" 2>/dev/null | head -5 | while IFS= read -r hit; do
                    echo "   $file:$hit"
                done
            done < /tmp/ban_hits_$$
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
        rm -f /tmp/ban_hits_$$
    fi
done

# Allow-list check (same string, but only flag if found OUTSIDE allowed paths)
for key in "${!ALLOW_LIST[@]}"; do
    allowed_paths="${ALLOW_LIST[$key]}"
    # Build a regex of allowed paths for grep -v
    allow_pattern=$(echo "$allowed_paths" | sed 's/,/\\|/g')

    echo "$FILES" | while IFS= read -r file; do
        [ -z "$file" ] && continue
        # Skip if this file is in the allowed list
        if echo "$file" | grep -qE "^($allow_pattern)$"; then
            continue
        fi
        if grep -qniE "\b${key}\b" "$file" 2>/dev/null; then
            echo "❌ Allow-list string \"$key\" found outside permitted paths: $file"
            grep -niE "\b${key}\b" "$file" 2>/dev/null | head -3 | while IFS= read -r hit; do
                echo "   $file:$hit"
            done
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
    done
done

if [ "$VIOLATIONS" -gt 0 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED: $VIOLATIONS banned string violation(s) found."
    echo "   Fix these before committing, or edit .banned-strings if the entry is wrong."
    exit 1
fi

echo "✓ Banned-strings check passed."
exit 0
```

**Step 4: Make the script executable**

Run: `chmod +x scripts/check-banned-strings.sh`
Expected: no output, script is now executable.

**Step 5: Write the failing test (negative case)**

Create a scratch file with a known "banned" string, run the hook, verify it fails:

```bash
# Create a test .banned-strings with a distinctive test string
echo "TESTSTRING_DONOTUSE" > .banned-strings
# Create a file that contains the banned string
echo "This file has TESTSTRING_DONOTUSE in it." > test_violation.txt
git add test_violation.txt
./scripts/check-banned-strings.sh
```

Expected: exit code 1, message "❌ Banned string found: TESTSTRING_DONOTUSE" pointing to test_violation.txt.

**Step 6: Clean up the test**

```bash
rm test_violation.txt .banned-strings
git reset HEAD test_violation.txt 2>/dev/null || true
```

**Step 7: Write the positive test (clean files pass)**

```bash
# No .banned-strings file → should skip cleanly
./scripts/check-banned-strings.sh
```

Expected: exit code 0, message "ℹ️ No .banned-strings file found. Skipping..."

**Step 8: Commit**

```bash
git add .gitignore .banned-strings.example scripts/check-banned-strings.sh
git commit -m "Add banned-strings pre-commit hook with word-boundary matching

Implements Layer 2 of the sanitization defense. Uses word boundaries
to avoid false positives on common English words. Supports path-scoped
allow-list exceptions for strings that are banned globally but OK in
specific files (e.g. the maintainer's name in LICENSE/README)."
```

### Task 1.2: Install the banned-strings hook as a git pre-commit hook

**Files:**
- Create: `scripts/install-hooks.sh`

**Step 1: Write the hook installer**

```bash
#!/usr/bin/env bash
# Install git hooks for this repo
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_DIR="${REPO_ROOT}/.git/hooks"

mkdir -p "$HOOK_DIR"

# Write the pre-commit hook that calls our banned-strings check
cat > "${HOOK_DIR}/pre-commit" <<'EOF'
#!/usr/bin/env bash
exec "$(git rev-parse --show-toplevel)/scripts/check-banned-strings.sh"
EOF

chmod +x "${HOOK_DIR}/pre-commit"

echo "✓ Installed pre-commit hook: ${HOOK_DIR}/pre-commit"
echo "  → runs scripts/check-banned-strings.sh on every commit"
```

**Step 2: Make it executable and run it**

```bash
chmod +x scripts/install-hooks.sh
./scripts/install-hooks.sh
```

Expected: `✓ Installed pre-commit hook` message.

**Step 3: Verify the hook fires on commit**

```bash
# Create a dummy file that passes (empty or trivial content)
touch test_commit.txt
git add test_commit.txt
git commit -m "test: verify hook fires"
```

Expected: commit succeeds, and in the output you see `✓ Banned-strings check passed.` from the hook.

**Step 4: Clean up test file**

```bash
git rm test_commit.txt
git commit -m "test: remove verification file"
```

**Step 5: Commit the hook installer**

```bash
git add scripts/install-hooks.sh
git commit -m "Add git hook installer script"
```

### Task 1.3: Populate the real (private) .banned-strings file

**Files:**
- Create (LOCAL ONLY, not committed): `.banned-strings`

**Step 1: Copy the example and fill it in from the private design doc**

The actual banned strings list is in `~/Projects/_brain/docs/plans/2026-04-10-claude-code-starter-kit-design.md` Section 7. Maintainer runs:

```bash
cp .banned-strings.example .banned-strings
# Edit .banned-strings to add the real strings from the design doc
# (project names, customers, brand terms, industry jargon)
# Include the allow-list entry for "Chris Whitney" in LICENSE/README/CHEATSHEET
```

**Step 2: Verify `.banned-strings` is gitignored**

```bash
git status | grep banned-strings
```

Expected: no output (file is gitignored and not visible to git status).

**Step 3: Run the hook against existing public stub files**

```bash
./scripts/check-banned-strings.sh
```

Expected: `✓ Banned-strings check passed.` (all existing files are already clean).

**Step 4: Negative test — add a file with a banned string, verify the hook blocks**

```bash
# Use an actual string from your local .banned-strings file here.
# DO NOT paste the literal string into this plan — the plan is in the
# public repo and the banned string would leak.
BANNED="$(head -n 1 .banned-strings | grep -v '^#' | head -n 1)"
echo "This file mentions $BANNED which is banned" > test_violation.md
git add test_violation.md
git commit -m "test: should fail"
```

Expected: commit BLOCKED with clear error message pointing to `test_violation.md`.

**Step 5: Clean up**

```bash
git reset HEAD test_violation.md
rm test_violation.md
```

### Gate 1: Sanitization safety net operational

- [ ] `scripts/check-banned-strings.sh` exists and is executable
- [ ] Git pre-commit hook installed and firing
- [ ] Word-boundary matching confirmed (no false positives on common English)
- [ ] Path-scoped allow-list working
- [ ] Positive test passes (clean files commit)
- [ ] Negative test fails (file with banned string is blocked)
- [ ] `.banned-strings` file populated locally, gitignored, and working

---

## Phase 2 — OS Installers

### Task 2.1: Write `setup.sh` (Mac bash installer)

**Files:**
- Create: `setup.sh`

**Step 1: Draft the installer**

```bash
#!/usr/bin/env bash
# Claude Code Starter Kit — Mac installer
# Tiny OS-level installer. Hands off to bin/finish-setup.js for the heavy lifting.

set -euo pipefail

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claude Code Starter Kit — Setup (Mac)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}This script is for macOS. Windows users: run setup.ps1 instead.${NC}"
    exit 1
fi

# --- Step 1: Check / install prerequisites ---
echo -e "${YELLOW}Checking prerequisites...${NC}"

MISSING=()

command -v brew >/dev/null 2>&1 || MISSING+=("Homebrew")
command -v git  >/dev/null 2>&1 || MISSING+=("git")
command -v node >/dev/null 2>&1 || MISSING+=("Node.js")
command -v gh   >/dev/null 2>&1 || MISSING+=("GitHub CLI")
command -v claude >/dev/null 2>&1 || MISSING+=("Claude Code")

if [ "${#MISSING[@]}" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Missing: ${MISSING[*]}${NC}"
    echo ""
    echo "I can install these for you. Here's what will happen:"
    echo ""

    for tool in "${MISSING[@]}"; do
        case "$tool" in
            "Homebrew")
                echo "  • Homebrew → official installer from https://brew.sh"
                echo "    ⚠️  macOS will ask for your password. This is normal —"
                echo "        Homebrew needs admin access to install system-wide."
                ;;
            "git")
                echo "  • git → installed via Homebrew"
                ;;
            "Node.js")
                echo "  • Node.js 20 → installed via Homebrew"
                ;;
            "GitHub CLI")
                echo "  • gh → installed via Homebrew"
                ;;
            "Claude Code")
                echo "  • Claude Code → installed via npm"
                ;;
        esac
    done
    echo ""
    read -p "Continue? [Y/n] " -n 1 -r
    echo ""
    if [[ ! "$REPLY" =~ ^[Yy]?$ ]]; then
        echo "Cancelled. Install prerequisites manually and re-run."
        exit 1
    fi

    # Install Homebrew if missing
    if [[ " ${MISSING[*]} " =~ " Homebrew " ]]; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi

    # Refresh PATH for this script
    if [ -f /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi

    # Install git, node, gh via brew (no-op if already present)
    for tool in git node gh; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            brew install "$tool"
        fi
    done

    # Install Claude Code via npm
    if ! command -v claude >/dev/null 2>&1; then
        npm install -g @anthropic-ai/claude-code
    fi
fi

echo -e "${GREEN}✓ All prerequisites present.${NC}"
echo ""

# --- Step 2: GitHub auth (interactive) ---
echo -e "${YELLOW}Setting up GitHub access...${NC}"
if ! gh auth status >/dev/null 2>&1; then
    echo "You'll be asked to authenticate with GitHub."
    echo "If you don't have a GitHub account yet, create one at https://github.com/signup"
    echo "and then press any key to continue..."
    read -n 1 -s
    gh auth login
fi
echo -e "${GREEN}✓ GitHub authenticated.${NC}"
echo ""

# --- Step 3: Hand off to the cross-platform finisher ---
echo -e "${YELLOW}Running cross-platform finisher...${NC}"
echo ""

node "${SCRIPT_DIR}/bin/finish-setup.js"

# finish-setup.js prints its own completion message
```

**Step 2: Make executable**

```bash
chmod +x setup.sh
```

**Step 3: Run banned-strings check on new file**

```bash
./scripts/check-banned-strings.sh
```

Expected: ✓ pass.

**Step 4: Commit**

```bash
git add setup.sh
git commit -m "Add Mac setup.sh — OS-level installer + handoff to finisher"
```

### Task 2.2: Write `setup.ps1` (Windows PowerShell installer)

**Files:**
- Create: `setup.ps1`

**Step 1: Draft the installer**

```powershell
# Claude Code Starter Kit — Windows installer
# Tiny OS-level installer. Hands off to bin/finish-setup.js for the heavy lifting.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Claude Code Starter Kit — Setup (Win)" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# --- Step 1: Check prerequisites ---
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$Missing = @()

function Test-Command($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "winget")) { $Missing += "winget (Windows Package Manager)" }
if (-not (Test-Command "git"))    { $Missing += "git" }
if (-not (Test-Command "node"))   { $Missing += "Node.js" }
if (-not (Test-Command "gh"))     { $Missing += "GitHub CLI" }
if (-not (Test-Command "claude")) { $Missing += "Claude Code" }

if ($Missing.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing: $($Missing -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "I'll install these via winget (Windows Package Manager)."
    Write-Host "You may be prompted to accept licenses or approve installs."
    Write-Host ""
    $Continue = Read-Host "Continue? [Y/n]"
    if ($Continue -and $Continue.ToLower() -ne "y") {
        Write-Host "Cancelled. Install prerequisites manually and re-run."
        exit 1
    }

    if (-not (Test-Command "winget")) {
        Write-Host "winget is not available. Please install it from the Microsoft Store:"
        Write-Host "https://aka.ms/getwinget"
        Write-Host "Then re-run this script."
        exit 1
    }

    if (-not (Test-Command "git"))    { winget install --id Git.Git -e --silent }
    if (-not (Test-Command "node"))   { winget install --id OpenJS.NodeJS.LTS -e --silent }
    if (-not (Test-Command "gh"))     { winget install --id GitHub.cli -e --silent }

    # Refresh PATH so newly installed tools are visible
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path", "User")

    if (-not (Test-Command "claude")) {
        npm install -g "@anthropic-ai/claude-code"
    }
}

Write-Host "✓ All prerequisites present." -ForegroundColor Green
Write-Host ""

# --- Step 2: GitHub auth ---
Write-Host "Setting up GitHub access..." -ForegroundColor Yellow
$GhStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "You'll be asked to authenticate with GitHub."
    Write-Host "If you don't have a GitHub account yet, create one at https://github.com/signup"
    Read-Host "Press Enter to continue"
    gh auth login
}
Write-Host "✓ GitHub authenticated." -ForegroundColor Green
Write-Host ""

# --- Step 3: Hand off to the cross-platform finisher ---
Write-Host "Running cross-platform finisher..." -ForegroundColor Yellow
Write-Host ""

node "$ScriptDir\bin\finish-setup.js"
```

**Step 2: Banned-strings check**

```bash
./scripts/check-banned-strings.sh
```

Expected: ✓ pass.

**Step 3: Commit**

```bash
git add setup.ps1
git commit -m "Add Windows setup.ps1 — PowerShell OS installer"
```

### Gate 2: OS installers drafted

- [ ] `setup.sh` exists, executable, syntactically valid (`bash -n setup.sh`)
- [ ] `setup.ps1` exists, syntactically valid (will test on Windows in Phase 11)
- [ ] Both pass banned-strings check
- [ ] Both committed

---

## Phase 3 — Cross-Platform Finisher (`bin/finish-setup.js`)

This is the workhorse. Does everything once OS prereqs are in place.

### Task 3.1: Project scaffolding for the finisher

**Files:**
- Create: `bin/finish-setup.js`
- Create: `bin/lib/paths.js`
- Create: `bin/lib/logger.js`
- Create: `bin/lib/manifest.js`
- Create: `bin/lib/steps/` (directory)

**Step 1: Write `bin/lib/paths.js`** — resolves home dir, project paths cross-platform

```javascript
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const PROJECTS = path.join(HOME, 'Projects');
const BRAIN = path.join(PROJECTS, '_brain');
const CLAUDE_DIR = path.join(HOME, '.claude');
const CLAUDE_SKILLS = path.join(CLAUDE_DIR, 'skills');
const CLAUDE_AGENTS = path.join(CLAUDE_DIR, 'agents');
const CLAUDE_HOOKS = path.join(CLAUDE_DIR, 'hooks');
const CLAUDE_SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const MCP_CONFIG = path.join(HOME, '.mcp.json');
const WELCOME_MARKER = path.join(CLAUDE_DIR, '.welcome-pending');

module.exports = {
  HOME, PROJECTS, BRAIN,
  CLAUDE_DIR, CLAUDE_SKILLS, CLAUDE_AGENTS, CLAUDE_HOOKS, CLAUDE_SETTINGS,
  MCP_CONFIG, WELCOME_MARKER,
};
```

**Step 2: Write `bin/lib/logger.js`** — minimal colored output

```javascript
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Disable colors on Windows cmd/powershell if not supported
const useColor = process.stdout.isTTY && process.platform !== 'win32' || process.env.FORCE_COLOR;

function c(color, text) {
  if (!useColor) return text;
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

module.exports = {
  step:    (msg) => console.log(c('yellow', '→ ') + msg),
  ok:      (msg) => console.log(c('green',  '✓ ') + msg),
  warn:    (msg) => console.log(c('yellow', '⚠ ') + msg),
  fail:    (msg) => console.log(c('red',    '✗ ') + msg),
  header:  (msg) => {
    console.log('');
    console.log(c('blue', '═══ ' + msg + ' ═══'));
  },
  blank:   () => console.log(''),
};
```

**Step 3: Write `bin/lib/manifest.js`** — the file allow-list (Layer 1 of sanitization)

```javascript
// KIT_FILES = the explicit allow-list of files shipped by the finisher.
// Adding a file here is a deliberate action. Never use cp -r or similar
// bulk operations — if a file isn't on this list, it doesn't ship.

const path = require('path');

// kitRoot is resolved relative to bin/finish-setup.js location
// src paths are relative to the kit repo root
// dst paths are relative to the appropriate destination (brain, claude dir, etc.)

const KIT_FILES = {
  // Brain scaffold → ~/Projects/_brain/
  brain: [
    'templates/_brain/Dashboard.md',
    'templates/_brain/README.md',
    'templates/_brain/Feedback/Working-Style.md',
    'templates/_brain/Feedback/Code-Standards.md',
    'templates/_brain/Decisions/README.md',
    'templates/_brain/Features/README.md',
    'templates/_brain/Ideas/_Inbox.md',
    'templates/_brain/Launch/README.md',
    'templates/_brain/IP/README.md',
    'templates/_brain/Templates/Braindump.md',
    'templates/_brain/Templates/Explored-Idea.md',
    'templates/_brain/Templates/New-Project-Bootstrap.md',
    'templates/_brain/Armory/README.md',
    'templates/_brain/Armory/Focus.md',
    'templates/_brain/Armory/Index.md',
  ],

  // Skills → ~/.claude/skills/<name>/SKILL.md
  skills: [
    'welcome', 'new-project', 'today', 'wrap', 'status-report',
    'ingest', 'digest', 'investigate', 'scout', 'audit',
    'morning-brief', 'memory-md-management',
  ],

  // Agents → ~/.claude/agents/<name>.md
  agents: ['context-updater', 'brain-updater'],

  // Hooks → ~/.claude/hooks/<name>
  hooks: [
    'overwatch-session-start.sh',
    'overwatch-context-guard.sh',
    'code-reviewer-prompt.md',
  ],

  // ~/Projects (root CLAUDE.md)
  rootClaude: 'templates/CLAUDE.md',

  // ~/.claude/settings.json (merge, don't overwrite)
  settings: 'templates/settings.json',

  // ~/.mcp.json (merge, don't overwrite)
  mcp: 'templates/mcp.json',

  // Armory seed notes → ~/Projects/_brain/Armory/Notes/
  armorySeeds: [
    'armory-seeds/plan-mode-first.md',
    'armory-seeds/context-forty-percent-rule.md',
    'armory-seeds/vertical-slices.md',
  ],
};

module.exports = { KIT_FILES };
```

**Step 4: Write skeleton `bin/finish-setup.js`**

```javascript
#!/usr/bin/env node
// Cross-platform finisher for the Claude Code Starter Kit.
// Runs identically on Mac and Windows once Node + Claude Code are present.
// Idempotent — safe to re-run for updates or recovery.

const path = require('path');
const log = require('./lib/logger');
const paths = require('./lib/paths');

async function main() {
  log.header('Claude Code Starter Kit — Finisher');
  log.blank();

  const kitRoot = path.resolve(__dirname, '..');
  log.step(`Kit source: ${kitRoot}`);
  log.step(`Workspace:  ${paths.PROJECTS}`);
  log.blank();

  // Each step is a separate module in bin/lib/steps/
  // They are idempotent and can be skipped/re-run independently
  const steps = [
    require('./lib/steps/01-create-workspace'),
    require('./lib/steps/02-install-brain-templates'),
    require('./lib/steps/03-install-skills'),
    require('./lib/steps/04-install-agents'),
    require('./lib/steps/05-install-hooks'),
    require('./lib/steps/06-merge-settings'),
    require('./lib/steps/07-install-mcps'),
    require('./lib/steps/08-initialize-git'),
    require('./lib/steps/09-write-welcome-marker'),
    require('./lib/steps/10-verify'),
  ];

  for (const step of steps) {
    try {
      await step.run(kitRoot);
    } catch (err) {
      if (step.fatal !== false) {
        log.fail(`${step.name} failed: ${err.message}`);
        process.exit(1);
      } else {
        log.warn(`${step.name} had a non-fatal error: ${err.message}`);
        log.warn(`Continuing. You can re-run to retry this step.`);
      }
    }
  }

  log.blank();
  log.header('Setup Complete');
  log.blank();
  log.ok('Next step — copy-paste this one command:');
  log.blank();
  console.log('    cd ~/Projects && claude');
  log.blank();
  log.ok('When Claude starts, type:  /welcome');
  log.blank();
}

main().catch((err) => {
  log.fail(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
```

**Step 5: Banned-strings check**

```bash
./scripts/check-banned-strings.sh
```

**Step 6: Commit**

```bash
git add bin/finish-setup.js bin/lib/paths.js bin/lib/logger.js bin/lib/manifest.js
git commit -m "Scaffold cross-platform finisher with step-based architecture

Steps are modular and idempotent. finish-setup.js orchestrates them
and handles fatal vs non-fatal errors. Each step lives in bin/lib/steps/
and can be re-run independently."
```

### Task 3.2–3.11: Implement each finisher step

Each step is a task with its own test + implementation cycle. Structure:

```
bin/lib/steps/
  01-create-workspace.js      → mkdirs ~/Projects, _brain scaffold
  02-install-brain-templates.js → copy templates/_brain/* into ~/Projects/_brain
  03-install-skills.js        → copy skills/*/SKILL.md into ~/.claude/skills/
  04-install-agents.js        → copy agents/*.md into ~/.claude/agents/
  05-install-hooks.js         → copy hooks/* into ~/.claude/hooks/, chmod +x
  06-merge-settings.js        → read existing settings.json, merge ours, write
  07-install-mcps.js          → npm install lean-ctx, vendor Armory MCP, write .mcp.json
  08-initialize-git.js        → git init ~/Projects/_brain, first commit
  09-write-welcome-marker.js  → write ~/.claude/.welcome-pending (signals /welcome skill)
  10-verify.js                → verify all expected files exist and are readable
```

Each file has this shape:

```javascript
// bin/lib/steps/0N-<name>.js
const log = require('../logger');

module.exports = {
  name: '0N: <description>',
  fatal: true,  // or false for MCP install etc.
  async run(kitRoot) {
    log.header(module.exports.name);
    // implementation
    log.ok('Step complete');
  },
};
```

**Detailed implementation for each step follows the pattern below** (showing step 01 as the template):

#### Task 3.2: Step 01 — Create workspace

**Files:**
- Create: `bin/lib/steps/01-create-workspace.js`

```javascript
const fs = require('fs');
const path = require('path');
const log = require('../logger');
const paths = require('../paths');

const DIRS_TO_CREATE = [
  paths.PROJECTS,
  paths.BRAIN,
  path.join(paths.BRAIN, 'Feedback'),
  path.join(paths.BRAIN, 'Decisions'),
  path.join(paths.BRAIN, 'Features'),
  path.join(paths.BRAIN, 'Launch'),
  path.join(paths.BRAIN, 'IP'),
  path.join(paths.BRAIN, 'Ideas'),
  path.join(paths.BRAIN, 'Ideas', 'Braindumps'),
  path.join(paths.BRAIN, 'Ideas', 'Explored'),
  path.join(paths.BRAIN, 'Templates'),
  path.join(paths.BRAIN, 'Armory'),
  path.join(paths.BRAIN, 'Armory', 'Cheatsheets'),
  path.join(paths.BRAIN, 'Armory', 'Notes'),
  path.join(paths.BRAIN, 'Armory', 'Investigations'),
  path.join(paths.BRAIN, 'Armory', 'Digests'),
  paths.CLAUDE_DIR,
  paths.CLAUDE_SKILLS,
  paths.CLAUDE_AGENTS,
  paths.CLAUDE_HOOKS,
];

module.exports = {
  name: '01: Create workspace directories',
  fatal: true,
  async run() {
    log.header(module.exports.name);
    for (const dir of DIRS_TO_CREATE) {
      fs.mkdirSync(dir, { recursive: true });
    }
    log.ok(`Created ${DIRS_TO_CREATE.length} directories`);
  },
};
```

Verification:
```bash
node -e "require('./bin/lib/steps/01-create-workspace').run().then(() => console.log('OK'))"
ls ~/Projects/_brain/Armory/Notes/  # should exist
```

Commit:
```bash
git add bin/lib/steps/01-create-workspace.js
git commit -m "Finisher step 01: create workspace directory structure"
```

**Tasks 3.3 through 3.11 follow the same pattern** — one step module each, with a test (run in isolation), a verification command, and a commit.

For brevity in this plan, the remaining steps (02-10) are summarized. The executing agent reads the private design doc for exact semantics and implements following the pattern above:

- **Step 02 (install-brain-templates)**: iterate `manifest.KIT_FILES.brain`, copy each from `kitRoot/<src>` to `paths.BRAIN/<dst>` if destination doesn't already exist (don't overwrite user's work)
- **Step 03 (install-skills)**: for each skill in `manifest.KIT_FILES.skills`, copy `kitRoot/skills/<name>/SKILL.md` → `paths.CLAUDE_SKILLS/<name>/SKILL.md` (mkdir as needed, overwrite is OK since skill updates should flow)
- **Step 04 (install-agents)**: same pattern for agents
- **Step 05 (install-hooks)**: copy hooks, **chmod +x** on `.sh` files
- **Step 06 (merge-settings)**: read existing `paths.CLAUDE_SETTINGS` if exists, deep-merge with `templates/settings.json`, write back. Preserve user's existing permissions, plugins, hooks — only ADD our entries, never remove theirs
- **Step 07 (install-mcps)**: `npm install -g @lean-ctx/cli` (or whatever the lean-ctx package is — verify during build), vendor Armory MCP source into `~/.claude-starter-kit/mcp-servers/armory`, run `npm install` there, write/merge `~/.mcp.json`. **Non-fatal** — if either MCP install fails, warn and continue
- **Step 08 (initialize-git)**: if `paths.BRAIN/.git` doesn't exist, run `git init && git add . && git commit -m "Initialize brain"`
- **Step 09 (write-welcome-marker)**: write empty file at `paths.WELCOME_MARKER` — the Overwatch hook reads this to trigger the "Run /welcome" banner on first launch
- **Step 10 (verify)**: check that each file in the manifest exists at its destination. List any missing. Print summary.

Each gets its own task, test, and commit in the same pattern.

### Gate 3: Finisher complete and end-to-end testable

- [ ] All 10 step modules exist
- [ ] Each is individually runnable and idempotent
- [ ] `node bin/finish-setup.js` runs to completion on Mac without errors
- [ ] Re-running produces no errors (idempotency confirmed)
- [ ] Each commit passes banned-strings check

---

## Phase 4 — Brain Templates

All content in `templates/_brain/` is NEW — no copying from maintainer's personal brain. Written fresh, generic.

### Tasks 4.1–4.16: Write each brain template

Each task follows this shape:

**Task 4.N:** Write `templates/_brain/<path>.md`

**Files:**
- Create: `templates/_brain/<path>.md`

**Step 1:** Write the file with generic starter content (see design doc for exact content per file)

**Step 2:** Banned-strings check

**Step 3:** Commit

**The files (one task each):**

1. `templates/_brain/Dashboard.md` — empty dashboard with "No projects yet. Run `/new-project` to add one." stub and placeholder sections
2. `templates/_brain/README.md` — explains what the brain is and how to use it
3. `templates/_brain/Feedback/Working-Style.md` — empty template, `/welcome` fills it in
4. `templates/_brain/Feedback/Code-Standards.md` — empty template with section headers
5. `templates/_brain/Decisions/README.md` — "decisions you've made that shouldn't be re-litigated go here"
6. `templates/_brain/Features/README.md` — "feature specs go here, organized by project"
7. `templates/_brain/Ideas/_Inbox.md` — header only, empty list with "how to use" note
8. `templates/_brain/Launch/README.md` — "launch/go-to-market docs go here"
9. `templates/_brain/IP/README.md` — "IP/legal/trademark tracking goes here"
10. `templates/_brain/Templates/Braindump.md` — braindump template with sections
11. `templates/_brain/Templates/Explored-Idea.md` — explored-idea template
12. `templates/_brain/Templates/New-Project-Bootstrap.md` — project bootstrap checklist template
13. `templates/_brain/Armory/README.md` — "the Armory is your knowledge vault — ingest content with /ingest"
14. `templates/_brain/Armory/Focus.md` — Focus.md template with `auto_learn: true` default and empty focus areas
15. `templates/_brain/Armory/Index.md` — Armory index template
16. `templates/CLAUDE.md` — root CLAUDE.md for `~/Projects/` with lean-ctx block + brain wiring

### Gate 4: All brain templates drafted

- [ ] 16 template files exist
- [ ] All pass banned-strings check
- [ ] All committed individually (one commit per template, for easy revert)

---

## Phase 5 — Sanitize and Import Existing Skills

This is the biggest phase. 11 existing skills need line-by-line sanitization.

**The sanitization procedure is defined in the private design doc Section 7**. The executing agent reads it once, then applies to each skill.

### Tasks 5.1–5.11: Sanitize each skill

For each skill, the task follows this shape:

**Task 5.N:** Sanitize `<skill-name>` skill

**Files:**
- Source: `~/.claude/skills/<skill-name>/SKILL.md` (maintainer's live version)
- Reference: `~/Projects/Ideas/Starter-Kit/skills/<skill-name>/SKILL.md` if present (v1 reference)
- Create: `skills/<skill-name>/SKILL.md` (kit-version)

**Step 1:** Copy source to kit location

```bash
mkdir -p skills/<skill-name>
cp ~/.claude/skills/<skill-name>/SKILL.md skills/<skill-name>/SKILL.md
```

**Step 2:** Line-by-line review (use the checklist from design doc Section 7)

**Step 3:** Replace project-specific references with generic examples:
- Any mention of maintainer's projects → generic example (habit tracker, recipe app, workout log)
- Any "when I..." anecdote → remove or rewrite generic
- Any hardcoded paths → relative paths or `$HOME` / `~/`
- Any dollar amounts or specific numbers → generic placeholders

**Step 4:** Run banned-strings check on the file

```bash
./scripts/check-banned-strings.sh
```

Expected: ✓ pass. If fail, fix and re-run.

**Step 5:** End-to-end test the skill (smoke test)
- Copy the sanitized file to `~/.claude/skills/<skill-name>/SKILL.md` in a temporary scratch dir
- Open a scratch Claude session, type `/<skill-name>` if invocable
- Verify it produces expected output without referencing removed content

**Step 6:** Commit

```bash
git add skills/<skill-name>/SKILL.md
git commit -m "Sanitize and import /<skill-name> skill

Generic examples replace project-specific references. Paths are
relative. Verified clean via banned-strings check and smoke-tested."
```

**The skills (one task each):**

- 5.1 `/new-project`
- 5.2 `/today`
- 5.3 `/wrap`
- 5.4 `/status-report`
- 5.5 `/ingest`
- 5.6 `/digest`
- 5.7 `/investigate`
- 5.8 `/scout`
- 5.9 `/audit`
- 5.10 `/morning-brief` (may ship as optional — requires Gmail MCP)
- 5.11 `/memory-md-management`

### Gate 5: All 11 skills sanitized and importable

- [ ] 11 sanitized SKILL.md files exist in `skills/`
- [ ] All pass banned-strings check
- [ ] Each committed separately for easy revert if smoke-test fails
- [ ] Smoke-tests documented (screenshot or transcript per skill)

---

## Phase 6 — Write the `/welcome` Skill (NEW)

This is the one skill that doesn't exist yet. It needs to be built from scratch.

### Task 6.1: Scaffold the skill file

**Files:**
- Create: `skills/welcome/SKILL.md`

**Step 1:** Write the skill frontmatter + opening instructions

```markdown
---
name: welcome
description: First-run onboarding skill. Interviews the user, writes personalized profile/working-style/focus files, and transitions into their first braindump. Re-runnable later to update preferences.
---

# /welcome

You are conducting a first-run onboarding interview for someone who has just
installed the Claude Code Starter Kit. Your job is to get them from "I just
ran the installer" to "I'm in my first real working session" in about 5-10
minutes.

## Critical rules

1. **One question at a time.** Never stack multiple questions.
2. **Respect the "I don't know yet" path.** If they pick Path C, do not
   push them to commit to projects. Let them skip and go straight to
   braindumping.
3. **Wispr Flow callout:** if it's their first few questions, mention that
   they can talk instead of type (voice input works great here). Don't
   repeat this every question.
4. **Write files incrementally.** If the interview is interrupted, partial
   progress should be saved. Flush after each section.
5. **End with a braindump, not a form.** The transition to "now just tell
   me what's on your mind" is the climactic moment. Make it feel inviting,
   not mechanical.

## The interview (sections in order)

### Section 1: Identity (required, short)
- Name
- What they do (job, role, or "between things")
- Mac or Windows
- Coding experience level (none / some scripting / real programming)

After Section 1, write `~/Projects/_brain/{NAME}-Profile.md`.

### Section 2: The projects fork (required)
Present three paths:
  A) "I have specific projects in mind"
  B) "I'm exploring, help me think it through"
  C) "I don't know yet, just learn as I go"

Branch:
- **Path A:** Ask them to name each project + one-sentence description.
  Write each to `~/Projects/_brain/Armory/Focus.md` with `status: active`.
- **Path B:** Run a 5-question discovery interview (problems that bug them,
  things they google a lot, curiosities). Extract provisional focus areas.
  Write with `status: exploratory` and `auto_learn: true`.
- **Path C:** Do NOT interview further. Write `Focus.md` with `auto_learn: true`,
  empty `focus_areas: []`, and `observation_window_days: 30`. Move on.

### Section 3: Working style calibration (required, 4 multiple-choice)

1. Response style: (a) short bullets (b) long explanations (c) mixed
2. Risky actions: (a) just do it (b) confirm first (c) explain and wait for go
3. Found bug: (a) fix and move (b) fix and tell (c) flag only
4. Comments: (a) when code isn't self-explanatory (b) when asked (c) never

After Section 3, write `~/Projects/_brain/Feedback/Working-Style.md`.

### Section 4: Open-ended communication note (optional, skippable)

"Anything else I should know about how you prefer to communicate?"

### Section 5: File writes announcement + transition to braindump

List the files written. Then:

"Now just tell me what's been on your mind lately. Problems that bug you,
things you wish existed, stuff you've been watching videos about. Don't try
to be organized — I'll organize it for you. When you're ready, just start
talking."

Then STOP and wait for their braindump.

## File templates

### `~/Projects/_brain/{NAME}-Profile.md`
(see design doc Appendix for exact template)

### `~/Projects/_brain/Feedback/Working-Style.md`
(see design doc Appendix for exact template)

### `~/Projects/_brain/Armory/Focus.md`
(see design doc Appendix for exact template)

## Re-run behavior

If `/welcome` is invoked AFTER onboarding is complete (detectable by
absence of `~/.claude/.welcome-pending` marker AND presence of
`{NAME}-Profile.md`), present this menu:

```
You already completed onboarding. What do you want to do?
1. Update my profile
2. Update my working style
3. Update my Armory focus areas
4. Re-run the full onboarding
5. Never mind
```

Based on selection, jump to just that section of the interview.

## On completion

After the user finishes their first braindump (detected by Claude's
judgment — they've paused, wrapped up, or asked "what's next"), delete
the `~/.claude/.welcome-pending` marker so subsequent sessions don't
re-trigger the banner.
```

**Step 2:** Banned-strings check
**Step 3:** Commit

### Task 6.2: Write the profile/working-style/focus templates referenced above

Include the exact templates inside `skills/welcome/SKILL.md` or as adjacent reference files. The design doc Section 6 has the templates — copy them verbatim.

### Task 6.3: Test /welcome end-to-end in a scratch directory

**Step 1:** Create a scratch test directory

```bash
mkdir /tmp/welcome-test
cp skills/welcome/SKILL.md ~/.claude/skills/welcome/SKILL.md
```

**Step 2:** Run a Claude session in the scratch dir

```bash
cd /tmp/welcome-test
claude
```

Inside Claude:
1. Type `/welcome`
2. Walk through Path A
3. Verify files were written to `/tmp/welcome-test/_brain/`
4. Inspect the files and confirm they match the template format

**Step 3:** Repeat for Path B and Path C in separate scratch directories

**Step 4:** Document results in `docs/context/SESSION_LOG.md`

**Step 5:** Commit fixes if any issues found

### Gate 6: /welcome skill works end-to-end

- [ ] Path A, B, C all tested in scratch directories
- [ ] All three produce correctly-formatted files
- [ ] Re-run menu works
- [ ] Marker file is correctly deleted on completion
- [ ] Commits pass banned-strings check

---

## Phase 7 — Agents + Hooks

### Task 7.1: Sanitize context-updater agent

**Files:**
- Source: `~/.claude/agents/context-updater.md`
- Create: `agents/context-updater.md`

Same sanitization procedure as skills. Line-by-line review, generic examples, banned-strings check, commit.

### Task 7.2: Sanitize brain-updater agent

Same pattern.

### Task 7.3: Sanitize overwatch-session-start.sh hook

**Files:**
- Source: `~/.claude/hooks/overwatch-session-start.sh`
- Create: `hooks/overwatch-session-start.sh`

Review for hardcoded paths, personal info. The banner output is printed on session start — make sure it's generic and not personalized.

**Critical addition:** the hook must check for `~/.claude/.welcome-pending` and print the "Run /welcome" message if present.

### Task 7.4: Sanitize overwatch-context-guard.sh hook

Same pattern.

### Task 7.5: Write code-reviewer-prompt.md

**Files:**
- Create: `hooks/code-reviewer-prompt.md`

This is the prompt text used by the PostToolUse Write|Edit code-reviewer hook. Extract from maintainer's `~/.claude/settings.json` and ship as a standalone prompt file so it's easier to iterate on. The settings.json template references it via relative path.

### Gate 7: Agents + hooks sanitized and drafted

- [ ] 2 agent files ready
- [ ] 3 hook files ready
- [ ] All executable where needed (`chmod +x` on `.sh` files)
- [ ] All committed

---

## Phase 8 — MCP Server Vendoring

### Task 8.1: Vendor the Armory MCP server

**Files:**
- Create: `mcp-servers/armory/` (directory with vendored source)

**Step 1:** Clone the Armory MCP source

```bash
git clone https://github.com/CAdidas333/Armory.git /tmp/armory-source
```

**Step 2:** Copy source into the kit, excluding `.git` and any personal data

```bash
mkdir -p mcp-servers/armory
rsync -av --exclude='.git' --exclude='node_modules' --exclude='*.log' \
      --exclude='knowledge_store.db' --exclude='config.json' \
      /tmp/armory-source/ mcp-servers/armory/
```

**Step 3:** Line-by-line review the Armory source for references to maintainer's projects in comments, README, or example data. Scrub them.

**Step 4:** Verify it builds standalone

```bash
cd mcp-servers/armory
npm install
npm run build
```

Expected: build succeeds with no errors.

**Step 5:** Banned-strings check over the whole mcp-servers directory

```bash
./scripts/check-banned-strings.sh
```

**Step 6:** Commit

```bash
git add mcp-servers/armory/
git commit -m "Vendor Armory MCP server source (sanitized)"
```

### Task 8.2: Write `templates/mcp.json` (lean-ctx + Armory wiring)

**Files:**
- Create: `templates/mcp.json`

```json
{
  "mcpServers": {
    "lean-ctx": {
      "command": "npx",
      "args": ["-y", "@lean-ctx/mcp"]
    },
    "armory": {
      "command": "node",
      "args": ["$HOME/.claude-starter-kit/mcp-servers/armory/dist/index.js"]
    }
  }
}
```

(Exact package name for lean-ctx verified during implementation — look it up.)

**Step 1:** Write file
**Step 2:** Banned-strings check
**Step 3:** Commit

### Gate 8: MCP servers vendored and wired

- [ ] Armory MCP source in `mcp-servers/armory/`, buildable
- [ ] `templates/mcp.json` references both MCPs correctly
- [ ] Banned-strings clean
- [ ] Committed

---

## Phase 9 — Settings Template

### Task 9.1: Write `templates/settings.json`

**Files:**
- Source: `~/.claude/settings.json` (maintainer's)
- Create: `templates/settings.json`

**Step 1:** Copy source

**Step 2:** Scrub:
- Remove maintainer-specific plugins (keep: superpowers, coderabbit, codex, feature-dev; remove: sentry, imessage, chrome-devtools-mcp, etc. — keep the defaults generic)
- Remove `skipDangerousModePermissionPrompt` (let user opt in)
- Keep `cleanupPeriodDays`, `effortLevel: "high"`, `voiceEnabled: true`, `autoCompactWindow: 750000`
- Ensure `hooks` block references the correct paths: `bash ~/.claude/hooks/overwatch-session-start.sh` etc.
- Keep `permissions.allow` with generic entries
- Keep `permissions.deny` with `.env*` and `secrets/**` protection

**Step 3:** Banned-strings check

**Step 4:** Commit

### Gate 9: Settings template clean and correct

- [ ] Scrubbed, generic, newcomer-safe
- [ ] Hooks wired to correct paths
- [ ] Committed

---

## Phase 10 — Documentation

This is a LOT of writing. 8 docs. Each is its own task.

### Tasks 10.1–10.8: Write each doc

For each doc:

**Step 1:** Write the full content (see below for outlines)
**Step 2:** Run banned-strings check
**Step 3:** Ensure "Chris Whitney" appears ONLY in allowed files (LICENSE, README byline, CHEATSHEET footer)
**Step 4:** Commit

#### Task 10.1: `README.md` (full version, replaces stub)

- Hook: "My friend and I built a working game in one session using this setup. Here's the kit."
- What the kit is
- Who it's for
- Prerequisites
- Quick start (Mac + Windows)
- What the installer does
- Link to WHAT-IS-THIS.md for newcomers
- Link to FIRST-SESSION.md for the first session walkthrough
- Link to CHEATSHEET.md for reference
- License + attribution

#### Task 10.2: `docs/INSTALL.md`

- Step-by-step manual install for things the script can't do
- Anthropic account + Claude Code pass activation
- Wispr Flow installation (Mac only, paid)
- cmux (Mac) / Claude Code Desktop or tamux (Windows) installation
- Obsidian installation and vault pointing
- GitHub account creation walkthrough (if needed)
- Troubleshooting FAQ

#### Task 10.3: `docs/FIRST-SESSION.md`

- What to expect on your first session
- The `/welcome` skill interview walkthrough
- Transition to first braindump
- What happens when you say "I don't know yet"
- Session end: `/wrap`

#### Task 10.4: `docs/CHEATSHEET.md`

The printable reference card. Four sections:

1. **Launch commands** — how to start claude with various flags
2. **Built-in commands** — /help, /clear, /compact, /model, /cost, /memory, /mcp, /doctor, /status, /fast, /voice, /rc
3. **Your installed skills** — the 11 custom ones
4. **Keyboard shortcuts** — Shift+Tab+Tab, Ctrl+S, Ctrl+O /, Esc
5. **Session rules** — when to start new / when to wrap / handoff prompts
6. **First principles** — talk don't type, start with pain, let Claude read before writing, plan mode for big decisions, one project per window, push often, everything private on GitHub
7. **Footer:** "Built by Chris Whitney — github.com/CAdidas333/claude-code-starter-kit"

#### Task 10.5: `docs/WORKFLOWS.md`

- Long-form operational wisdom
- Plan mode explained in depth
- Context management (40% rule, compaction, context guards)
- Session discipline (starting, wrapping, handoff)
- Memory system explained
- Working with multiple projects (cmux)
- The `/wrap` skill and why it matters
- Subagents and when to use them

#### Task 10.6: `docs/CLI-REFERENCE.md`

The explanatory reference for every launch flag and built-in command.

**Important:** this doc is BUILT during Phase 11 (command verification). Task 10.6 writes the STRUCTURE with placeholders. Phase 11 fills in the verified content.

Format per entry:
```
/commandname
  What it does:    (plain English)
  When to use it:  (real scenarios)
  When NOT to:     (gotchas)
  Example:         /commandname
```

Sections:
- Launch flags (claude, -c, -p, --model, --mcp-config, --add-dir, --permission-mode, --output-format, --verbose, --debug, --dangerously-skip-permissions)
- Environment variables (ANTHROPIC_API_KEY, CLAUDE_CODE_NO_FLICKER, CLAUDE_PROJECT_DIR)
- Built-in commands (/help, /clear, /compact, /model, /cost, /memory, /mcp, /permissions, /hooks, /agents, /doctor, /release-notes, /bug, /init, /add-dir, /export, /status, /resume, /fast, /voice, /rc)
- The three-layer taxonomy: built-in vs plugin vs skill

#### Task 10.7: `docs/WHAT-IS-THIS.md`

The jargon-free glossary for total newcomers.

- What is Claude Code?
- What is a "brain"?
- What is a CLAUDE.md file?
- What is memory?
- What is a skill?
- What is an agent?
- What is a hook?
- What is an MCP?
- What is plan mode?
- What is Wispr Flow and why is it recommended?
- What is lean-ctx?

Plain English, no assumed knowledge.

#### Task 10.8: `docs/UPDATING.md`

- How to pull updates when the kit changes
- `cd ~/claude-code-starter-kit && git pull && ./scripts/update.sh`
- Idempotency guarantee
- What to do if something fails
- How to report issues

### Gate 10: Documentation complete

- [ ] 8 docs written
- [ ] All pass banned-strings check
- [ ] "Chris Whitney" only in allowed locations
- [ ] Committed

---

## Phase 11 — Command Verification

### Task 11.1: Live `/help` walkthrough

**Prerequisites:** Phases 1-10 complete. Kit is built but not yet published.

**Files:**
- Modify: `docs/CLI-REFERENCE.md`

**Step 1:** Open a fresh Claude Code session in a scratch directory

```bash
mkdir /tmp/help-walkthrough && cd /tmp/help-walkthrough
claude
```

**Step 2:** Run `/help` and capture the output

**Step 3:** For each command in the output:
- Note its description
- Try invoking it (if safe — `/help`, `/status`, `/cost` are all safe)
- Document actual behavior in CLI-REFERENCE.md

**Step 4:** Specifically verify these commands the maintainer mentioned:
- `/voice` — confirm it works and document hold-spacebar-to-record mechanic
- `/rc` / `/remote-control` — confirm it works and document mobile app flow
- `/fast` — confirm toggle behavior
- `/powerup` — verify it exists or document as "may not be available"
- `/buddy` — verify or mark as not found

**Step 5:** Cross-reference against `docs/CLI-REFERENCE.md`. Remove any commands that don't exist. Add any that I missed. Correct any descriptions that don't match actual behavior.

**Step 6:** Commit

```bash
git add docs/CLI-REFERENCE.md
git commit -m "Verify CLI reference against live /help output

Every documented command confirmed working on the maintainer's live
install. Removed unverified commands. Updated descriptions to match
actual behavior."
```

### Gate 11: CLI reference verified

- [ ] Every command in CLI-REFERENCE.md confirmed working
- [ ] No fabricated commands
- [ ] Committed

---

## Phase 12 — Armory Seed Notes

### Tasks 12.1–12.3: Write the three seed notes

Three generic, universally-applicable notes that demonstrate what a good Armory note looks like.

Each seed note has this shape:

```markdown
---
title: <title>
source: <URL or reference>
ingested: 2026-04-10
topics: [<topics>]
related_projects: []
---

# <Title>

## Key Insight

## Details

## How to Apply
```

**Task 12.1:** `armory-seeds/2026-04-10_plan-mode-first.md` — why Plan Mode is your most valuable feature
**Task 12.2:** `armory-seeds/2026-04-10_context-forty-percent-rule.md` — why quality degrades at ~40% context fill
**Task 12.3:** `armory-seeds/2026-04-10_vertical-slices.md` — why end-to-end slices beat horizontal layers

Each task: write, banned-strings check, commit.

### Gate 12: Seed notes ready

- [ ] 3 seed notes exist and pass banned-strings check
- [ ] Format is consistent
- [ ] Committed

---

## Phase 13 — End-to-End Integration Test

### Task 13.1: Clean-environment install test (Mac)

**Step 1:** Create a completely fresh test environment
- New user account, OR
- Docker container with clean macOS-ish environment, OR
- At minimum: backup and temporarily rename `~/.claude/`, `~/Projects/_brain/`

**Step 2:** Clone the kit from GitHub

```bash
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
```

**Step 3:** Run `./setup.sh` end to end, capture every output line

**Step 4:** Verify post-install state:
- `~/Projects/_brain/` exists with full scaffold
- `~/.claude/skills/` contains all 12 skills
- `~/.claude/agents/` contains both agents
- `~/.claude/hooks/` contains all hooks (and they're executable)
- `~/.claude/settings.json` is merged correctly
- `~/.mcp.json` references lean-ctx + armory
- `~/.claude/.welcome-pending` exists

**Step 5:** Start Claude Code

```bash
cd ~/Projects && claude
```

Verify:
- Overwatch banner fires
- "Run /welcome" message appears
- Type `/welcome` — interview starts

**Step 6:** Walk through all three paths (A, B, C) in three separate test sessions

**Step 7:** Test each skill at least once in the post-welcome session

**Step 8:** Document the full transcript in `docs/context/SESSION_LOG.md`

**Step 9:** If any failures, fix them and repeat from Step 3

**Step 10:** Restore original `~/.claude/` and `~/Projects/_brain/` backups

### Task 13.2: Windows install test

Same pattern as Task 13.1 but on Windows. Requires a Windows machine (maintainer's friend Will is the intended test user — but for this phase, maintainer can set up a Windows VM or borrow a machine).

If Windows testing is not available before publish, flag as "Windows path needs alpha validation by Will" and note in README.

### Gate 13: End-to-end install verified on at least one platform

- [ ] Mac install runs clean from fresh state
- [ ] All verification checklist items pass
- [ ] /welcome path A, B, C all work
- [ ] All 12 skills invokable
- [ ] Session log documents the test

---

## Phase 14 — Pre-Publish Sanitization Review (Hard Stop)

### Task 14.1: Automated grep sweep

**Step 1:** Run the banned-strings hook over the entire repo one last time

```bash
./scripts/check-banned-strings.sh
```

**Expected:** ✓ pass. If fail, DO NOT proceed. Fix and re-run.

**Step 2:** Also run the hook recursively over every tracked file in the repo (not just staged), because some files may have been modified without committing yet. The hook already does this — just run it without a staged commit context:

```bash
./scripts/check-banned-strings.sh
```

**Expected:** no hits. The hook reads the banned strings from `.banned-strings` (private, gitignored) and checks every tracked file with word-boundary matching.

### Task 14.2: Manual line-by-line review of every scrubbed file

**Step 1:** Generate a list of all files that came from maintainer's personal sources (vs. written fresh for the kit)

**Step 2:** For each scrubbed file, open it and read line by line. Check against the sanitization checklist:

- [ ] No banned strings
- [ ] No project-specific examples
- [ ] No people's names outside allowed locations
- [ ] No financial figures
- [ ] No "when I..." anecdotes revealing context
- [ ] No personal file paths
- [ ] Generic examples where examples are needed
- [ ] Reads cleanly to a newcomer

**Step 3:** Fix anything that fails the checklist. Re-run banned-strings check after fixes.

### Task 14.3: Generate pre-publish review diff view

**Step 1:** Create a review document showing every scrubbed file + what was changed

```bash
./scripts/prepare-publish-review.sh > /tmp/review.md
open /tmp/review.md
```

(Write this script as part of this task.)

**Step 2:** Maintainer reviews the document. Options:
  A) Diffs of each scrubbed file
  B) Full rendered view
  C) Grep + checklist summary only

### Task 14.4: Maintainer go/no-go

**Gate:** Maintainer explicitly types "publish" or equivalent.

If "no" → return to Phase 5 or wherever the issue was. Fix. Re-run Phase 14.

---

## Phase 15 — Publish

### Task 15.1: Final commit and push to main

```bash
git status  # should be clean — everything committed
git log --oneline | head -20  # review commit history
git push origin main
```

**Gate:** Push succeeds. Repo on GitHub shows all files.

### Task 15.2: Verify the published repo

**Step 1:** Open https://github.com/CAdidas333/claude-code-starter-kit in a browser

**Step 2:** Spot-check:
- README renders correctly
- File tree matches expectations
- No "HEAD detached" or broken refs
- LICENSE shows MIT
- No sensitive data visible anywhere

**Step 3:** Clone the repo fresh into a different directory and run setup.sh end-to-end from the cloned copy. Verify it works identically to Phase 13.

### Task 15.3: Send Kevin handoff text

**Files:**
- N/A (external message)

**Step 1:** Copy the Kevin handoff draft from the design doc Appendix A

**Step 2:** Edit as needed

**Step 3:** Send via iMessage

**Step 4:** Wait for feedback. Capture any issues Kevin reports. File as GitHub issues on the repo.

### Gate 15: Kit is live

- [ ] Repo published to main
- [ ] Fresh clone + install verified
- [ ] Kevin handoff sent
- [ ] GitHub Issues enabled for feedback

---

## Phase 16 — Post-Launch (Loop)

After Kevin:
- Tim
- Will (Windows validation)
- Facebook group askers
- Public announcement

Each alpha test generates feedback → file as issues → fix → update → redo pre-publish review → push update → notify alpha testers.

---

## Summary of Verification Gates

| Gate | Phase | What passes means |
|------|-------|-------------------|
| 0 | Review | Maintainer approved this plan |
| 1 | Sanitization tooling | Hook works, blocks bad commits |
| 2 | OS installers | Both installer files syntactically valid |
| 3 | Finisher | Runs end-to-end on Mac, idempotent |
| 4 | Brain templates | 16 files clean and committed |
| 5 | Skills sanitized | 11 skills clean and smoke-tested |
| 6 | /welcome skill | All 3 paths work in scratch env |
| 7 | Agents + hooks | Sanitized, executable, committed |
| 8 | MCP servers | Armory MCP vendored + builds |
| 9 | Settings | Template clean |
| 10 | Documentation | 8 docs written |
| 11 | CLI verification | Every command confirmed against live Claude |
| 12 | Seed notes | 3 notes ready |
| 13 | E2E test | Clean install works end-to-end |
| 14 | Pre-publish review | Maintainer typed "publish" |
| 15 | Publish | Repo live, Kevin notified |

---

## Notes for the Executing Agent

1. **Read the private design doc first** — it has the banned strings list, sanitization procedures, and all design rationale: `~/Projects/_brain/docs/plans/2026-04-10-claude-code-starter-kit-design.md`

2. **Commit after every task.** Small commits. Easy to revert individual changes if the banned-strings hook catches something mid-stream.

3. **Run banned-strings check before every commit.** It's installed as a pre-commit hook after Phase 1, so this is automatic — but verify the hook is actually firing.

4. **Do NOT blind-copy anything.** Use the `KIT_FILES` allow-list in `bin/lib/manifest.js`. If something isn't on the list, it doesn't ship. Period.

5. **When in doubt on sanitization, err on the side of removal.** The maintainer's explicit rule: "if you even think it's remotely relevant to my projects, strip it. Don't even ask."

6. **Test each skill after sanitizing.** Smoke test in a scratch directory — don't assume the sanitization didn't break the skill's behavior.

7. **The /welcome skill is the highest-leverage piece.** Spend extra time on it. Test each path carefully.

8. **When Phase 11 (command verification) finds something I guessed wrong, fix it in the docs.** Don't leave fabricated commands in CLI-REFERENCE.md.

9. **Phase 14 is a hard stop.** Do not skip the pre-publish review even if everything looks clean. Maintainer approval is mandatory.

10. **The kit is for people already leaning in.** Write docs for pre-qualified users, not skeptics. Don't waste words convincing — waste words on the working path.

---

## End of Plan
