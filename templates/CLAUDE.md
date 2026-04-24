# Cross-Project Context

## Who
This workspace belongs to me. See `_brain/{MY-NAME}-Profile.md` for my profile (created by `/welcome`).

## Projects in this workspace
_Populated by `/new-project` — each new project gets a row here._

## Cross-Project Knowledge
- Read `_brain/Dashboard.md` for current status of all projects.
- Read `_brain/Feedback/Working-Style.md` for how I like to work.
- Read `_brain/Feedback/Code-Standards.md` for global coding rules.
- Read `_brain/Armory/Focus.md` for my current focus areas.
- Read the current project's `docs/context/MASTER_CONTEXT.md` when working on a specific project.

## Per-Project Context
Each project has its own `docs/context/` directory with MASTER_CONTEXT.md, ACTIVE_PROJECTS.md, and SESSION_LOG.md. Always read those for project-specific work.

## Rules
- Always read `_brain/Dashboard.md` when working across projects or when asked about overall status.
- Always read the current project's `docs/context/MASTER_CONTEXT.md` when working on a specific project.
- At session end, run `/wrap` — it updates context docs, commits, and pushes.
- Never re-litigate decisions documented in `_brain/Decisions/` or a project's MASTER_CONTEXT.md.
- Push to origin immediately after every commit. Solo developer, no review gates.
- When starting work on a project, check the Armory for relevant knowledge — ask Claude about topics and the Armory MCP will surface notes.
- Use `/today` at session start for a daily briefing across all projects.
- A code reviewer hook runs automatically after every Write/Edit — if it flags issues, address them before committing.

## lean-ctx — Context Engineering Layer

MANDATORY: Use lean-ctx MCP tools for reads and searches where they help. Native Read/Grep are fine when Edit requires them, but lean-ctx provides better caching and compression for exploratory work.

| Tool | Use |
|---|---|
| `ctx_read(path)` | Read files (cached, 8 compression modes) |
| `ctx_shell(command)` | Run shell commands (pattern compression) |
| `ctx_search(pattern, path)` | Code search (compact results) |
| `ctx_tree(path, depth)` | Directory maps |

Write, Edit, Glob — use normally (no lean-ctx replacement).

## How to work with me

I prefer:
- Short, bullet-pointed responses by default; deeper when I ask
- You explain what you're about to do before destructive/hard-to-undo actions and wait for my "go"
- When you find a bug, fix it AND tell me what you found
- Comments only when code isn't self-explanatory
- Direct feedback, no hedging, no preamble

_This section was written by `/welcome` based on my interview answers. If you want to change it, run `/welcome` again and choose "Update working style" from the menu._

## Braindump / Ideas workflow

Quick thoughts → append to `_brain/Ideas/_Inbox.md` as bullets.
Deeper thinking → start a braindump at `_brain/Ideas/Braindumps/YYYY-MM-DD_topic.md` (use the template in `_brain/Templates/Braindump.md`).
Ideas that mature → promote to `_brain/Ideas/Explored/` (use `Explored-Idea.md` template).
Ready to build → `/new-project` or add to an existing project's backlog.
