---
tags: [new-project, template, bootstrap]
---

# New Project Bootstrap Checklist

> Used by the `/new-project` skill to scaffold a new project. Also useful as a manual reference if you're setting one up by hand.

## Before running /new-project

- [ ] **Name** — what's the project called? Lowercase-kebab for the directory, PascalCase for the display name
- [ ] **One-line description** — you need to be able to say what it does in one sentence
- [ ] **Location** — under `~/Projects/<ProjectName>/`
- [ ] **Language/framework** — what stack? (Or "TBD" is fine)
- [ ] **Existing code?** — are you importing existing code, or starting fresh?

## What /new-project creates

### Directory structure
```
~/Projects/<ProjectName>/
├── CLAUDE.md                       ← tells Claude what this project is
├── README.md                       ← user-facing project doc
├── .gitignore
├── docs/
│   └── context/
│       ├── MASTER_CONTEXT.md       ← architecture, stack, key decisions
│       ├── ACTIVE_PROJECTS.md      ← tasks, priorities, blockers
│       └── SESSION_LOG.md          ← what happened each session
└── (language/framework-specific stuff)
```

### Git
- `git init`
- First commit with the bootstrap files
- (Optional) `gh repo create <name> --private` + push

### Brain wiring
- Add a row to `~/Projects/_brain/Dashboard.md` under Active Projects
- Create `~/Projects/_brain/<ProjectName>.md` summary card
- If it relates to other projects, link from `~/Projects/_brain/Cross-Project-Architecture.md`

### Obsidian
- If you're using Obsidian, the new project directory is automatically visible in your vault (since the vault points at `~/Projects/`)

## After bootstrap

First session in the new project should be:
1. Open a new cmux window (Mac) or Claude Code Desktop session (Windows) pointed at the project directory
2. Run `claude` to start a session
3. **Don't start coding.** Braindump first — describe what you want, what problems it solves, what done looks like
4. Let Claude populate `docs/context/MASTER_CONTEXT.md` from your braindump
5. Use `/wrap` at session end to sync the context docs and commit

## Anti-patterns

- **Don't start with a framework choice.** Start with the problem. Framework follows.
- **Don't skip the context docs.** They're what lets Claude pick up where you left off in a future session.
- **Don't mix projects in the same cmux window.** Each project gets its own window. Contexts don't cross-contaminate.
