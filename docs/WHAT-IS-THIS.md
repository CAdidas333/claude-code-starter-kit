# What Is This? A Jargon-Free Glossary

You opened this doc because you installed Claude Code recently and
something already feels over your head. That's fine. This page is
written for someone who has never seen any of this before. No
assumed knowledge. No "obviously".

Read it top to bottom the first time. Come back to individual entries
later when you see a word you don't recognize.

---

## What is Claude Code?

Claude Code is Anthropic's command-line tool for coding with Claude.
You open a terminal, type `claude`, and start talking. Claude can
read your files, write new ones, run commands, search the web, and
keep working on a task across dozens of back-and-forth messages.

The big difference from the chat app is that Claude Code lives on
your machine. It sees your actual project, not a copy you pasted
into a browser. When it writes a file, the file exists. When it
runs a test, the test actually runs. You're not copying snippets
back and forth — you're collaborating in the same workspace.

Claude Code runs on Mac, Linux, and Windows. It talks to the same
Claude models you already know (Sonnet, Opus, Haiku) through
Anthropic's API. You pay for it with a Claude Code pass, which is
a subscription attached to your Anthropic account.

## What is "the brain"?

The "brain" is a folder on your computer — `~/Projects/_brain/` —
that holds everything Claude needs to know about you, your work, and
your projects. Think of it as a notebook that both you and Claude
write in.

Inside the brain you'll find:

- **`Dashboard.md`** — the status of all your projects at a glance
- **`Feedback/Working-Style.md`** — how you like Claude to talk to
  you (short vs long answers, ask first vs just do it, etc.)
- **`Ideas/`** — where half-formed thoughts go before they become
  projects
- **`Armory/`** — your personal knowledge vault, where notes, video
  transcripts, and cheat sheets get filed for later

The brain is the thing that stops you having to re-explain yourself
every session. Claude reads the relevant parts at the start of each
conversation, so if you already told it you prefer bullet points,
you don't have to tell it again tomorrow.

The brain is also its own git repository. Every change is versioned.
If you accidentally delete something important, it's recoverable.

## What is `CLAUDE.md`?

`CLAUDE.md` is a special file that Claude Code reads automatically
at the start of every session. If there's one in your current
directory, Claude reads it. If there's one in your home folder, it
reads that too. You can have one at the root of a project that
contains project-specific instructions, and a global one in
`~/.claude/CLAUDE.md` that applies everywhere.

Anything you put in `CLAUDE.md` acts like a permanent instruction.
"Always use TypeScript." "Never commit without running tests."
"Refer to me as Sam." Claude treats these as rules and follows them
unless you tell it to stop.

The kit ships with a well-tuned `CLAUDE.md` for your home directory
and another for your brain folder. You can edit them at any time.

## What is memory?

Memory in Claude Code is a set of files at `~/.claude/projects/<project-id>/memory/MEMORY.md`
where Claude stores short, durable facts it's learned about you and
your projects. Unlike `CLAUDE.md`, which you write yourself, memory
is mostly auto-managed. When Claude learns something that will
matter next session — "Sam prefers vertical slices over horizontal
layering" — it can append a memory entry.

You can also tell Claude to remember something explicitly. "Remember
that my production database is Postgres 16." It writes that to
memory and reads it back at the start of future sessions.

Memory is per-project. Facts you establish in one workspace don't
bleed into another.

## What is a skill?

A skill is a named command you can invoke inside a Claude session by
typing `/skillname`. Skills bundle a set of instructions with some
context about when to use them. The kit ships 12 skills:

- `/welcome` — the onboarding interview you'll run on your first
  session
- `/new-project` — creates a new project with full context scaffolding
- `/today` — a daily briefing across all your projects
- `/wrap` — cleanly ends a session: updates docs, commits, pushes,
  and writes a handoff note for next time
- `/ingest` — pulls a YouTube video, article, or tweet into your
  Armory as a searchable note
- `/digest` — a weekly summary of what you've been learning
- `/investigate` — verifies a claim from an ingested note (does
  this tool actually exist? is it compatible?)
- `/scout` — an autonomous research agent that hunts for new tools
  and techniques in your focus areas
- `/audit` — checks which Armory knowledge you've actually put into
  practice
- `/morning-brief` — Gmail triage plus today's schedule, assembled
  into a priority brief
- `/status-report` — a printable project report
- `/memory-md-management` — tools for auditing and cleaning up
  memory files

You can write your own skills too. They're just markdown files in
`~/.claude/skills/<name>/SKILL.md` with a specific header format.

## What is an agent?

An agent is a specialized sub-Claude that runs one focused task and
reports back. When you invoke an agent, Claude spawns a separate
context window, gives it a narrow job, and returns only the result.

The kit ships two agents:

- **`context-updater`** — reads a project's recent changes and
  updates its context docs so the next session starts informed
- **`brain-updater`** — does the same thing for your brain folder
  at the cross-project level

You usually won't invoke agents directly. Skills like `/wrap` use
them behind the scenes. But you can spin one up any time by asking
Claude to "use the X agent for this".

The point of agents is context isolation. Running ten small focused
jobs in ten separate contexts is cheaper and more reliable than
trying to juggle ten concerns in one long conversation.

## What is a hook?

A hook is a script that runs automatically at a specific moment in
a Claude session. Claude Code has several hook types:

