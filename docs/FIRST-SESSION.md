# Your First Session

You installed the kit. Now what?

This doc walks you through what happens when you start Claude Code
for the first time after the installer has run. Read it before you
open your terminal — it takes two minutes and you'll recognize
every step as it happens.

---

## Opening the session

Open a terminal (Terminal.app on Mac, PowerShell on Windows) and
run:

```bash
cd ~/Projects
claude
```

You're now in a Claude Code session, started from your `Projects`
directory. The kit expects all your real work to happen under
`~/Projects/`, so this is home base.

## The Overwatch banner

The first thing you see is the Overwatch banner. This is a message
the kit's `SessionStart` hook prints before Claude says anything.
On a fresh install, it looks something like:

```
=================================================================
  OVERWATCH — Claude Code Starter Kit
  Looks like this is your first time.
  Run /welcome to get started.
=================================================================
```

The banner also runs on every future session and prints things you
need to know before you start typing: unread comms, broken builds,
expiring tokens, pending decisions. Today it has one job — tell
you to run `/welcome`.

## Running /welcome

Type `/welcome` and press enter.

Claude picks up the skill, reads its instructions, and starts an
interview. The first message is short and to the point, something
like:

> Hey — welcome. I'm going to ask you a handful of questions so
> this kit actually knows who you are and how you like to work.
> About 5 minutes. Then you're going to tell me what's been on
> your mind, and that's where the real work starts.
>
> First question: what should I call you?

From here, it's a conversation. Answer in whatever voice feels
natural. The interview has seven sections:

### Section 1: Identity

Four questions, one at a time:

1. What to call you
2. What you do (role, job, "between things" is fine)
3. Mac or Windows
4. Where you're at with coding (none, some scripting, real programming)

Early on — question 1 or 2 — Claude drops a single short line about
Wispr Flow: "by the way, voice input works great for this, just
talk." It says it once. If you don't have Wispr or don't care, just
keep typing.

After all four answers, Claude writes `~/Projects/_brain/<your-name>-Profile.md`.
Your profile now exists.

### Section 2: The projects fork

This is the most important question in the interview. You get
three paths and **any of them is fine**:

**Path A — "I have specific projects in mind."**
Best for people who came to the kit with work already lined up.
You'll name each project and give it a one-sentence description.
They get written to your Armory Focus file with `status: active`.

**Path B — "I'm exploring. I have problems and curiosities but no
projects yet."**
Best for people who want to build something but aren't sure what.
Claude runs a short discovery interview — five questions about
what you've been googling, what you'd mess around with on a free
Saturday, what daily tool you think you could build better. It
synthesizes 2-4 provisional focus areas from your answers, says
them back to you, and writes them to your Focus file with
`status: exploratory`.

**Path C — "I don't know yet. Just let me start using the kit
and figure it out as I go."**
This is the path most people should pick. It's a **first-class
choice**. Claude will not push you to commit. Your Focus file
gets written in **auto-learn mode**, which means the Armory
watches what you actually engage with over the next 30 days and
proposes focus areas at that point based on real behavior. You
are never penalized for starting undecided.

### Section 3: Working style calibration

Four multiple-choice questions. Answer with just the letter.

1. **Response style:** short / long / mixed
2. **Risky actions:** trust me / confirm first / explain and wait
3. **Found bug:** fix and move on / fix and tell me / flag only
4. **Code comments:** only when non-obvious / only when asked / never

These become your `Working-Style.md` file, which Claude reads every
session. You never have to repeat yourself. If you change your
mind later, you can edit the file directly or run `/welcome` again
and pick "update working style".

### Section 4: Open-ended communication note (optional)

One question: "anything else about how you prefer to communicate
that would help me not annoy you?" Tangents, tone, pace, feedback
style — whatever. Or just say "skip". This is genuinely optional
and many users skip it on their first pass.

### Section 5: Memory seeding

Claude silently appends a few entries to its per-project memory
file so future sessions know who you are without re-reading the
profile. You won't see this happen — it's infrastructure.

### Section 6: File writes announced

