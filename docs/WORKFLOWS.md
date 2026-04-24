# Workflows — The Operational Wisdom

This is the doc you'll wish you'd read sooner.

The Quick Start gets you installed. FIRST-SESSION gets you through
your first hour. This doc is the stuff that takes people six months
of trial and error to figure out on their own. Read it once, then
come back to individual sections when something isn't working.

---

## Table of contents

1. [Talk, don't type](#1-talk-dont-type)
2. [Plan Mode — the highest-leverage keystroke](#2-plan-mode)
3. [Context management — the 40% rule](#3-context-management)
4. [Session discipline](#4-session-discipline)
5. [The memory system](#5-the-memory-system)
6. [Working with multiple projects](#6-working-with-multiple-projects)
7. [The /wrap skill](#7-the-wrap-skill)
8. [Subagents and the dispatch pattern](#8-subagents)
9. [The Armory](#9-the-armory)
10. [The Brain](#10-the-brain)
11. [Common anti-patterns](#11-common-anti-patterns)

---

## 1. Talk, don't type

The single biggest upgrade you can make to your Claude Code
experience isn't a setting or a command. It's voice input.

When you type, you edit in real time. You drop half-formed thoughts.
You shorten sentences to save keystrokes. You omit context you'd
naturally include if you were explaining the problem to a friend.
The result is a prompt that's technically correct but starved of
context, and Claude's first reply is a negotiation about what you
actually meant.

When you talk, none of that happens. You just say what's on your
mind. Your first draft is your first thought. Tangents happen, and
tangents contain context Claude uses to give you better answers.
Bug reports that would be three sentences typed become three
paragraphs spoken — and those extra two paragraphs are exactly the
detail Claude needs to find the bug on the first try.

**Two ways to get voice input:**

1. **Wispr Flow** — a paid Mac app, around $15/month. Fluent,
   system-wide dictation. You hold a key, you talk, the text
   appears in whatever field has focus. Worth every penny.
2. **`/voice`** — a free skill that ships with the kit. Type
   `/voice` in a Claude session, hold spacebar to record, release
   to transcribe. Lightweight alternative that works on any OS.

Use whichever you have access to. But use one of them. If you're
still typing everything three weeks into using this kit, you're
leaving most of the value on the floor.

**The habit shift that matters:** instead of trying to craft the
"perfect" prompt, think of Claude as someone you're explaining the
problem to out loud. Describe what you're working on. Describe what
went wrong. Describe what you already tried. Ramble a bit. Claude
will ask follow-ups if it needs them.

---

## 2. Plan Mode

Plan Mode is a feature where Claude can think, search, read files,
and write a full plan — but it cannot create, edit, delete, or run
destructive operations until you approve the plan. It's activated
by pressing **Shift + Tab** twice in a Claude session.

**When to use it:**

- Any non-trivial refactor
- Any new feature that touches more than one file
- Any change where you're not 100% sure of the approach
- Any time you'd normally spend ten minutes arguing with yourself
  about which direction to go
- Any task where "undoing it" would be painful

**How to use it:**

1. Describe the problem and the outcome you want
2. Hit Shift+Tab+Tab to enter Plan Mode
3. Let Claude read the relevant files and think
4. Read the plan it produces
5. **Argue with it.** Disagree with parts. Ask "why not X instead?"
   Ask "what about Y case?" Iterate on the plan until you'd sign
   your name to it.
6. Approve the plan. Claude executes.

**Why this is the highest-leverage keystroke in Claude Code:**

Most bad outcomes in AI-assisted coding come from executing a plan
that was wrong before it started. The fix is cheap — think harder
about the plan — but without Plan Mode there's no natural friction
forcing you to do that. Claude just starts coding and you realize
fifteen edits in that it's solving the wrong problem.

Plan Mode creates that friction in the right place. Ten minutes in
Plan Mode regularly saves hours of downstream debugging.

**When NOT to use it:**

- Trivial changes (one-line fixes, typo corrections)
- Exploratory work where you're just poking around
- Urgent fixes where speed matters more than precision
- Rubber-duck-debugging conversations where you're thinking out
  loud and don't want Claude to take the wheel yet

**Plan Mode etiquette:**

When Claude produces a plan, don't just skim it. Read every step.
If there's a step you don't understand, ask Claude to explain it
before you approve. If there's a step you disagree with, say so.
The plan is a contract — once you approve it, Claude will execute
it to the letter, so make sure the letter is right.

---

## 3. Context management

Claude Code has a large context window but it is not infinite, and
quality **degrades long before the window is full**. This is the
single most important operational fact about Claude Code, and most
new users don't know it until they've burned a week of work to the
pattern.

### The 40% rule

When your context usage (visible via `/status` or `/cost`) passes
roughly **40% of the window**, quality starts to drop. Responses get
vaguer. Claude starts to forget earlier constraints. Hallucinations
become more likely. By 70% you're getting worse results than a fresh
session would give you, and by 90% you're fighting the tool.

The window size is there for occasional deep dives, not for
comfortable steady-state work. **Treat 40% as your working ceiling.**

### What eats context

- **Big file reads.** Loading a 3000-line file takes 15-20k tokens.
  Loading five of them takes you to the 40% line by itself. Use
  lean-ctx (installed with the kit) to dramatically reduce this —
  it caches files and returns compressed views.
- **Long conversations.** Every back-and-forth adds up. A 40-turn
  conversation even with short messages can easily hit 30%.
- **Big tool outputs.** `ls -la` on a huge directory, `git log` on a
  long history, search results from a broad query — these can eat
  thousands of tokens per call.
- **Repeated rereads.** Asking Claude to "check the file again" when
  it already has it loaded wastes tokens. Reference cached files by
  their F-number instead.

### Compact vs new session vs continue

You have three options when context is getting heavy:

**`/compact`** — Claude summarizes the conversation so far into a
short recap, drops the full history, and keeps going. Good when
you're in the middle of a task and don't want to lose state but
need to free up space. Bad when the task is too nuanced to summarize
without losing the key details.

**New session (`/clear` or relaunch)** — nuclear option. You lose
everything, start fresh. Good when you're starting a genuinely
different task. Bad when you're mid-task and the next session would
need ten minutes of context ramp-up.

**`claude -c` (continue)** — starts a new session but loads the
previous one's handoff. The handoff is short (a few hundred
tokens) and gives the new session just enough context to pick up.
This is the cleanest option for most transitions, and `/wrap`
writes the handoff for you.

**The general rule:** if your context is at 30%, keep going. At
40%, wrap up what you're doing and decide. At 50%+, wrap cleanly
and start a fresh session.

---

## 4. Session discipline

The single biggest difference between people who use Claude Code
casually and people who use it as a serious tool is session
discipline. Casual users open one session and let it sprawl until
context runs out. Serious users start clean, work in focused
blocks, wrap intentionally, and start again.

### Starting a session cleanly

Every session should have a clear goal before you type the first
prompt. If you don't know what you're working on, you're not ready
to start — open a notes file and braindump first, then start the
Claude session.

Opening moves:

1. Decide which project you're working on
2. Open a terminal in that project's directory
3. Run `claude` (fresh) or `claude -c` (continue from handoff)
4. Read the Overwatch banner — if it has something to tell you,
   act on it before starting your work
5. Tell Claude what you're trying to accomplish in one or two
   sentences

Avoid starting a session with "let's just poke around and see what
happens". That's an invitation to waste an hour.

### Working in focused blocks

A focused block is 30 to 90 minutes on a single task with a single
goal. At the end of the block, you either complete the task or
document where you left off.

Longer than 90 minutes and you start losing the thread. Your
context fills up. The commit message at the end is a mess because
you're trying to summarize three things at once. Break up long
work into two or three focused blocks with `/wrap` between them.

### Wrapping cleanly

**Every work block ends with `/wrap`.** This is non-negotiable if
you want the kit to actually save you time. Skipping `/wrap`
means:

- Your changes don't get committed, so tomorrow you're re-reading
  diffs to figure out what you did
- The context updater doesn't run, so tomorrow Claude doesn't know
  what the current state of the project is
- The brain updater doesn't run, so cross-project awareness gets
  stale
- You don't have a handoff prompt, so tomorrow's first message is
  "uh, what was I doing?"

Five minutes at the end of a block. Every time.

### Handoff prompts

A handoff prompt is a short paragraph written at the end of a
session that tells the next session what you were doing, where you
left off, and what the next step is. `/wrap` writes one
automatically into your project's context docs.

Next session, you start with:

```
claude -c
```

and Claude loads the handoff automatically. Or you start fresh and
paste the handoff in yourself as your first message.

**Good handoff prompts:**

- Name the task
- Name the current state (what's done, what's in progress)
- Name the next concrete action (not "keep working on X" — "run
  `npm test` and fix the three failing cases in user-auth.spec.ts")
- Link to any relevant files or docs

---

## 5. The memory system

Claude Code has a multi-layer memory system. Understanding where
things live and what gets remembered automatically vs what you have
to save explicitly is the difference between "Claude remembers
everything" and "why does Claude keep forgetting what I told it".

### The four layers

**1. User memory (`~/.claude/CLAUDE.md`)**
Global instructions that apply to every session on your machine.
You write this yourself. Things that belong here: your name,
your preferred programming languages, tools you always want Claude
to use, rules you want enforced everywhere.

**2. Project memory (`~/.claude/projects/<id>/memory/MEMORY.md`)**
Per-project facts Claude has learned. Partly auto-managed — Claude
can append to it when it learns something durable — and partly
manual (you can edit it directly). Things that belong here:
architectural decisions, environment details, project-specific
conventions, people on the team.

**3. Root `CLAUDE.md` in a project directory**
Project-scoped instructions that load automatically when a session
starts in that directory. Things that belong here: "use pnpm not
npm", "tests live in `tests/`, not `__tests__/`", "never commit
without running the linter".

**4. Brain files (`~/Projects/_brain/`)**
The kit's cross-project knowledge layer. Claude reads your
Working-Style, your focus areas, and your dashboard at session
start. Things that belong here: how you like to work, what you're
focused on, what decisions have been made and shouldn't be
re-litigated.

### What gets auto-saved vs explicit

**Auto-saved:**

- Brain updates when you run `/wrap`
- Context doc updates when you run `/wrap`
- Memory entries when you say "remember that X"
- Armory notes when you run `/ingest`
- Profile updates when you run `/welcome` in menu mode

**Explicit:**

- Anything you type into `CLAUDE.md` files yourself
- Direct edits to memory or brain files
- Working-style preferences (written once by `/welcome`, editable
  any time)

The rule of thumb: if you told Claude something important and you
want it to persist, run `/wrap` at the end of the session. That
triggers the updater agents that write the durable artifacts.

---

## 6. Working with multiple projects

The moment you have more than one active project is the moment
context isolation becomes critical.

### The one-project-per-window rule

Never run two projects in the same Claude session. Not for one
prompt, not "just to quickly check", not ever. When you do, what
happens is:

- Claude gets confused about which codebase it's in
- It starts applying conventions from project A to project B
- File references become ambiguous
- `/wrap` produces a commit message that's half-project-A and
  half-project-B
- Your brain updater gets confused data

Instead: open a new cmux window (Mac) or a new Claude Code Desktop
tab (Windows) for each project. Each one is its own session, its
own context, its own brain slice.

### Naming and organizing windows

A workflow that scales:

- One cmux **workspace** per top-level project family (work, personal
  side projects, learning, etc.)
- One cmux **window** per active project within that workspace
- Each window starts in the project's directory so the
  `CLAUDE.md` loads correctly
- Keep windows open for the duration of an active project — even
  when you're not using them, reopening later means you get the
  handoff prompt from the previous session without remembering
  where the project lived

### Cross-project awareness through the brain

The kit's brain folder (`~/Projects/_brain/`) is the one place where
cross-project thinking happens. The `Dashboard.md` file has the
status of every active project. When you run `/today`, Claude reads
the dashboard and gives you a summary that spans everything at
once.

If you need to make a decision that affects multiple projects —
"should I use Postgres or SQLite for my next project?" — open a
fresh Claude session in `~/Projects/` (not inside a specific
project directory) and talk to Claude there. It can read the brain
and see the whole landscape without getting pinned to any one
project.

---

## 7. The /wrap skill

`/wrap` is the most important habit you'll form with this kit.
It's the skill that makes everything else sustainable.

### What /wrap actually does

When you type `/wrap`, the skill:

1. **Runs the `context-updater` agent** on the current project.
   The agent reads your git diff, your session history, and the
   project's existing context docs, and writes updates so next
   session starts informed. Specifically it updates:
   - `docs/context/ACTIVE_PROJECTS.md` — current status
   - `docs/context/SESSION_LOG.md` — a new entry for this session
   - `docs/context/MASTER_CONTEXT.md` — architectural notes if
     anything changed

2. **Runs the `brain-updater` agent** on your brain folder.
   It reads what happened in this session and updates
   `~/Projects/_brain/Dashboard.md` if any project status changed,
   appends to `Lessons.md` if a generalizable insight came out of
   the session, and updates any other relevant cross-project
   files.

3. **Stages and commits** the changes in the current project and
   in the brain, with commit messages derived from what actually
   happened (not a generic "wip" message).

4. **Pushes to origin** so your work is backed up and accessible
   from other machines or to a mobile Claude session.

5. **Writes a handoff prompt** into the project's context docs.
   This is the paragraph next session will read to get up to
   speed.

6. **Prints a summary** of what it did so you can scan it before
   closing the terminal.

### When to run /wrap

- End of every focused work block
- Before you switch projects
- Before a meeting or a break that will take you out of flow for
  more than 20 minutes
- Before your context gets too heavy to work cleanly
- Any time you want a clean state to come back to

### When NOT to run /wrap

- Mid-task, when you're about to keep going — let the task reach
  a stable point first
- When nothing has changed since the last wrap — the skill will
  detect this and refuse
- When you're in the middle of a failing build — fix the build
  first, then wrap

### The /wrap habit

The kit's value compounds only if you wrap consistently. A week of
wrapping religiously gives you a dashboard that accurately
reflects reality, context docs that load Claude into productive
mode in seconds, and commit history you can read like a journal.

A week of skipping `/wrap` gives you stale docs, a broken
dashboard, and a brain folder that nobody trusts.

---

## 8. Subagents

A subagent is a separate Claude instance spawned with a narrow
task and its own context window. When the task is done, the
subagent returns only its result — its own conversation history
does not pollute your main session.

### When to use a subagent

- **Research that would eat context.** "Search the codebase for
  every place we do auth, summarize the patterns, come back with
  a list." Running this in your main session loads a dozen files
  that you don't need permanently. Running it in a subagent means
  you get back the summary, not the raw files.
- **Parallelizable work.** Two or three independent tasks that
  don't share state can be dispatched to subagents in parallel.
  You get three results in the time it would take to do one.
- **Self-contained transformations.** "Rewrite this test suite
  from Jest to Vitest." Clear input, clear output, no need for
  the main session to see the intermediate work.
- **Anything the kit's skills already do.** `/wrap` uses the
  context-updater and brain-updater agents internally — you don't
  have to invoke them by hand.

### When NOT to use a subagent

- **Conversational work.** If you need to go back and forth with
  Claude, keep it in the main session. Subagents are one-shot.
- **Tasks where you need to verify progress mid-flight.** Once you
  dispatch a subagent you can't interrupt it gracefully.
- **Trivial tasks.** The overhead of spawning a subagent is real;
  it's not worth it for a two-line change.
- **Tasks that need permissions the subagent doesn't have.** Some
  tools are restricted in sub-contexts.

### The dispatch pattern

The common pattern is:

1. In your main session, describe the task
2. Say "dispatch this to a subagent and report back"
3. Claude spawns the agent, the agent runs, returns its result
4. You review the result in the main session

For parallel work, describe all the tasks up front and say
"dispatch these as parallel subagents". Claude launches them
simultaneously and waits for all results before reporting back.

---

## 9. The Armory

The Armory is your personal knowledge vault. It lives at
`~/Projects/_brain/Armory/` and it fills up as you use the kit.

### Building it up via /ingest

Every time you find a useful video, article, tweet, or tool, run:

```
/ingest https://youtube.com/watch?v=...
```

Claude downloads the content (transcript for videos, article text
for web pages), summarizes it, extracts the key insight, and files
a structured note in `Armory/Notes/<date>_<slug>.md`. The note has
a standard shape: title, source URL, topics, key insight, details,
how to apply.

After a month of regular ingestion, you have a searchable library
of the best stuff you've watched and read, tagged and filed
without any effort. Three months in, it becomes a real asset — you
can ask Claude "what did I learn about X?" and get back a curated
summary pulled from your own notes.

### How focus areas work

The Armory has a `Focus.md` file that records what you're currently
working on. When you run `/welcome`, one of the three paths sets
this up:

- **Path A** — explicit focus areas you named
- **Path B** — exploratory areas synthesized from a discovery
  interview
- **Path C** — empty Focus.md in auto-learn mode

`Focus.md` affects how other skills behave:

- `/today` tailors the daily brief to your focus areas
- `/ingest` asks which focus area a new note is relevant to
- `/scout` prioritizes hunting in your focus areas
- `/audit` reports adoption per focus area

### Auto-learn mode

If `auto_learn: true` in `Focus.md`, the kit is in observation
mode. It watches what you actually engage with — projects you
create, notes you ingest, topics you ask Claude about — and after
about 30 days of signal, `/audit` will cluster the patterns and
propose focus areas for your approval.

This is the "I don't know yet" path and it's first-class. You
are never penalized for starting undecided. The kit learns you as
you use it.

---

## 10. The Brain

The brain is the cross-project knowledge hub at
`~/Projects/_brain/`. It's the thing that makes Claude feel like
it knows you across sessions, across projects, and across days.

### How it works with per-project context

Each project has its own `docs/context/` folder with
MASTER_CONTEXT, ACTIVE_PROJECTS, and SESSION_LOG files. Those are
the project-level memory. The brain is the cross-project layer
sitting above them.

When you start a session in a specific project directory, Claude
reads:

1. The project's `CLAUDE.md` (project-specific rules)
2. The project's `docs/context/MASTER_CONTEXT.md` (project state)
3. The global `~/Projects/CLAUDE.md` (cross-project rules)
4. The brain's `Dashboard.md` (if referenced)
5. The brain's `Feedback/Working-Style.md` (your preferences)

Project-specific details come from the project. Cross-cutting
concerns come from the brain. Together they give Claude a full
picture without any of the layers having to duplicate the others'
content.

### What to put in the brain

- Working preferences that apply across all projects
- Decisions that should not be re-litigated (architectural
  philosophies, tool choices, off-limits topics)
- Ideas and braindumps that haven't become projects yet
- Ingested knowledge (Armory notes)
- Launch-and-roadmap stuff that spans projects

### What NOT to put in the brain

- Project-specific code (lives in the project)
- Project-specific architectural notes (lives in
  `docs/context/MASTER_CONTEXT.md`)
- Session logs for a specific project (lives in
  `docs/context/SESSION_LOG.md`)
- Secrets, credentials, private keys

### Obsidian on top of the brain

Open the brain folder as a vault in Obsidian and you get:

- Graph view of how notes link to each other
- Backlinks on every page
- Quick switcher for instant navigation
- Full-text search that's way faster than grep

The brain is just markdown files — Obsidian is an optional but
very nice UI over them.

---

## 11. Common anti-patterns

Things to stop doing.

### Letting sessions run forever

"I'll just keep this one going" is how you end up with a 90%
context window and garbage output. Start fresh when you should
start fresh. The transition cost is lower than you think because
`/wrap` handles the handoff.

### Horizontal builds

Building a whole feature across every layer at once —
"first I'll do the database, then the backend, then the API, then
the frontend" — means you have nothing working until everything
is done. Bugs hide in the seams between layers and you don't find
them until integration, by which point you can't tell which layer
they came from.

**Do vertical slices instead.** Build the smallest end-to-end
version first — one endpoint, one row in the database, one button
in the UI, all wired together. Then expand one slice at a time.
Every slice is shippable. Every bug is localized. Every day has
visible progress.

### Skipping Plan Mode for "simple" tasks

Most of the tasks people skip Plan Mode for are not simple. They
just feel simple at the start because you haven't thought about
them hard enough. Ten minutes in Plan Mode costs nothing. Two
hours of debugging the wrong approach costs everything.

Default to Plan Mode. You can always bail out of it if the task
turns out to be genuinely trivial.

### Skipping /wrap

If you close the terminal without wrapping, the following session
is degraded by exactly the amount of ramp-up you'll have to do.
Every. Time. The habit seems fussy for the first week and saves
hours every week after.

### Rewriting the same prompt four different ways

If Claude isn't giving you what you want, the answer is almost
never "phrase the prompt better". It's usually one of:

- **More context needed.** Tell Claude to read the relevant files
  first, then answer.
- **Ambiguous goal.** Describe the outcome, not the path.
- **Wrong mode.** You need Plan Mode; you're trying to build
  directly.
- **Context is too full.** Your session is degraded; start fresh.

If the same prompt is failing repeatedly, stop iterating and
diagnose. One of those four fixes usually solves it.

### Treating Claude like a search engine

"What's the best way to do X?" is the wrong first prompt. Claude
doesn't know your constraints, your codebase, your preferences.
You'll get a generic answer.

**Better:** "I'm working on Y. The constraint is Z. Read the
relevant files in `src/foo/` and tell me what approach would fit
best given our existing patterns."

Specificity is a superpower. Generic prompts get generic answers.

### Not checking the Armory before solving a problem

Six months in, the Armory is full of stuff you've ingested but
haven't put into practice. Before you solve a new problem the
hard way, check whether you already have a note about it:

```
armory_search "topic"
```

or in natural language:

> "Check the Armory for anything about X before we start."

You'd be amazed how often there's already a note on the exact
problem you're about to solve from scratch.

### Building without wrapping

You finished a feature. You're excited. You want to keep going
and build the next one.

Don't. Wrap first. Commit the finished feature. Push it. Come back
fresh for the next feature. The cost is five minutes. The benefit
is a clean commit history, a rested context, and a handoff you
can trust.

---

That's the operational wisdom. Print the [CHEATSHEET](CHEATSHEET.md)
for the quick reference, keep [CLI-REFERENCE](CLI-REFERENCE.md)
open when you're learning the commands, and come back here when
something isn't working.
