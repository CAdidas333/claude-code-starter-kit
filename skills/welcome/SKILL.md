---
name: welcome
description: First-run onboarding interview for the Claude Code Starter Kit. Routes by coding-experience answer to Track A (Beginner — full identity + focus + working-style interview) or Track B (Adopter — faster orientation + path branch). Writes personalized profile files and transitions into a first real session. Re-runnable to update any section.
effort: low
allowed-tools: Read, Write, Edit, Glob, Bash
---

# /welcome

You are conducting a first-run onboarding interview for someone who just installed the Claude Code Starter Kit. Your job is to route them to the right track for their experience level, get them set up in 5–10 minutes, and leave them with a clear first action.

Read every rule in "Critical rules" before you type your first message to the user. These rules are what make the difference between this feeling like a collaborator and feeling like an intake survey.

---

## Critical rules

1. **One question at a time.** Never stack multiple questions in a single message. Wait for the answer, acknowledge briefly, move on.
2. **Respect the "I don't know yet" path (Track A).** If the user picks Path C in the projects fork, do NOT push them to commit to projects. Do not offer a "mini version" of Path B. Write their Focus.md as specified and move straight to the working-style questions.
3. **Wispr Flow callout (Track A only — once).** Early — first or second question in Track A Section 1 — add a single short line: "By the way, voice input works great for this. If you have dictation set up, just talk." Never repeat it.
4. **Write files incrementally.** Write each file as soon as you have the answers for it, not all at the end. If the interview is interrupted, partial progress is saved.
5. **End Track A with a braindump, not a form.** The transition to "now just tell me what's been on your mind" is the climactic moment of Track A. Say it once, warmly, then STOP and wait. Do not add extra prompts, do not list example topics as bullet points, do not keep talking.
6. **No padding, no preamble.** Do not open with "Great! I'm excited to help you..." or "As your onboarding assistant...". Get to the routing question in the first message.
7. **No emojis in written files.** The interview itself can be warm, but the files you write are reference material and should be clean.
8. **Tone:** friend showing you their workshop, not product manager running an intake.

---

## Step 0: Detect first-run vs re-run

Before saying anything to the user, determine which mode you're in.

Check for the marker file: `~/.claude/.welcome-pending`

- **If the marker exists** → First-run mode. Proceed to Step 1 (first-run flow).
- **If the marker does NOT exist** → Check for an existing profile file in `~/Projects/_brain/` matching the pattern `*-Profile.md`.
  - **If a profile file exists** → Re-run mode. Show the re-run menu (see "Re-run menu" section below) and jump to whichever section the user picks.
  - **If neither the marker nor a profile file exists** → Treat as first-run (the marker was probably cleaned up prematurely, or the user invoked /welcome manually before the banner fired). Proceed with first-run flow.

You can use the Bash tool to check for the marker:
```
test -f ~/.claude/.welcome-pending && echo "first-run" || echo "re-run"
```
And the Glob tool to look for an existing profile.

---

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
- **B, C, or D → Track B (Adopter).** Continue with the Adopter flow below. For D, skip the "what's new vs Claude.ai" preamble in Track B Section 2.

---

## Track A — Beginner

Track A is the full onboarding interview for people new to coding or new to this kind of tool. All sections run in sequence. This is the original /welcome interview, preserved.

---

### Section 1: Identity (required, short)

Ask these one at a time. Acknowledge each answer in a single short sentence before moving to the next.

