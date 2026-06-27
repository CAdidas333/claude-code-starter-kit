# Claude Code Starter Kit

> My friend and I built a working game in one session using this exact
> setup. Here's the kit.

One command. Twenty minutes. Zero to a humming Claude Code workspace
with skills, hooks, a cross-project brain, three MCP servers, and a
guided onboarding that interviews you and personalizes itself to how
you work.

---

## What this is

A complete, opinionated Claude Code setup packaged as a single install.
It ships 17 custom skills, 2 agents, 3 hooks, a brain structure you
can open in Obsidian, and three MCP servers (lean-ctx for smart file
reading, Armory for your personal knowledge vault, and Council for
second-opinion AI consultations and design image generation). The
installer lays everything down, and then a `/welcome` skill runs inside
Claude Code, routes you by experience level, asks you a handful of
questions, writes your profile files, and drops you straight into your
first real working session.

It's the setup I use every day to build real software. The kit is the
workflow, not a tutorial. If you want a gentle introduction to Claude
Code, this probably isn't it. If you want the same working setup an
experienced user runs on day one, clone it and go.

## Who it's for

- You already know you want to use Claude Code. You're not shopping.
- You're tired of configuring things and want a working setup now.
- You're comfortable running one shell command and answering a few
  prompts.
- You have (or are willing to create) a GitHub account, an Anthropic
  account, and a Claude Code pass.

If you've never heard of any of this before, start with
[WHAT-IS-THIS.md](docs/WHAT-IS-THIS.md) first — it's a plain-English
glossary written for total newcomers. Then come back here.

## Prerequisites

Before you run the installer you need:

- **A computer.** Mac (Intel or Apple Silicon) or Windows 10/11.
- **A GitHub account.** Free. If you don't have one, the installer
  walks you through creating it.
- **An Anthropic account with a Claude Code pass.** Sign up at
  [claude.com](https://claude.com) and activate Claude Code from your
  account page. See [INSTALL.md](docs/INSTALL.md) if you get stuck.
- **A terminal.** Terminal.app on Mac, PowerShell on Windows — both
  come preinstalled.

Optional but strongly recommended:

- **Wispr Flow** (Mac only, paid) — voice dictation that lets you
  talk to Claude instead of typing. Worth it. The kit works fine
  without it — just type your prompts if you'd rather skip voice.
- **Obsidian** — free, cross-platform. Points at your brain folder
  and gives you graph view, search, and backlinks over everything
  the kit captures.
- **cmux** (Mac) or **Claude Code Desktop** (Windows) — a multi-pane
  terminal so you can run one Claude session per project without
  mixing them up.

Full install notes for each of these live in
[INSTALL.md](docs/INSTALL.md).

## Before you start

If you want to move fast, read [PRE-INSTALL.md](docs/PRE-INSTALL.md)
first — it's a browser-only checklist (accounts, tools, 15 minutes)
that ensures the installer has nothing to wait on. Not required, but
it makes the install smoother.

## Quick start

### Mac

```bash
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
./setup.sh
```

### Windows

Open PowerShell and run:

```powershell
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
.\setup.ps1
```

That's it. The installer handles the rest. If anything goes wrong,
[INSTALL.md](docs/INSTALL.md) has a step-by-step hand-holding version
and a troubleshooting FAQ.

## What the installer does

- Installs the OS-level tools you need (Homebrew or winget, Node, git,
  the GitHub CLI, Claude Code itself)
- Runs `gh auth login` so you're authenticated to GitHub
- Creates `~/Projects/_brain/` and lays down the full brain scaffold
- Copies 17 skills to `~/.claude/skills/`
- Copies 2 agents to `~/.claude/agents/`
- Copies 3 hooks to `~/.claude/hooks/` (and makes them executable)
- Merges `~/.claude/settings.json` — your existing settings are
  preserved, kit additions are layered on top
- Installs the **lean-ctx** MCP server (Homebrew on Mac,
  winget/Scoop on Windows)
- Installs the **Armory** MCP server from the vendored copy bundled
  with this repo
- Installs the **Council** MCP server — 6 tools for second-opinion
  AI consultation and design image generation (Gemini/GPT/NVIDIA;
  dormant until you add API keys to `~/.claude/council-config.sh`)
- Writes `~/.mcp.json` to wire all three servers into Claude
- Initializes git on your brain folder so your notes are versioned
  from day one
- Writes a `.welcome-pending` marker so your first Claude session
  triggers the `/welcome` onboarding automatically
- Runs `/verify` (5-check smoke test: MCPs respond, hooks fire, brain
  folder exists, GitHub auth, settings.json merged) and prints
  PASS/FAIL per check

The installer is **idempotent**. Running it twice won't break
anything. If it fails halfway through, just run it again — it picks
up where it left off.

## After install — your first session

Open a terminal and run:

```bash
cd ~/Projects
claude
```

The Overwatch banner fires and tells you to type `/welcome`. Do that.
A short interview starts. Five to ten minutes later you're in your
first braindump with a personalized workspace already humming around
you.

Full walkthrough of the first session is in
[FIRST-SESSION.md](docs/FIRST-SESSION.md).

For the quick-reference card you'll actually print and keep next to
your keyboard, see [CHEATSHEET.md](docs/CHEATSHEET.md).

For the deeper operational wisdom — when to wrap a session, how Plan
Mode works, how to manage context — see
[WORKFLOWS.md](docs/WORKFLOWS.md).

## Documentation

| Doc | What it's for |
|---|---|
| [PRE-INSTALL.md](docs/PRE-INSTALL.md) | Browser-only pre-flight checklist (read before running setup) |
| [INSTALL.md](docs/INSTALL.md) | Full install walkthrough and troubleshooting |
| [FIRST-SESSION.md](docs/FIRST-SESSION.md) | What to expect on your first session |
| [CHEATSHEET.md](docs/CHEATSHEET.md) | Printable quick reference card |
| [WORKFLOWS.md](docs/WORKFLOWS.md) | Long-form operational wisdom |
| [CLI-REFERENCE.md](docs/CLI-REFERENCE.md) | Launch flags and built-in commands |
| [WHAT-IS-THIS.md](docs/WHAT-IS-THIS.md) | Jargon-free glossary for newcomers |
| [UPDATING.md](docs/UPDATING.md) | How to pull kit updates |
| [upgrades/mac-daemons.md](docs/upgrades/mac-daemons.md) | Optional Mac power-user daemon setup (post-install) |
| [recipes/cron-loop.md](docs/recipes/cron-loop.md) | How to schedule a recurring cloud agent |

## Updating

When the kit gets a new version, pull it and re-run the finisher:

```bash
cd claude-code-starter-kit
git pull
./scripts/update.sh
```

The update is idempotent. Your brain files, your profile, your
working-style preferences — none of that is touched. Full notes in
[UPDATING.md](docs/UPDATING.md).

## License

MIT — see [LICENSE](LICENSE).

## Attribution

Built by Chris Whitney.
