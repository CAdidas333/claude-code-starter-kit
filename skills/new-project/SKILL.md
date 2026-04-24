---
name: new-project
description: Create a new project with full context system, Obsidian brain wiring, memory symlinks, and git setup. Conversational discovery first, then Claude builds everything. Run from ~/Projects root.
effort: high
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, AskUserQuestion
---

Bootstrap a new project in the ~/Projects workspace with everything wired up.

**IMPORTANT:** This skill MUST be run from `~/Projects/` (the workspace root). If the current directory is not `~/Projects`, tell the user to `cd ~/Projects` first.

---

## Phase 1: Discovery (Conversational)

This phase is a CONVERSATION, not a form. Ask questions naturally, listen to the answers, and build understanding progressively.

### Round 1 — Understanding the project

Ask these two questions together (use AskUserQuestion):

**Question 1: "Tell me about the project — what is it and what problem does it solve?"**
- Free text / open-ended (use options that give a few archetypes but expect "Other" with typed details)
- Options: "Web app / dashboard", "Mobile app", "Data tool / automation", "API / backend service"
- The user's typed response is the most important input for the entire skill

**Question 2: "Is this completely fresh development, or are you continuing work from elsewhere?"**
- Options:
  - "Fresh start" — brand new project, nothing exists yet
  - "Continuing from a prior chat / session" — has conversation history, specs, or decisions to import
  - "Migrating existing code" — has a codebase that needs to move into this workspace
  - "Forking / extending another project" — building on top of something that already exists

If they answer "Continuing from a prior chat / session":
- Ask them to paste or describe the key decisions, specs, or context from those conversations
- Ask if they have any files, artifacts, or exported content to import
- Incorporate everything they share into MASTER_CONTEXT.md

If they answer "Migrating existing code":
- Ask where the code currently lives
- Help them move/copy it into the new project directory
- Read the existing code to inform the MASTER_CONTEXT.md

### Round 2 — Objectives and classification

Ask these together (use AskUserQuestion):

**Question 3: "What are the rough project objectives? What does 'done' look like for V1?"**
- Free text / open-ended
- Options: "MVP / proof of concept", "Production tool for internal use", "Product with external users", "Research / exploration"

**Question 4: "IP ownership — who owns this?"**
- Options:
  - "Personal IP" — you own it, potential product
  - "Work / employer internal" — company tool
  - "Starts internal, may become product" — hybrid (document both paths)

**Question 5: "Priority level?"**
- Options: "HIGH", "MEDIUM", "LOW"

**Question 6: "Any data dependencies on existing projects in your workspace?"**
- Ask the user to list any projects the new one will share data with, or answer "None".

Note: AskUserQuestion supports max 4 questions per call. Split Round 2 across two calls if needed — ask Q3+Q4 first, then Q5+Q6.

### Round 3 — Claude suggests, user confirms

Based on ALL the information gathered, Claude now SUGGESTS:

**Tech stack suggestion:**
- Analyze the project description and objectives
- Recommend a specific tech stack with brief reasoning (e.g., "React + TypeScript + PostgreSQL — good fit for a full-stack web app with relational data" or "Python + Flask — lightweight for a data automation tool")
- Present via AskUserQuestion with 2-3 stack options PLUS "Decide later as project evolves" and "Other"
- If the user wants to decide later, that's fine — use "TBD" in templates and note it for the first real session

**Project name suggestion:**
- Suggest a short, no-spaces name based on the project description (will be folder + repo name)
- Offer 2 options plus "Other" for user input
- Keep it concise — 3-8 characters ideal

### Round 3 complete — confirm and build

Summarize everything back to the user in a compact table:

| Field | Value |
|-------|-------|
| Name | {name} |
| Description | {one-liner} |
| Stack | {tech stack or TBD} |
| IP | {ownership} |
| Priority | {level} |
| Dependencies | {list or None} |
| Origin | {Fresh / Continuing from X / Migrating} |

Ask: "Ready to build? I'll create the full project structure, wire up the brain, and symlink memories."

If the user says yes, proceed to Phase 2.

---

## Phase 2: Build Everything

Execute all of the following steps. Do NOT ask for confirmation between steps — just build it all.

### Step 1: Create directory structure

```
~/Projects/{name}/
  docs/context/
  .claude/agents/
```

### Step 2: Initialize git

```bash
cd ~/Projects/{name}
git init
```

If the user has a GitHub org/username configured, also set the remote. Otherwise, leave the remote unset and note in the summary that they'll need to add one.

### Step 3: Create .gitignore

Generate a .gitignore appropriate for the tech stack. ALWAYS include:

```
# Obsidian vault config (lives at ~/Projects root)
.obsidian/

# macOS
.DS_Store
**/.DS_Store
```

Add tech-stack-specific entries. If tech stack is TBD, include common entries for Python + Node + general.

### Step 4: Create CLAUDE.md

