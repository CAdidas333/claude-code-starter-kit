---
updated: 2026-04-10
tags: [brain, readme]
---

# The Brain

> Your cross-project knowledge hub. Everything Claude needs to know about you, your work, and your preferences lives here.

## What's in here

| Folder | What it's for |
|---|---|
| `Dashboard.md` | Command center. Status of all projects at a glance. |
| `Feedback/` | How you like to work — Working-Style, Code-Standards. Claude reads these every session so you don't have to repeat yourself. |
| `Decisions/` | Important decisions that shouldn't be re-litigated. |
| `Features/` | Feature specs by project. |
| `Ideas/` | `_Inbox.md` for quick captures, `Braindumps/` for deep thinking, `Explored/` for matured ideas. |
| `Launch/` | Go-to-market, pricing, roadmap docs. |
| `IP/` | Patents, trademarks, legal tracking. |
| `Templates/` | Reusable templates (braindump, explored-idea, new-project bootstrap). |
| `Armory/` | Your knowledge vault — ingested notes, cheatsheets, your current focus areas. |

## How to use it

- **Obsidian** — open this folder as a vault. You get graph view, backlinks, search.
- **Claude** — Claude reads `Dashboard.md`, `Feedback/Working-Style.md`, and your current project's files automatically at session start.
- **Git** — this folder is its own git repo. Commit often. Your thoughts are worth backing up.

## The flow

```
Raw thought → Ideas/_Inbox.md
     ↓
  Wants depth → Ideas/Braindumps/YYYY-MM-DD_topic.md
     ↓
  Matures    → Ideas/Explored/topic.md with pros/cons + links
     ↓
  Ready      → /new-project to spin up a dedicated project, OR
               promote to an existing project's backlog
```

See `Templates/` for starting shapes of each file type.
