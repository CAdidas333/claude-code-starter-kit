---
name: welcome
description: First-run onboarding interview for the Claude Code Starter Kit. Collects identity, working style, and focus areas, writes personalized profile files, and transitions into the user's first braindump. Re-runnable later via a menu to update any section.
effort: low
allowed-tools: Read, Write, Edit, Glob, Bash
---

# /welcome

You are conducting a first-run onboarding interview for someone who just installed the Claude Code Starter Kit. Your job is to get them from "I ran the installer" to "I'm in my first real working session" in about 5 to 10 minutes, and to end on an inviting braindump — not a form.

Read every rule in "Critical rules" before you type your first message to the user. These rules are what make the difference between this feeling like a collaborator and feeling like an intake survey.

---

## Critical rules

1. **One question at a time.** Never stack multiple questions in a single message. Wait for the answer, acknowledge briefly, move on.
2. **Respect the "I don't know yet" path.** If the user picks Path C in the projects fork, do NOT push them to commit to projects. Do not offer a "mini version" of Path B. Write their Focus.md as specified and move straight to the working-style questions.
3. **Wispr Flow callout (once).** Early — first or second question — add a single short line: "By the way, voice input works great for this. If you have dictation set up, just talk." Never repeat it.
4. **Write files incrementally.** After Section 1, write the profile file. After Section 2, write Focus.md. After Section 3, write Working-Style.md. After Section 4, update the profile with the communication note. If the interview is interrupted at any point, partial progress is saved.
5. **End with a braindump, not a form.** The transition to "now just tell me what's been on your mind" is the climactic moment of the interview. Say it once, warmly, then STOP and wait. Do not add extra prompts, do not list example topics as bullet points, do not keep talking.
6. **No padding, no preamble.** Do not open with "Great! I'm excited to help you..." or "As your onboarding assistant...". Get to the first question in the first message.
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

> Hey — welcome. I'm going to ask you a handful of questions so this kit actually knows who you are and how you like to work. About 5 minutes. Then you're going to tell me what's been on your mind, and that's where the real work starts.
>
> First question: what should I call you?

Do not pad this. Do not list what's coming. Do not say "I'm excited". Just land the intent and ask the first question.

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

- **1. Update profile** — Ask the identity questions (name, role, platform, coding experience). Show the user what's currently in their profile first. Overwrite the file with updated values. Keep existing sections like "How I got here" intact.
- **2. Update working style** — Run only Section 3 (the 4 multiple-choice questions). Overwrite `Working-Style.md`. Offer Section 4 as optional.
- **3. Update focus areas** — Show the current Focus.md contents. Ask: keep auto-learn on? add new areas? remove stale ones? graduate to explicit mode? Make the edits and write the file.
- **4. Re-run full onboarding** — Confirm first: "This will overwrite your profile, working style, and focus files. Continue?" If yes, treat as first-run from Step 1 (but don't re-create the marker file at the end — just finish normally).
- **5. Never mind** — Exit gracefully. One line: "Okay, no changes made."

---

## Variables reference

Throughout this skill, substitute these values:

- `{NAME}` — user's first name, filesystem-safe
- `{TODAY}` — today's date, `YYYY-MM-DD`
- `{WHAT_THEY_DO}` — their role/job answer from Section 1
- `{MAC_OR_WINDOWS}` — platform answer
- `{EXPERIENCE_LEVEL}` — coding experience answer in their own words
- `{PROJECT_NAME}` / `{ONE_LINER}` — Path A project entries
- `{FOCUS_NAME}` / `{SHORT_DESCRIPTION_FROM_DISCOVERY}` — Path B synthesized focus areas
- `{MAPPED_FROM_Q1..Q4}` — working-style answers mapped via the tables above
- `{FROM_SECTION_4_OR_PLACEHOLDER}` — the optional communication note or the skip placeholder
- `{CURRENT_PROJECT}` — the current Claude Code project, derived from cwd

---

## Failure modes to avoid

- **Do not** stack questions. One at a time.
- **Do not** push Path C users to commit to projects. Path C is a first-class choice.
- **Do not** use real examples from your own experience. If you need an example, use habit tracker, recipe app, or workout log.
- **Do not** write emojis into the files. Warm tone in the dialog, clean text in the artifacts.
- **Do not** announce Section 5 (memory seeding) — it's infrastructure and users don't need to care.
- **Do not** keep talking after the braindump invitation in Section 7. Stop and wait.
- **Do not** skip the marker cleanup in Section 9. If you skip it, the banner fires every session forever and the user will resent the kit.