```markdown
# {Name} — {One-Line Description}

Read `docs/context/MASTER_CONTEXT.md` for full project context.
Read `docs/context/ACTIVE_PROJECTS.md` for current tasks and priorities.

## Cross-Project Context
For how {Name} relates to other projects:
- Read `../_brain/Dashboard.md` for all project statuses at a glance.
- Read `../_brain/Cross-Project-Architecture.md` for data dependencies.
- Read `../_brain/Feedback/Working-Style.md` for global working rules.
- Read `../_brain/Feedback/Code-Standards.md` for coding standards.

## Critical {Name} Rules
<!-- Add project-specific non-negotiable rules here as they emerge -->
```

If there are cross-project data dependencies, add specific `_brain/Decisions/` references.

### Step 5: Create the 3-file context system

**docs/context/MASTER_CONTEXT.md** — Use the information gathered in Phase 1 to write a REAL context document, not a skeleton. Include:
- Frontmatter: `tags: [project]`
- Who This Is For section
- The Person: (pull from the user profile in `~/Projects/_brain/`, include IP ownership note)
- What This Project Does (use the user's description + objectives, expanded into 2-3 paragraphs)
- Origin story (if continuing from elsewhere, document where it came from and what was decided)
- Architecture section (fill in if stack is known, mark TBD if not)
- Key Decisions (populate with any decisions already made during the conversation)
- Related Projects (wikilinks to dependencies)

**docs/context/ACTIVE_PROJECTS.md** — Pre-populate with:
- Current phase (Phase 0 — Foundation, or higher if migrating existing work)
- Priority level
- Realistic initial tasks based on the project description (not generic placeholders)
- Backlog section with future ideas mentioned during conversation

**docs/context/SESSION_LOG.md** — Create Session 0 entry with:
- Everything that was discussed and decided during this bootstrap
- Origin context (if continuing from elsewhere)
- Clear "What's next" based on the conversation

### Step 6: Create Obsidian brain hub page

Create `~/Projects/_brain/{Name}.md` with proper frontmatter (tags, aliases), quick facts table, key doc wikilinks, and connections to related projects.

### Step 7: Update Dashboard

Edit `~/Projects/_brain/Dashboard.md`:
- Add a row to the Active Projects table
- Add an entry to Recent Activity: `{TODAY'S DATE}: {Name} project created — {one-line description}`

### Step 8: Update Cross-Project-Architecture (if applicable)

If the user declared data dependencies, edit `~/Projects/_brain/Cross-Project-Architecture.md` to add the new project.

### Step 9: Wire up cross-project memories

Detect the user's home directory and the `~/.claude/projects/` memory path format, then symlink any shared memory files (user profile, working-style feedback, reference tables) from the workspace-level memory directory into the new project's memory directory.

A typical pattern:

```bash
# Resolve the encoded project path Claude Code uses for memory
MEMORY_DIR=~/.claude/projects/$(pwd | sed 's|/|-|g')/memory
mkdir -p "$MEMORY_DIR"

# Source memory dir is the workspace-level one (one level up)
ROOT_MEMORY=~/.claude/projects/$(dirname "$(pwd)" | sed 's|/|-|g')/memory

# Symlink any files that exist there
for f in "$ROOT_MEMORY"/*.md; do
  [ -f "$f" ] || continue
  ln -sf "$f" "$MEMORY_DIR/$(basename "$f")"
done
```

Create a `MEMORY.md` index in the new memory directory that lists the symlinked entries. If the workspace-level memory directory doesn't exist yet, skip this step silently.

### Step 10: Import context (if continuing from elsewhere)

If the user provided specs, decisions, chat exports, or files from a prior session:
- Save any specs/artifacts to `docs/reference/` or appropriate location
- Incorporate all decisions into MASTER_CONTEXT.md
- Reference source material in SESSION_LOG.md Session 0

### Step 11: Initial commit and push

```bash
cd ~/Projects/{name}
git add .
git commit -m "Initialize {name} with context system and cross-project wiring"
```

Check if `gh` CLI is available. If yes, offer to create a remote repo with `gh repo create`. If not, tell the user to create the repo at https://github.com/new and then run `git push -u origin main`.

### Step 12: Summary

Tell the user:
1. What was created (brief list)
2. The command to start working: `cd ~/Projects/{name} && claude`
3. "Cross-project memories are symlinked — your profile, feedback, and references will be there on first launch."
4. If there's imported context: "I've incorporated your prior context into MASTER_CONTEXT.md so your first session picks up right where you left off."

---

## Rules

- MUST run from ~/Projects root — check this first
- Phase 1 is CONVERSATIONAL — don't rush it. Let the user talk. Ask follow-ups if answers are vague.
- ALWAYS use today's actual date (not a placeholder)
- ALWAYS add .obsidian/ to .gitignore
- ALWAYS symlink the shared memory files (if the workspace-level memory directory exists)
- ALWAYS create the _brain/ hub page
- ALWAYS update Dashboard.md
- ALWAYS create the initial git commit
- Use the user's exact project name — don't rename it
- Generate realistic initial tasks based on the actual project, not generic placeholders
- If tech stack is TBD, that's fine — mark it and move on. Don't force a decision.
- If the user provides rich context, write a THOROUGH MASTER_CONTEXT.md — not a skeleton
- The goal is that when the user runs `cd ~/Projects/{name} && claude`, the new Claude session can immediately understand the project, the person, and the plan