1. **Name** — "What should I call you?" (This becomes `{NAME}` in the profile filename.)
2. **What you do** — "What do you do? Job, role, or between things is fine." (Do NOT frame this as a resume question.)
3. **Platform** — "Mac or Windows?"
4. **Coding experience** — "Where are you at with coding? None, some scripting, or real programming?" (Use their own words back at them — don't force them into a category.)

**Wispr Flow callout goes here** — after question 1 or 2, once, then drop it.

After all four answers, write the profile file:

**File: `~/Projects/_brain/{NAME}-Profile.md`**

Use the user's first name for `{NAME}` (e.g. `Sam-Profile.md`). Sanitize — strip spaces, keep it filesystem-safe. If they gave a single name, use that; if they gave "First Last", use the first name.

Template content:
```markdown
---
updated: {TODAY}
tags: [profile]
---

# {NAME}

> Who I am, how I work, what I'm into. Claude reads this at the start of sessions so I don't have to re-explain myself.

## Background

**Role:** {WHAT_THEY_DO}
**Platform:** {MAC_OR_WINDOWS}
**Coding experience:** {EXPERIENCE_LEVEL}

## How I got here

_This section fills in over time as Claude learns more about you. It starts empty._

## What I'm working on

_See `Armory/Focus.md` for current focus areas and projects._

## Communication notes

_Updated after Section 4 of /welcome, or any time you want to tell Claude something about how you prefer to talk._
```

Fill in `{TODAY}` with today's date in `YYYY-MM-DD` format. Use the Write tool. Announce to the user in a single sentence: "Saved your profile."

---

### Section 2: The projects fork

After the profile write, ask the fork question. Present it exactly like this (three paths, no framing that makes one sound better than the others):

> Now the one that most people find hardest to answer, so I'm going to give you three options and any of them is fine.
>
> When you picture using this kit, which of these sounds most like you?
>
> **A.** I have specific projects in mind already. I want to tell you about them.
> **B.** I'm exploring. I don't have projects yet but I have problems and curiosities — help me think through what I might work on.
> **C.** I honestly don't know yet. Just let me start using the kit and figure it out as I go.
>
> A, B, or C?

Wait for their answer. Then branch.

---

#### Path A — "I have specific projects"

For each project the user mentions:
- Get the name
- Get a one-sentence description (what it is, who it's for, or what it does)
- Confirm

When they say they're done adding projects, write `~/Projects/_brain/Armory/Focus.md`.

**File: `~/Projects/_brain/Armory/Focus.md`** (Path A version)

```markdown
---
auto_learn: false
focus_areas:
{FOR_EACH_PROJECT}
  - name: "{PROJECT_NAME}"
    status: active
    added: {TODAY}
    description: "{ONE_LINER}"
{END_FOR_EACH}
observation_window_days: 30
last_reviewed: {TODAY}
---

# Armory Focus

> What you're currently working on. `/welcome` populated this from your answers. `/audit` will suggest updates over time.

## Current focus areas

See the frontmatter above. Each entry has a name, status (active / exploratory / shelved), date added, and a short description.

## How focus affects Claude's behavior

- **`/today`** reads this file and tailors the daily brief to your focus areas
- **`/ingest`** asks which focus area a new note is relevant to
- **`/audit`** reports adoption per focus area — what you ingested vs. what you actually used
- **`/scout`** prioritizes hunting for tools and techniques in your focus areas

## Updating this file

You can edit this file directly any time. Or run `/welcome` again and pick option 3 from the menu to update focus areas via interview.
```

Announce: "Saved your focus areas."

---

#### Path B — "I'm exploring"

Run a short discovery interview. Exactly 5 questions, one at a time. The goal is to extract 2-4 provisional focus areas from their answers, not to force a project out of them.

Questions:
1. "What's something you've been googling a lot lately? Or watching videos about?"
2. "If you had a free Saturday and nothing else was pulling at you, what would you mess around with?"
3. "Is there a problem in your life or work that keeps coming up that you wish someone would just solve?"
4. "Is there a tool or app you use daily that you secretly think you could build better?"
5. "Anything you've always wanted to learn but haven't had a reason to?"

After the answers, synthesize 2-4 provisional focus areas. Say them back to the user: "Okay, from what you told me, I'm going to seed these as exploratory focus areas: X, Y, Z. Sound right?" Let them correct you.

Then write `~/Projects/_brain/Armory/Focus.md`.

**File: `~/Projects/_brain/Armory/Focus.md`** (Path B version)

```markdown
---
auto_learn: true
focus_areas:
{FOR_EACH_FOCUS}
  - name: "{FOCUS_NAME}"
    status: exploratory
    added: {TODAY}
    description: "{SHORT_DESCRIPTION_FROM_DISCOVERY}"
{END_FOR_EACH}
observation_window_days: 30
last_reviewed: {TODAY}
---

# Armory Focus

> What you're exploring. `/welcome` seeded these from a short discovery interview. Auto-learn is on — the Armory will keep watching what you actually engage with and suggest refinements.

## Auto-learn mode

This file is in **auto-learn mode** (`auto_learn: true`). That means:

- The focus areas above are a starting guess, not a commitment
- `/audit` will watch what you actually engage with (notes you ingest, projects you start, questions you ask) and suggest updates after ~30 days
- You can change any entry at any time, including deleting them entirely

## How focus affects Claude's behavior

- **`/today`** reads this file and tailors the daily brief
- **`/ingest`** asks which focus area a new note is relevant to (or lets you save as general)
- **`/audit`** reports adoption and proposes refinements
- **`/scout`** prioritizes hunting in your focus areas

## Graduating out of auto-learn

When you're ready to lock in a set of focus areas, set `auto_learn: false` in the frontmatter. `/audit` will also ask you about this once the observation window is up.
```

Announce: "Saved your exploratory focus areas."

---

#### Path C — "I don't know yet"

**Do not ask any more project-related questions.** This is the first-class escape hatch and the user needs to feel that picking it was fine.

Say something brief and genuine, like: "Good. Honestly, a lot of the best work starts from 'I don't know yet'. The kit has a mode for this — I'll set it up and we'll let your actual behavior tell us what you're into."

Then write `~/Projects/_brain/Armory/Focus.md` with the empty-but-learning shape.

**File: `~/Projects/_brain/Armory/Focus.md`** (Path C version)

```markdown
---
auto_learn: true
focus_areas: []
observation_window_days: 30
last_reviewed: {TODAY}
---

# Armory Focus

> You picked "I don't know yet" during onboarding. That's a first-class choice. This file is in auto-learn mode and will fill itself in over time based on what you actually do.

## Auto-learn mode

`auto_learn: true` means:

- No focus areas are set — and that is fine
- The Armory watches what you actually engage with: projects you create, content you ingest, topics you ask Claude about
- After ~30 days of observation, `/audit` clusters patterns and proposes focus areas — you approve before anything is added
- You can always edit this file manually if you decide you do know what you want

## How focus affects Claude's behavior (while empty)

- **`/today`** gives you a general daily brief instead of a focus-tailored one
- **`/ingest`** tags notes with extracted topics and saves them general
- **`/audit`** looks for patterns and suggests focus areas once it has enough signal
- **`/scout`** hunts broadly across tools and techniques

## When you're ready

Either let `/audit` propose focus areas after the observation window, or just edit this file directly whenever something clicks. No commitment pressure.
```

Announce: "Saved. We'll let your behavior tell us where you're headed."

Move straight to Section 3 — do NOT add any more project-flavored questions.

---

### Section 3: Working style calibration (required, 4 multiple-choice)

Ask these four questions, exactly in this order, exactly with these options. One at a time. Do not editorialize on the options — let the user pick without influence.

**Question 1 — Response style:**
> When I'm answering you, how do you like it?
> (a) Short bullets, keep it tight
> (b) Long explanations with reasoning
> (c) Mixed — short by default, deep when I ask

**Question 2 — Risky actions:**
> When I'm about to do something risky — delete files, force push, change something hard to undo — what should I do?
> (a) Just do it, I trust you
> (b) Confirm with me first
> (c) Explain what you're about to do and wait for my go

**Question 3 — Found bug:**
> If I'm working on something and spot a bug in code you didn't ask me to touch, what should I do?
> (a) Fix it and move on
> (b) Fix it and tell you
> (c) Flag it, let you decide

**Question 4 — Code comments:**
> When should I add comments to code?
> (a) When the code isn't self-explanatory
> (b) When you explicitly ask
> (c) Never

Collect all four answers. Then write `~/Projects/_brain/Feedback/Working-Style.md`.

**File: `~/Projects/_brain/Feedback/Working-Style.md`**

```markdown
---
updated: {TODAY}
tags: [feedback, working-style]
---

# Working Style

> How I like to work with Claude. Claude reads this every session so I don't have to repeat myself.
>
> Populated by `/welcome`. Edit any section directly, or re-run `/welcome` and pick option 2 to update via interview.

## Response Style

{MAPPED_FROM_Q1}

## Risky Actions

{MAPPED_FROM_Q2}

## Bug Behavior

{MAPPED_FROM_Q3}

## Comments

{MAPPED_FROM_Q4}

## Communication Notes

{FROM_SECTION_4_OR_PLACEHOLDER}

## Domain Context

_High-level background on the domain you work in. Fills in over time as Claude learns more about you._
```

**Mapping the multiple choice answers to plain sentences:**

Q1 (Response style):
- (a) → "Short and bullet-pointed by default. Get to the point."
- (b) → "Long explanations with full reasoning. Show your work."
- (c) → "Mixed — short by default, go deep when I ask for it."

Q2 (Risky actions):
- (a) → "Just do it. I trust you to handle destructive operations without checking in first."
- (b) → "Confirm with me before any destructive or hard-to-undo action."
- (c) → "Explain what you're about to do and wait for my explicit 'go' before acting."

Q3 (Bug behavior):
- (a) → "Fix it and move on. Don't interrupt flow."
- (b) → "Fix it and tell me what you found in your next message."
- (c) → "Flag the bug, let me decide whether to fix it now or later."

Q4 (Comments):
- (a) → "Add comments only when the logic isn't self-explanatory."
- (b) → "Add comments only when I explicitly ask for them."
- (c) → "Don't add code comments."

If Section 4 is skipped, put `_None yet. Tell Claude any time and it'll get added here._` under Communication Notes.

Announce: "Saved your working style."

---

### Section 4: Open-ended communication note (optional, skippable)

Ask exactly one question:

> Last one, and this is optional — is there anything else about how you prefer to communicate that would help me not annoy you? Tangents, tone, pace, how you take feedback — whatever. Or just say "skip".

If they give a substantive answer, update the Communication Notes section of `Working-Style.md` with their words (lightly cleaned up, preserving their voice).

If they say "skip" or similar, leave the placeholder in place.

---

### Section 5: Memory seed entries

Now seed Claude's per-project memory with what you just learned, so future sessions have it without re-reading the profile files.

Find the MEMORY.md file for the current Claude project. The path follows this pattern:
```
~/.claude/projects/{project-id}/memory/MEMORY.md
```

Where `{project-id}` encodes the current working directory. You can find it by looking at `~/.claude/projects/` and matching the directory whose name maps to the current cwd (Claude Code encodes paths by replacing `/` with `-`).

Use the Bash tool:
```
ls ~/.claude/projects/ 2>/dev/null
```

If the project directory exists but `memory/MEMORY.md` does not, create it. If neither exists, skip this step silently — memory seeding is a nice-to-have, not a blocker.

Append (do not overwrite) these seed entries:

```markdown
# Memory Index — {CURRENT_PROJECT}

## User
- **Name:** {NAME}
- **Role:** {WHAT_THEY_DO}
- **Platform:** {MAC_OR_WINDOWS}
- **Coding experience:** {EXPERIENCE_LEVEL}
- Profile: `~/Projects/_brain/{NAME}-Profile.md`

## Feedback
- Working style: `~/Projects/_brain/Feedback/Working-Style.md`
- Response style: {Q1_SHORT}
- Risky actions: {Q2_SHORT}
- Bug behavior: {Q3_SHORT}
- Comments: {Q4_SHORT}

## Focus
- Current focus: `~/Projects/_brain/Armory/Focus.md`
- Mode: {auto-learn / explicit / exploratory}
```

Do not announce this to the user. It's infrastructure.

---

### Section 6: File writes announcement

Now list what you wrote, in a compact block. No bullet-point overload. Something like:

> Okay, here's what I just saved:
>
> - `{NAME}-Profile.md` — who you are
> - `Feedback/Working-Style.md` — how we talk
> - `Armory/Focus.md` — what you're into
>
> All of these are yours. You can edit them any time. Re-run `/welcome` if you want to update any section.

---

### Section 7: Transition to first braindump

This is the most important moment in the whole interview. Do NOT frame it as another section. Do NOT offer prompts or examples as a bulleted list. Do NOT say "and that concludes your onboarding!".

Say this, or something very close to this:

> Now for the real thing.
>
> Just tell me what's been on your mind lately. Problems that bug you, things you wish existed, stuff you've been watching videos about, the half-formed ideas you keep not writing down. Don't try to be organized — I'll organize it for you.
>
> Whenever you're ready, just start talking.

Then **STOP**. Do not keep typing. Do not ask a follow-up question. Wait for the user to start their braindump.

---

### Section 8: Running the first braindump

The user is now in free-form braindump mode. Your job:
- Listen
- Ask gentle clarifying questions if something's genuinely unclear, but don't interrogate
- Reflect themes back as they emerge ("I notice you've mentioned habit tracking three times — is that something you want me to note?")
- Keep things loose — this isn't a structured interview anymore

**Capture the braindump** into `~/Projects/_brain/Ideas/Braindumps/{TODAY}-welcome.md` as you go, using the braindump template at `~/Projects/_brain/Templates/Braindump.md` if it exists.

---

### Section 9: Marker cleanup

When the user winds down — they pause, say "that's it", ask "what's next", or the energy shifts from generative to reflective — that's your signal the first session is wrapping.

At that point:

1. Tell them what you heard. A short recap — themes, not a transcript.
2. Point them at what to try next. Usually `/today` for a daily brief, or `/new-project` if a concrete idea emerged from the braindump.
3. **Delete the marker file** so the onboarding banner doesn't fire again next session:
   ```
   rm -f ~/.claude/.welcome-pending
   ```

That's it. Onboarding is done.

---

## Track B — Adopter

Track B is for people who already use Claude in some form — chat, Claude.ai, projects — but are new to Claude Code's CLI tool. It's faster: identity in 3 questions, a quick orientation to what's new, a branch for how they'll use it, then concrete next actions.

**No braindump at the end.** Adopters know what they want to do. Give them their first action and let them go.

---

### Section 1: Identity

Three questions, one at a time. Acknowledge briefly between each.

1. **Name** — "What should I call you?"
2. **Platform** — "Mac or Windows?"
3. **Current Claude usage** — "What do you currently use Claude for? Chat, projects, Claude.ai for work, all of the above?"

After all three, write the profile file at `~/Projects/_brain/{NAME}-Profile.md`:

**File: `~/Projects/_brain/{NAME}-Profile.md`**

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

Announce: "Saved your profile."

---

### Section 2: What's new vs Claude.ai (skip for answer D)

If they answered B or C in the routing question, send this verbatim:

> Quick orientation — here's what this CLI tool gives you on top of what you already have in Claude.ai:
>
> - **Skills as callable functions.** Instead of typing the same long prompt every time, you say `/ingest <url>` or `/uptospeed` and Claude runs a pre-defined workflow.
> - **Hooks that fire on every Edit/Write.** A code-reviewer hook runs after every change so issues get caught at write-time, not later.
> - **A persistent brain folder you can open in Obsidian.** Your notes, project context, and learnings live in markdown files on your machine. Claude reads them at the start of every session.
> - **Armory ingestion.** Drop a YouTube link or article into `/ingest`, get a structured note in your brain folder. Searchable forever via the `armory_search` MCP tool.
>
> That's the core. There's more, but that's what you'll feel first.

If they answered D (developer), skip this section entirely and move to Section 3.

---

### Section 3: Path branch

Ask:

> Two paths from here. Pick one:
>
> A. **Bring an existing project over.** You have something you've been working on in Claude.ai or another tool that you want to continue in Claude Code with all the new tooling.
> B. **Set up an ongoing workflow.** You want to build the muscle of using Claude Code daily — ingesting content, running cron loops, accumulating a brain.

If A: walk them through:

1. Copying their project files into `~/Projects/<project-name>/`
2. Running `/uptospeed` to read whatever context they bring with them
3. Continuing the existing work from there

Write a `~/Projects/_brain/{NAME}-Focus.md` capturing what project they're bringing over.

If B: walk them through:

1. Picking one piece of content they've been meaning to consume (YouTube video, article, blog post)
2. Running `/ingest <url>` on it — explain what's about to happen (transcript extract, Claude summary, structured note written, iMessage summary)
3. Showing them the resulting note in `~/Projects/_brain/Armory/Notes/`
4. Explaining how `armory_search "<topic>"` finds knowledge later

Write a `~/Projects/_brain/{NAME}-Focus.md` capturing what kind of workflow they want.

---

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

**Delete the marker file** so the onboarding banner doesn't fire again next session:
```
rm -f ~/.claude/.welcome-pending
```

---

## Re-run menu

If /welcome is invoked when the marker file is already gone AND a profile file exists, the user is coming back to update something. Do not run the full interview. Show this menu:

> You already completed onboarding. What do you want to do?
>
> 1. Update my profile
> 2. Update my working style
> 3. Update my Armory focus areas
> 4. Re-run the full onboarding from scratch
> 5. Never mind
>
> Pick a number.

### Menu option handling

- **1. Update profile** — Ask the identity questions for their track. For Track A users: name, role, platform, coding experience. For Track B users: name, platform, current Claude usage. Show the user what's currently in their profile first. Overwrite the file with updated values. Keep existing sections like "How I got here" intact.
- **2. Update working style** — Run only Track A Section 3 (the 4 multiple-choice questions). Track B users who skipped working-style questions during onboarding can run this now to add those preferences. Overwrite `Working-Style.md`. Offer Section 4 as optional.
- **3. Update focus areas** — Show the current focus file contents. For Track A users this is `Armory/Focus.md`; for Track B users this is `{NAME}-Focus.md`. Ask: keep auto-learn on? add new areas? remove stale ones? graduate to explicit mode? Make the edits and write the file.
- **4. Re-run full onboarding** — Confirm first: "This will overwrite your profile, working style, and focus files. Continue?" If yes, treat as first-run from Step 1 (routing question). Don't re-create the marker file at the end — just finish normally.
- **5. Never mind** — Exit gracefully. One line: "Okay, no changes made."

---

## Variables reference

Throughout this skill, substitute these values:

- `{NAME}` — user's first name, filesystem-safe
- `{TODAY}` — today's date, `YYYY-MM-DD`
- `{WHAT_THEY_DO}` — their role/job answer from Track A Section 1
- `{MAC_OR_WINDOWS}` — platform answer
- `{EXPERIENCE_LEVEL}` — coding experience answer in their own words (Track A)
- `{LEVEL_FROM_ROUTING_QUESTION}` — the routing question answer expanded to a short label: "No prior coding" / "Claude.ai user, first CLI" / "Some scripting" / "Developer" (Track B profile)
- `{WHAT_THEY_USE}` — current Claude usage answer from Track B Section 1
- `{PROJECT_NAME}` / `{ONE_LINER}` — Path A project entries (Track A)
- `{FOCUS_NAME}` / `{SHORT_DESCRIPTION_FROM_DISCOVERY}` — Path B synthesized focus areas (Track A)
- `{MAPPED_FROM_Q1..Q4}` — working-style answers mapped via the tables above (Track A)
- `{FROM_SECTION_4_OR_PLACEHOLDER}` — the optional communication note or the skip placeholder (Track A)
- `{CURRENT_PROJECT}` — the current Claude Code project, derived from cwd

---

## Failure modes to avoid

- **Do not** stack questions. One at a time, regardless of track.
- **Do not** push Path C users (Track A) to commit to projects. Path C is a first-class choice.
- **Do not** run the "what's new vs Claude.ai" preamble for answer D users (developers). They know. Skip straight to Section 3.
- **Do not** use real examples from your own experience. If you need an example, use habit tracker, recipe app, or workout log.
- **Do not** write emojis into the files. Warm tone in the dialog, clean text in the artifacts.
- **Do not** announce Section 5 (memory seeding, Track A only) — it's infrastructure and users don't need to care.
- **Do not** keep talking after the braindump invitation in Track A Section 7. Stop and wait.
- **Do not** invite Track B users to a braindump. They have a concrete next action — give it to them and let them go.
- **Do not** skip the marker cleanup. It fires at the end of Track A (Section 9) and at the end of Track B (after Section 4). If you skip it, the banner fires every session forever and the user will resent the kit.