Claude tells you what it just saved. Usually three files:

- `<Name>-Profile.md` — who you are
- `Feedback/Working-Style.md` — how we talk
- `Armory/Focus.md` — what you're into

All of these are yours. You can open them in any editor and edit
them any time.

### Section 7: Transition to the first braindump

This is the moment the whole interview was building toward.
Claude says something like:

> Now for the real thing.
>
> Just tell me what's been on your mind lately. Problems that
> bug you, things you wish existed, stuff you've been watching
> videos about, the half-formed ideas you keep not writing down.
> Don't try to be organized — I'll organize it for you.
>
> Whenever you're ready, just start talking.

Then Claude stops. Waiting for you.

## The braindump

This is where the kit actually starts paying off. Don't try to be
organized. Don't filter. Don't worry about making sense.

**If you have Wispr Flow**, this is the moment to use it. Hold the
key, talk for five to ten minutes, dump everything on your mind.
The half-ideas. The frustrations. The things you keep almost
writing down. The app idea you've had for three years but never
articulated. The tool you wish existed. The problem you thought
someone must have solved by now but apparently hasn't.

**If you don't have Wispr**, type `/voice` into Claude to start
the free alternative — it gives you a hold-spacebar-to-record
dictation flow right inside the session. Or just type it out. It
works either way; voice is faster.

Claude listens. It might ask gentle clarifying questions ("what
do you mean by X?") but it won't interrogate you. As themes
emerge, it reflects them back: "I notice you've mentioned habit
tracking three times — is that something you want me to note?"

Behind the scenes, Claude is capturing your braindump into
`~/Projects/_brain/Ideas/Braindumps/<today>-welcome.md`. That file
is yours forever. If something you said sparks something six
months from now, the original thought is still there.

## Wrapping up

The braindump ends when the energy shifts — you pause, you say
"that's it", you ask what's next. Claude will recognize the shift
and:

1. Give you a short recap of the themes it heard (not a transcript)
2. Point at what to try next — usually `/today` tomorrow morning,
   or `/new-project` if a concrete idea emerged from the braindump
3. Delete the `~/.claude/.welcome-pending` marker so the banner
   doesn't nag you next session

That's the end of the first session.

## End of session: `/wrap`

Before you close the terminal, run:

```
/wrap
```

This is the most important habit in the kit. `/wrap` does the
following:

- Runs the `context-updater` agent on any project you touched
- Runs the `brain-updater` agent on your brain folder
- Commits everything that changed, with good commit messages
- Pushes the commits to GitHub
- Writes a **handoff prompt** for next time — a short summary of
  what you did, what's in progress, and what the next step is

When you come back tomorrow, you type `claude -c` to continue the
session (or `claude` for a fresh one) and Claude picks up with
full context. No "what were we doing again?" moment.

Get in the habit of running `/wrap` every time you finish a work
session. Five minutes of wrapping saves an hour of ramping back up.

## What to do next

- **Tomorrow morning:** run `/today` in a fresh Claude session.
  You get a daily briefing: priorities across all your projects,
  what changed yesterday, pending comms, relevant knowledge tips
  from the Armory.
- **When an idea crystallizes:** run `/new-project <name>`. The
  skill walks you through a short discovery conversation, scaffolds
  a full project directory, wires it into your brain, creates a
  GitHub repo, and sets up the context docs so Claude can pick up
  the work immediately.
- **When you find a useful video, article, or tool:** run
  `/ingest <url>`. Claude downloads the content, summarizes it,
  extracts the actionable bits, and files it in your Armory. Next
  time you need that knowledge, Claude can pull it up without you
  having to remember where you saw it.
- **On a quiet day:** run `/scout`. It autonomously hunts for new
  tools and techniques in your focus areas and reports what it
  found. Great for keeping up with a fast-moving field without
  spending all day in YouTube.
- **Read the other docs:** [CHEATSHEET.md](CHEATSHEET.md) is the
  one you'll refer to most. [WORKFLOWS.md](WORKFLOWS.md) is the
  one you'll wish you'd read sooner.

Welcome. Go build something.
