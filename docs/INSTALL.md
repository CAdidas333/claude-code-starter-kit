# Install Guide

The [Quick Start in the README](../README.md#quick-start) handles
the happy path. This doc is for everything else: manual install
steps the scripted installer can't automate, optional-but-recommended
tools, and the troubleshooting FAQ for common snags.

Read this top to bottom before you run `setup.sh` if you want to
know exactly what's about to happen. Or skim the table of contents
and jump to the section that matches the wall you hit.

---

## Table of contents

1. [GitHub account](#1-github-account)
2. [Anthropic account and Claude Code pass](#2-anthropic-account-and-claude-code-pass)
3. [Wispr Flow (optional, Mac only)](#3-wispr-flow-optional-mac-only)
4. [cmux (Mac) or Claude Code Desktop / tamux (Windows)](#4-cmux-or-claude-code-desktop)
5. [Obsidian (optional but strongly recommended)](#5-obsidian)
6. [Running setup.sh / setup.ps1](#6-running-the-installer)
7. [Troubleshooting FAQ](#7-troubleshooting-faq)

---

## 1. GitHub account

You need a GitHub account to clone the kit and to let the installer
authenticate `gh` on your machine. The kit is free and MIT-licensed,
but GitHub is where it lives and you'll want your own account there
for everything you build later anyway.

**If you already have one:** skip to section 2.

**If you don't:**

1. Go to [github.com/signup](https://github.com/signup)
2. Pick a username you'd be comfortable showing to a future employer
   (this is your permanent GitHub identity)
3. Use an email address you check regularly — GitHub uses it for
   security notifications and you don't want to miss those
4. Verify the email when GitHub sends you the link
5. Done. No credit card required for a free account.

The installer will run `gh auth login` later, which opens a browser
window and asks you to authorize the GitHub CLI against your new
account. That's the handshake that lets the kit push code to your
own repos.

## 2. Anthropic account and Claude Code pass

Claude Code is Anthropic's CLI tool, and using it requires:

- An Anthropic account (free to create)
- A Claude Code pass (a paid subscription, separate from the web
  Claude chat product)

**To sign up:**

1. Go to [claude.com](https://claude.com)
2. Click **Sign up** and create an account with email, Google, or
   Apple SSO
3. Once you're in, find the **Claude Code** section in your account
   settings (it may be on the landing page or under a "Developers"
   or "CLI" tab)
4. Activate the Claude Code pass. As of 2026 there are a few tiers
   including **Pro**, **Max 5x**, **Max 20x**, and **Ultra**. Start
   with whichever one fits your budget — you can upgrade later. The
   kit works identically on all tiers.
5. The activation flow gives you credentials that Claude Code picks
   up automatically when you log in from the CLI

**After the installer runs**, the first time you start a Claude
session it may ask you to log in. Follow the prompts; you'll get a
browser window that completes the handshake and writes credentials
to `~/.config/claude/` (Mac) or `%APPDATA%\claude\` (Windows).

**Heads up on rate limits:** each tier has a usage budget. If you
slam Claude with huge context or run dozens of parallel sessions,
you can hit the limit. The lean-ctx MCP keeps usage efficient by
compressing reads and caching context. See
[WORKFLOWS.md](WORKFLOWS.md#context-management) for the 40% rule
that will save you the most.

## 3. Wispr Flow (optional, Mac only)

Wispr Flow is a paid voice-dictation app that adds fluent
speech-to-text across your entire Mac. It's not required, but it
changes how you use Claude Code more than any other single tool.

**Why it's recommended:**

When you can talk instead of type, your first draft is your first
thought. Braindumps get longer and more honest. Design discussions
feel like conversations. Bug reports include details you would have
skipped if you had to type them out. The dollar-per-month cost pays
itself back in a single week of serious use.

**Install:**

1. Go to [wispr.com](https://wispr.com)
2. Download the Mac app and sign up for the subscription
3. Install the app and grant it **Accessibility** and **Microphone**
   permissions when macOS prompts you (required for the hold-to-talk
   key to work in any app)
4. Pick your activation key — many users set it to **Fn** (the key
   in the lower-left of most Mac keyboards). Hold the key, talk,
   release.

**The kit works perfectly without Wispr.** If you don't want to pay
for it, or you're on Windows, or you just hate voice input, just type
your prompts. Claude Code is designed for both typists and voice
users and works great either way.

**Setup tips:**

- Go into Wispr's settings and turn on **auto-punctuate** — it makes
  dictated text readable without you having to say "period, new
  paragraph" every sentence
- If you have a US English accent, leave the model on default; if
  not, check Wispr's model picker for one trained on your accent
- Practice for a day on short messages before doing long braindumps.
  Your speaking-for-Claude cadence is different from your
  speaking-to-a-human cadence and takes a beat to find

## 4. cmux or Claude Code Desktop

You'll very quickly want to run **one Claude Code session per
project**. That means you need a terminal app that can hold multiple
sessions side by side without mixing them up.

### Mac: cmux

**cmux** is a multi-pane terminal app built specifically for running
multiple Claude Code sessions at once. Each pane is its own project,
its own context, its own brain slice.

**Install:**

1. Open the Mac App Store
2. Search for **cmux**
3. Click Install
4. Launch it. It walks you through creating your first "workspace"
   (a directory) and your first "window" (one Claude session inside
   that directory)

**The one-project-per-window rule:**

Never run two projects in the same Claude session. Context bleeds,
Claude gets confused, and when you wrap the session the commit
messages are a mess. Open a new cmux window for each project.

### Windows: Claude Code Desktop (or tamux)

On Windows, start with **Claude Code Desktop** from Anthropic — it
gives you a clean multi-tab interface without having to configure
anything. Install it from your Anthropic account page after
activating your Claude Code pass.

If you're a power user and want something closer to the cmux
experience, **tamux** is a terminal multiplexer that runs inside
Windows Terminal or PowerShell. It has a steeper learning curve —
only go this route if you already know tmux on Linux and want the
same muscle memory on Windows.

**The one-project-per-window rule applies here too.** One tab in
Claude Code Desktop per project. One tamux pane per project. Don't
mix them.

## 5. Obsidian

Obsidian is a free, cross-platform markdown editor with backlinks,
graph view, and full-text search. It's not required, but pointing
it at `~/Projects/_brain/` turns your brain folder into a live,
navigable knowledge graph.

**Install:**

1. Go to [obsidian.md](https://obsidian.md)
2. Download the installer for your OS
3. Install and launch
4. When Obsidian asks you to pick a vault, choose **Open folder as
   vault** and navigate to `~/Projects/_brain/`
5. First time you open it, Obsidian will index everything. Takes a
   minute.

**What you get:**

- **Graph view** — visual map of how your notes link to each other
- **Backlinks** — any time you link to a note, the target gets a
  list of all the pages pointing at it
- **Quick switcher** (Cmd/Ctrl + O) — fuzzy-find any note in the
  vault in under a second
- **Full-text search** — way faster than grep for finding a
  half-remembered thought from a month ago

You can use the brain perfectly well without Obsidian — it's just
markdown files on disk — but Obsidian makes navigation 10x nicer.

## 6. Running the installer

Once the prerequisites are sorted, you run the installer. The Quick
Start in the README has the one-liner. Here's what actually happens.

### Mac

```bash
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
./setup.sh
```

**What to expect:**

1. The script checks if you have Homebrew, git, Node, and the
   GitHub CLI. If any are missing, it installs them.
2. If Homebrew is missing, you'll get a password prompt. That's
   macOS asking if it's okay for Homebrew to install to `/opt/`.
   Type your password, press enter. This is normal.
3. Git might prompt you to install the Xcode Command Line Tools if
   it's not already present. A dialog box appears. Click **Install**.
   This takes a few minutes the first time.
4. The script runs `gh auth login`, which opens a browser window.
   Sign in to GitHub, authorize the CLI, come back to the terminal.
5. The script hands off to the Node finisher (`bin/finish-setup.js`),
   which creates `~/Projects/_brain/`, copies skills, agents, and
   hooks into `~/.claude/`, and installs the three MCP servers.
6. When it's done you'll see a green summary block and instructions
   to start your first Claude session.

Total time: 5-15 minutes depending on what was already installed.

### Windows

```powershell
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
.\setup.ps1
```

**What to expect:**

Same flow but through PowerShell and winget instead of Homebrew.

- If PowerShell refuses to run the script with a "cannot be loaded
  because running scripts is disabled" error, see the FAQ entry on
  execution policy below.
- winget is Windows 10/11's built-in package manager and should
  already be available. If it isn't, the script tells you how to
  install it from the Microsoft Store.

## 7. Troubleshooting FAQ

### `git: command not found`

Mac: install the Xcode Command Line Tools. From a terminal:

```bash
xcode-select --install
```

A dialog pops up. Click Install. Wait a few minutes. Try again.

Windows: install Git for Windows from [git-scm.com/download/win](https://git-scm.com/download/win).
Accept the defaults in the installer.

### Homebrew install asks for a password

This is normal. Homebrew installs itself to `/opt/homebrew/` on
Apple Silicon and `/usr/local/` on Intel, and both require
administrator permission. Type your macOS login password. You won't
see the characters as you type them — that's also normal. Press
enter.

### `gh auth login` failed

Common causes:

- **No internet.** The auth flow needs to reach github.com. Check
  your connection.
- **You closed the browser too early.** You need to click
  "Authorize" in the GitHub web UI before the CLI will accept the
  handshake. Re-run `gh auth login` and finish the flow.
- **You have an old `gh` cached auth token.** Run `gh auth status`
  to see what's there. If it's confused, run `gh auth logout` and
  try again.
- **Two-factor auth is enabled and you typed the code wrong.**
  `gh auth login` has a retry prompt — just try again.

### Node version too old

The kit's finisher needs Node 20 or newer. If you have an older
version, upgrade:

**Mac (via Homebrew):**

```bash
brew install node
brew upgrade node
```

**Mac (via nvm, if you already use it):**

```bash
nvm install 20
nvm use 20
```

**Windows:**

Download the latest LTS from [nodejs.org](https://nodejs.org) and
run the installer. It replaces your existing Node.

### PowerShell execution policy errors

If `.\setup.ps1` fails with "cannot be loaded because running scripts
is disabled on this system", Windows is blocking unsigned PowerShell
scripts by default. Fix it for the current user only:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Type **Y** when prompted. Then re-run `.\setup.ps1`.

This only affects your user account, not the machine as a whole, and
only allows local scripts to run. You can reverse it at any time
with `Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope CurrentUser`.

### "The hook didn't fire"

If you start a Claude session in `~/Projects` and the Overwatch
banner doesn't appear, check:

1. **Is the hook executable?** Mac and Linux require the hook file
   to have execute permission:

   ```bash
   chmod +x ~/.claude/hooks/overwatch-session-start.sh
   ```

2. **Is it referenced in `~/.claude/settings.json`?** The kit's
   installer adds a `hooks.SessionStart` entry pointing at the
   script. Open `~/.claude/settings.json` and look for a `hooks`
   block. If it's missing, re-run the installer — it will merge
   the missing block back in.

3. **Are you in a directory where it should fire?** The Overwatch
   hook fires on every new session, but some messages only show if
   they have something to say. If your context is fresh and there's
   no pending welcome, the banner may be quiet.

### The MCP server failed to install

MCP install failures are non-fatal in the finisher — the rest of
the kit works, you just don't have that MCP. To retry manually:

**lean-ctx:**

Mac:
```bash
brew install lean-ctx
```

Windows (pick one):
```powershell
scoop install lean-ctx
# or
winget install --id lean-ctx.lean-ctx -e
```

**Armory (from the kit's vendored copy):**

```bash
cd ~/Projects/Claude-Code-Starter-Kit/mcp-servers/armory
npm install
npm run build
```

**Council (from the kit's vendored copy):**

```bash
cd ~/Projects/Claude-Code-Starter-Kit/mcp-servers/council
npm install
npm run build
```

Council is dormant without API keys — it installs but every
consultation returns an error until you create
`~/.claude/council-config.sh` with at least one of:

```bash
export COUNCIL_GOOGLE_API_KEY="your-key-here"
export COUNCIL_OPENAI_API_KEY="your-key-here"
export COUNCIL_NVIDIA_API_KEY="your-key-here"
```

Each voice is independently null-gated: keys you don't provide are
simply absent, not errors.

Then check `~/.mcp.json` has all three servers listed under `mcpServers`.
If any are missing, re-run the kit's finisher with `node bin/finish-setup.js`
from the kit directory.

### The installer wrote a file to my Desktop

If the installer hit an unrecoverable error, it writes a diagnostic
file called `starter-kit-broke-<timestamp>.txt` to your Desktop. This
file contains system information that helps diagnose what went wrong —
no API keys or secrets, only present/absent flags.

Send this file when opening an issue at
[github.com/CAdidas333/claude-code-starter-kit/issues](https://github.com/CAdidas333/claude-code-starter-kit/issues)
so the problem can be reproduced quickly.

If the install ultimately succeeded (you see the green summary and
Claude Code starts), the Desktop file is harmless — you can delete it.

### I ran the installer twice and now I'm worried

Don't be. The installer is idempotent. Running it again:

- Does NOT overwrite your `_brain/` files (it checks before copying
  and skips files that exist)
- Does NOT lose skills you added yourself (it only writes the
  kit's skills, not anyone else's)
- DOES re-merge `~/.claude/settings.json` — your custom settings
  are preserved, kit additions are re-applied

Safe to run as many times as you want. If something is ever in a
weird state, running the installer again is almost always the
right move.

### I need help and none of this worked

Open an issue on the kit repo:
[github.com/CAdidas333/claude-code-starter-kit/issues](https://github.com/CAdidas333/claude-code-starter-kit/issues)

Include:

- Your OS (Mac version or Windows build)
- The exact command you ran
- The exact error message (copy the whole thing, not a paraphrase)
- Whether you've run the installer before on this machine

The more specific the report, the faster it gets fixed.