- **SessionStart** — fires when you open a new session. The kit's
  `overwatch-session-start.sh` hook checks for things you need to
  know before you start typing (pending welcome, comms inbox,
  broken builds).
- **PreToolUse** — fires right before Claude uses a tool. The kit's
  `overwatch-context-guard.sh` hook checks your context usage and
  warns if you're getting close to the limit.
- **PostToolUse** — fires right after a tool runs. The kit's code
  reviewer hook reads every file Claude just edited and flags
  issues before you commit.

Hooks are just shell scripts or programs. If you can write one, you
can add your own. The kit's hooks are a reasonable starting set.

## What is MCP?

MCP stands for **Model Context Protocol**. It's the plumbing that
lets external tools talk to Claude. An MCP server is a small program
that exposes a set of functions — "read this file", "search this
database", "send this iMessage" — that Claude can call during a
session.

The kit installs two MCP servers:

- **lean-ctx** — a smart file reader. Instead of Claude loading every
  line of every file it looks at, lean-ctx compresses, caches, and
  returns only the relevant bits. This matters more than you'd
  think: a single large file can eat 20% of your context budget.
  lean-ctx makes big codebases feel small.
- **Armory** — your personal knowledge vault. Ingested video
  transcripts, cheat sheets, notes from meetings — all searchable
  through Claude with a single call.

You can add more MCP servers over time. The community has built MCPs
for Gmail, Calendar, GitHub, Slack, Notion, Postgres, and dozens of
others. They're installed and wired up in `~/.mcp.json`.

## What is Plan Mode?

Plan Mode is a Claude Code feature that lets you have a design
conversation before any code gets written. You press **Shift + Tab**
twice to enter Plan Mode. In this mode, Claude can think, search,
read files, and write a full plan — but it can't create, edit, or
delete anything. When you're happy with the plan, you approve it
and Claude executes.

This is the single highest-leverage keystroke in Claude Code. Before
any non-trivial change, pop into Plan Mode. Argue with Claude about
the approach. Catch bad ideas before they become code. Then let it
build.

Plan Mode is explained in depth in [WORKFLOWS.md](WORKFLOWS.md).

## What is Wispr Flow?

Wispr Flow is a paid Mac app (around $15/month as of this writing)
that adds fluent voice dictation across your entire machine. You
hold a key, you talk, Wispr types what you said into whatever field
is focused — including your Claude Code terminal.

Why it's recommended: talking is faster than typing, and it changes
how you use Claude. When you can just speak, your first draft is
your first thought instead of a stilted keyboard version of it.
Braindumps get longer and looser. Bug reports get more detail.
Design conversations feel like conversations instead of interviews.

Wispr is not free and it's Mac-only. The kit doesn't bundle it —
you install it separately from [wispr.com](https://wispr.com).
The kit works perfectly without it. There's also a free `/voice`
skill that gives you hold-to-record inside a Claude session as a
lightweight alternative.

## What is lean-ctx?

lean-ctx (Lean Context) is an MCP server that replaces Claude's
default file-reading behavior with a smarter version. Instead of
loading every byte of every file Claude looks at, lean-ctx:

- Caches files you've already read (re-reads cost almost nothing)
- Compresses files intelligently — signatures only, maps of
  dependencies, diff views
- Stores files under short reference IDs (F1, F2, F3) so they don't
  eat space in future messages
- Auto-selects the right compression mode for the situation

The practical effect: you can work with codebases that would
normally blow out your context window. A 200-file project becomes
browsable without hitting the wall.

It's installed automatically by the kit and Claude uses it
transparently. You don't have to know it's there — but when
something feels fast that shouldn't be, that's why.

## What is the Armory?

The Armory is your personal knowledge vault. It's a folder inside
your brain (`~/Projects/_brain/Armory/`) that stores notes you've
ingested from the world: video transcripts, article summaries,
cheat sheets, tool reviews, technique write-ups.

You feed the Armory by running `/ingest <url>` on anything you find
useful. Claude downloads the content, summarizes it, extracts the
key insight, and files it as a structured note. Later, when you're
working on something and Claude needs a reference, it searches the
Armory and pulls the relevant notes without you having to remember
which video you saw that tip in.

The Armory also has a **Focus.md** file that records what you're
currently working on. If you picked Path C ("I don't know yet")
during `/welcome`, the Armory starts in **auto-learn mode** — it
watches what you engage with and proposes focus areas after a few
weeks of observation. You don't have to commit to anything upfront.

## What does "sanitization" mean in this kit?

This kit is public on GitHub. I use the same setup for real client
work, which means my local version has references to projects,
people, pricing, and brands that shouldn't be in a public repo.

"Sanitization" is the process of removing all of that from the kit
before publishing. It has four layers of defense:

1. An **allow-list** in the installer — only files explicitly named
   get copied into the kit. Nothing else ships by accident.
2. A **banned-strings** grep in the pre-commit hook that blocks any
   commit containing a flagged word (project names, client names,
   brand names) with word-boundary matching so common English words
   don't false-positive.
3. **Line-by-line review** of every file before it ships, checking
   for subtle leaks (personal anecdotes, hardcoded paths, "when I
   worked at X" style context).
4. A **pre-publish review checkpoint** where a human reads every
   changed file before the kit goes public.

Why this matters to you: the kit you installed is clean. There are
no stale references to my work in your copy. And if you ever want
to package up your own version of your setup and share it, the same
four layers are available — just add your own strings to
`.banned-strings` and follow the same pattern.
