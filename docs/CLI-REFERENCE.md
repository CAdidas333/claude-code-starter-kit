# CLI Reference — Launch Flags and Built-in Commands

> **Phase 11 status:** some entries in this file are verified against
> a live Claude Code session. Entries marked `[UNVERIFIED]` are from
> documentation and haven't been personally tested against the
> current Claude Code version. Run `/help` in your own session to
> see your exact command list — if something here doesn't match what
> you see, your version is authoritative.

This doc covers three things:

1. **Launch flags** — options you pass to `claude` when starting a
   session from the terminal
2. **Environment variables** — OS-level settings Claude Code respects
3. **Built-in commands** — slash commands you type inside a running
   session

Plus a short taxonomy section explaining where slash commands come
from (built-in, plugin, or skill).

Each entry uses the same format:

```
/command-or-flag
  What it does:    plain-English summary
  When to use it:  real scenarios
  When NOT to:     gotchas and anti-patterns
  Example:         command in context
```

---

## Table of contents

1. [Launch flags](#1-launch-flags)
2. [Environment variables](#2-environment-variables)
3. [Built-in commands](#3-built-in-commands)
4. [The three-layer taxonomy](#4-the-three-layer-taxonomy)

---

## 1. Launch flags

Flags you pass on the command line when starting a Claude Code
session.

### `-c` / `--continue` [UNVERIFIED]

```
claude -c

  What it does:    Resumes your most recent session in the current
                   directory. Loads the handoff prompt written by
                   /wrap (if one exists) so the new session picks
                   up with full context.
  When to use it:  You're coming back to a project you were working
                   on earlier and want to keep going from where you
                   left off.
  When NOT to:     You're starting a fundamentally different task.
                   You want a clean slate. The previous session was
                   stale or the context doesn't apply anymore.
  Example:         cd ~/Projects/my-app && claude -c
```

### `-p` / `--print` [UNVERIFIED]

```
claude -p "your prompt here"

  What it does:    Runs Claude in headless mode with a single prompt,
                   prints the response, and exits. No interactive
                   session.
  When to use it:  Scripting. Automation. One-shot queries you want
                   to capture to a file or pipe to another tool.
  When NOT to:     Any task where you need to follow up or iterate.
                   Use the regular interactive mode for that.
  Example:         claude -p "summarize the last commit" > summary.md
```

### `--model` [UNVERIFIED]

```
claude --model opus

  What it does:    Starts the session using a specific Claude model
                   instead of the default. Common values: opus,
                   sonnet, haiku.
  When to use it:  You want maximum capability (opus) for a hard
                   task, or maximum speed (haiku) for a simple one.
  When NOT to:     You're not sure which model you need — the default
                   is the right choice for most work.
  Example:         claude --model opus
```

### `--mcp-config` [UNVERIFIED]

```
claude --mcp-config /path/to/mcp.json

  What it does:    Loads a specific MCP server configuration for
                   this session instead of the default (~/.mcp.json).
  When to use it:  You want to test a new MCP server without
                   modifying your global config, or run a session
                   with a custom subset of servers.
  When NOT to:     Day-to-day work — just use the default.
  Example:         claude --mcp-config ./test-mcp.json
```

### `--add-dir` [UNVERIFIED]

```
claude --add-dir ../shared-lib

  What it does:    Gives Claude read access to an additional
                   directory beyond the current working directory.
                   Useful when a project depends on a sibling folder.
  When to use it:  Monorepos. Shared libraries outside your project
                   root. Reference docs you want Claude to be able to
                   search from this session.
  When NOT to:     You can just `cd` into the parent directory
                   instead — sometimes that's simpler.
  Example:         claude --add-dir ~/Projects/shared-types
```

### `--permission-mode` [UNVERIFIED]

```
claude --permission-mode plan

  What it does:    Sets the session's permission mode. Common values
                   include `default` (asks for permission on risky
                   actions), `plan` (enter Plan Mode at start), and
                   `acceptEdits` (auto-approve file edits).
  When to use it:  You know at startup which mode you want — for
                   example, starting directly in Plan Mode for a
                   design session.
  When NOT to:     You're still deciding what kind of work you'll
                   do — just start normally and change mode mid-
                   session if needed.
  Example:         claude --permission-mode plan
```

### `--output-format` [UNVERIFIED]

```
claude -p "list recent commits" --output-format json

  What it does:    Changes the output format of headless (`-p`) mode.
                   Common values include `text` (default) and `json`
                   for machine-readable output.
  When to use it:  Scripting pipelines where you need structured
                   output you can parse.
  When NOT to:     Interactive sessions — this only affects headless
                   mode.
  Example:         claude -p "status" --output-format json | jq
```

### `--verbose` [UNVERIFIED]

```
claude --verbose

  What it does:    Prints additional logging about what Claude Code
                   is doing behind the scenes — tool calls, MCP
                   server activity, context operations.
  When to use it:  Debugging. Understanding why something is slow
                   or why a tool isn't firing the way you expected.
  When NOT to:     Normal work — the extra output is distracting.
  Example:         claude --verbose
```

### `--debug` [UNVERIFIED]

```
claude --debug

  What it does:    Enables debug-level logging, even more detailed
                   than --verbose. Includes internal state, raw
                   protocol messages, and errors that are normally
                   silenced.
  When to use it:  Filing a bug report or diagnosing a weird
                   failure you can't reproduce otherwise.
  When NOT to:     Any normal session — the output is overwhelming.
  Example:         claude --debug 2> claude-debug.log
```

### `--dangerously-skip-permissions` [UNVERIFIED]

```
claude --dangerously-skip-permissions

  What it does:    Disables all permission prompts. Claude can run
                   any command, edit any file, delete anything, all
                   without asking. The name is a warning.
  When to use it:  Fully automated pipelines where you've already
                   reviewed the prompt and know exactly what Claude
                   will do. Docker sandboxes. Disposable VMs.
  When NOT to:     Any interactive or exploratory session. Anything
                   on a machine you care about. Anything with
                   irreversible side effects (force-push, delete,
                   rm).
  Example:         claude --dangerously-skip-permissions -p "run tests"
```

---

## 2. Environment variables

OS-level environment variables that Claude Code reads at startup.

### `ANTHROPIC_API_KEY` [UNVERIFIED]

```
export ANTHROPIC_API_KEY=sk-ant-...

  What it does:    Overrides the default authentication flow.
                   Instead of using the credentials from your
                   Claude Code pass login, Claude uses this API
                   key directly.
  When to use it:  You have a standalone API key (not a Claude Code
                   pass) and want to use it for a specific session.
                   Scripting environments where the interactive
                   login flow can't run.
  When NOT to:     You're a regular Claude Code pass user — the
                   login flow handles auth better than a raw API
                   key and you'll get the right rate limits.
  Example:         ANTHROPIC_API_KEY=sk-ant-... claude -p "hello"
```

### `CLAUDE_CODE_NO_FLICKER` [UNVERIFIED]

```
export CLAUDE_CODE_NO_FLICKER=1

  What it does:    Disables the in-place terminal updates Claude
                   Code uses to render streaming output. Output
                   becomes append-only, which can look less polished
                   but renders correctly in terminals that don't
                   handle ANSI cursor control well.
  When to use it:  Using Claude Code inside tmux, screen, or a
                   terminal emulator with limited ANSI support, and
                   the output is flickering or rendering badly.
  When NOT to:     A modern terminal where the default rendering
                   works fine — leave it off, the live updates are
                   nicer.
  Example:         export CLAUDE_CODE_NO_FLICKER=1 && claude
```

### `CLAUDE_PROJECT_DIR` [UNVERIFIED]

```
export CLAUDE_PROJECT_DIR=~/Projects/my-app

  What it does:    Tells Claude Code which directory to treat as
                   the project root for this session. Affects where
                   project-scoped memory and context files are
                   loaded from.
  When to use it:  You want to run Claude from a different directory
                   but have it act as if it's in a specific project
                   (for example, running from ~/scripts while
                   working on ~/Projects/my-app).
  When NOT to:     Normal use — just `cd` into the project directory
                   and start Claude there.
  Example:         CLAUDE_PROJECT_DIR=~/Projects/my-app claude
```

---

## 3. Built-in commands

Slash commands you type inside a running Claude Code session. These
come from Claude Code itself, not from the kit's skills.

### `/help` [UNVERIFIED]

```
/help

  What it does:    Lists every command available in the current
                   session, including built-ins, plugins, and your
                   installed skills.
  When to use it:  You don't remember the command name. You want to
                   see what's actually available (sometimes things
                   change between Claude Code versions).
  When NOT to:     Any time — /help is always safe to run.
  Example:         /help
```

### `/clear` [UNVERIFIED]

```
/clear

  What it does:    Wipes the current conversation context but keeps
                   the session running. Claude forgets everything
                   you've said so far in this session.
  When to use it:  You're switching to a different task inside the
                   same session and don't want the old context
                   bleeding into the new one.
  When NOT to:     You want to keep some of the context — once
                   cleared, it's gone. Use /compact instead if you
                   want a compressed summary.
  Example:         /clear
```

### `/compact` [UNVERIFIED]

```
/compact

  What it does:    Summarizes the conversation so far into a short
                   recap, drops the full history, and keeps the
                   session going. Frees up context without losing
                   the thread completely.
  When to use it:  Mid-task and context is filling up. You need
                   room to keep working but don't want to lose the
                   state you've built.
  When NOT to:     The task is nuanced enough that a summary would
                   lose the details you need. Wrap and start fresh
                   instead.
  Example:         /compact
```

### `/model` [UNVERIFIED]

```
/model

  What it does:    Interactively switch the model Claude is using
                   mid-session. Common values: opus, sonnet, haiku.
  When to use it:  You started with sonnet and hit a hard problem
                   that needs opus. Or you started with opus and
                   want to speed through easy follow-ups on haiku.
  When NOT to:     Your session is already going well on the current
                   model — don't switch just to switch.
  Example:         /model opus
```

### `/cost` [UNVERIFIED]

```
/cost

  What it does:    Shows how much this session has cost so far in
                   input and output tokens, usually with a dollar
                   estimate against your Claude Code pass budget.
  When to use it:  You want to see whether you're on track with
                   your usage budget, or you're debugging why a
                   session is running slower than expected.
  When NOT to:     You're deep in focus and the number will just
                   distract you — check it between tasks.
  Example:         /cost
```

### `/memory` [UNVERIFIED]

```
/memory

  What it does:    Opens the memory file for the current project in
                   an editor view, letting you see what Claude has
                   saved and make manual edits.
  When to use it:  Auditing what Claude has learned. Removing stale
                   facts. Adding facts you want preserved explicitly.
  When NOT to:     You're mid-task — edit memory later, not during
                   flow.
  Example:         /memory
```

### `/mcp` [UNVERIFIED]

```
/mcp

  What it does:    Lists the MCP servers currently connected to this
                   session, their status, and the tools each one
                   exposes.
  When to use it:  Debugging why a tool isn't available. Verifying
                   that lean-ctx and Armory are wired up correctly
                   after install.
  When NOT to:     Everything is working — no reason to check.
  Example:         /mcp
```

### `/permissions` [UNVERIFIED]

```
/permissions

  What it does:    Shows or changes the current permission settings
                   for tools. Some tools can be set to "always allow"
                   or "always ask".
  When to use it:  You're tired of being asked to approve the same
                   tool 50 times and want to allowlist it for the
                   session.
  When NOT to:     The tool is one you want to keep a close eye on
                   — leaving it on "ask" is a safety net.
  Example:         /permissions
```

### `/hooks` [UNVERIFIED]

```
/hooks

  What it does:    Shows the hooks currently registered for this
                   session and their configuration.
  When to use it:  Debugging why a hook isn't firing. Checking that
                   the kit's Overwatch hooks are registered
                   correctly.
  When NOT to:     Normal work.
  Example:         /hooks
```

### `/agents` [UNVERIFIED]

```
/agents

  What it does:    Lists the agents available in the current session.
                   Agents are specialized sub-Claudes you can
                   dispatch narrow tasks to.
  When to use it:  You want to see what agents the kit installed,
                   or verify that context-updater and brain-updater
                   are available.
  When NOT to:     Normal work.
  Example:         /agents
```

### `/doctor` [UNVERIFIED]

```
/doctor

  What it does:    Runs a self-check on your Claude Code install and
                   reports any problems — missing dependencies,
                   broken MCP connections, invalid settings, stale
                   auth tokens.
  When to use it:  Something isn't working and you don't know what.
                   First line of defense when debugging.
  When NOT to:     Everything's fine. Doctor output on a healthy
                   install is just noise.
  Example:         /doctor
```

### `/release-notes` [UNVERIFIED]

```
/release-notes

  What it does:    Shows the changelog for the current Claude Code
                   version — new features, fixed bugs, breaking
                   changes.
  When to use it:  You updated Claude Code recently and something
                   looks different, or a feature you used to rely
                   on isn't working anymore.
  When NOT to:     You haven't updated in a while and don't care
                   yet.
  Example:         /release-notes
```

### `/bug` [UNVERIFIED]

```
/bug

  What it does:    Files a bug report against Claude Code directly
                   from the CLI. Captures context automatically so
                   you don't have to.
  When to use it:  You found a reproducible bug and want to report
                   it to Anthropic.
  When NOT to:     You just hit a one-off weird behavior — try to
                   reproduce first, file only if it's consistent.
  Example:         /bug
```

### `/init` [UNVERIFIED]

```
/init

  What it does:    Initializes Claude Code's project-level files in
                   the current directory — typically creating a
                   CLAUDE.md stub and any other per-project state.
  When to use it:  You're starting a new project and want the
                   project-scoped files set up.
  When NOT to:     The kit's /new-project skill does this plus a
                   lot more — prefer that for new projects.
  Example:         /init
```

### `/add-dir` [UNVERIFIED]

```
/add-dir ~/Projects/shared-lib

  What it does:    Mid-session equivalent of the --add-dir launch
                   flag. Grants Claude access to an additional
                   directory without restarting.
  When to use it:  You realize partway through a session that you
                   need Claude to see another folder.
  When NOT to:     You can just restart the session with --add-dir
                   — sometimes a clean restart is nicer.
  Example:         /add-dir ../shared-types
```

### `/export` [UNVERIFIED]

```
/export

  What it does:    Exports the current session's conversation to a
                   file you can save or share.
  When to use it:  You want to send a transcript to someone, or
                   save a particularly useful session for later
                   reference.
  When NOT to:     The session has sensitive info you don't want
                   leaving your machine.
  Example:         /export
```

### `/status` [UNVERIFIED]

```
/status

  What it does:    Shows session info — current model, context
                   usage percentage, connected tools, permission
                   mode.
  When to use it:  You want to know how close you are to the 40%
                   context threshold. You want to verify which
                   model you're on. Debugging.
  When NOT to:     Any time, /status is safe.
  Example:         /status
```

### `/resume` [UNVERIFIED]

```
/resume

  What it does:    Resumes a previous session, similar to the -c
                   launch flag but from inside a running session.
  When to use it:  You started a new session by mistake and want
                   to go back to the one you had open earlier.
  When NOT to:     You deliberately wanted a fresh session.
  Example:         /resume
```

### `/fast` [VERIFIED]

```
/fast

  What it does:    Toggles fast-output mode using Opus 4.6. Output
                   streams noticeably faster at a small quality
                   cost.
  When to use it:  Iterating on drafts, writing at length, anything
                   where you want the words to come out quickly and
                   can live with slightly rougher output.
  When NOT to:     Precision work, hard debugging, anything where
                   a small quality drop would cost you time later.
  Example:         /fast
```

### `/voice` [VERIFIED]

```
/voice

  What it does:    Starts a voice input mode inside the Claude
                   session. Hold the spacebar to record, release to
                   transcribe. Free alternative to Wispr Flow.
  When to use it:  You don't have Wispr Flow and still want voice
                   input. Braindumps. Anything longer than a couple
                   of sentences.
  When NOT to:     Your microphone isn't set up, or you're in a
                   loud environment where voice input won't pick up
                   your speech cleanly.
  Example:         /voice
```

### `/rc` / `/remote-control` [VERIFIED]

```
/rc

  What it does:    Connects the current Claude Code session to the
                   Claude mobile app. Once connected, you can
                   monitor and interact with the session from your
                   phone. Tap the </> icon in the app's left
                   sidebar to find the remote-control panel.
  When to use it:  Long-running tasks you want to keep an eye on
                   while away from your desk. Quick check-ins from
                   your phone during a meeting.
  When NOT to:     Deep-focus sessions where phone distractions
                   would pull you out of flow.
  Example:         /rc
```

---

## 4. The three-layer taxonomy

Slash commands in a Claude Code session can come from three
different places, and understanding which is which helps you
debug and reason about your setup.

### Layer 1: Built-in CLI commands

These ship with Claude Code itself. They're always available
regardless of what you've installed. Examples: `/help`, `/clear`,
`/compact`, `/model`, `/cost`, `/status`, `/doctor`, `/mcp`.

If something in this category isn't working, the first check is
`/doctor` — it tests the core install. If core commands are
failing, your Claude Code install itself has a problem.

### Layer 2: Plugin commands

Claude Code supports plugins that add commands in a dedicated
namespace, typically prefixed with the plugin name and a colon.
Example: `/coderabbit:review` from the CodeRabbit plugin, or
`/semgrep:setup-semgrep-plugin` from the Semgrep plugin.

Plugins are enabled in your `~/.claude/settings.json` under an
`enabledPlugins` block. If a plugin command isn't working:

1. Check `/help` to see if it's actually listed
2. Check `settings.json` to see if the plugin is enabled
3. If not enabled, enable it and restart your session

Plugins are independent of this kit — they come from the broader
Claude Code ecosystem.

### Layer 3: Skills

Skills are markdown files at `~/.claude/skills/<name>/SKILL.md`
that define named commands. They're invoked without a prefix —
just `/skillname`. The kit ships 12 skills: `/welcome`,
`/new-project`, `/today`, `/wrap`, `/status-report`, `/ingest`,
`/digest`, `/investigate`, `/scout`, `/audit`, `/morning-brief`,
`/memory-md-management`.

You can write your own skills too. Create a directory under
`~/.claude/skills/`, add a `SKILL.md` with a YAML frontmatter
header, and it becomes available as a slash command in the next
session.

If a skill isn't working:

1. Check `/help` to see if it's listed
2. Check the skill file exists at the right path
3. Check the YAML frontmatter is valid
4. Check the tools it needs are allowed in its `allowed-tools`
   frontmatter field

### How to tell which layer a command came from

Run `/help` in your session. The output groups commands by source
— built-ins first, then plugins (with their prefix), then skills
at the end. If a command name collides across layers, the order
of precedence is usually built-in > plugin > skill, but check
`/help` output to be sure.
