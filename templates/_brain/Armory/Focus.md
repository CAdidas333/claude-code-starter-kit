---
auto_learn: true
focus_areas: []
observation_window_days: 30
last_reviewed: 2026-04-10
---

# Armory Focus

> What you're currently interested in. `/welcome` populates this; `/audit` suggests updates over time.

## Auto-learn mode

This file starts in **auto-learn mode** (`auto_learn: true`). That means:

- You don't have to decide what you're interested in upfront
- The Armory notices what you actually engage with (projects you create, content you ingest, topics you ask Claude about)
- When `/audit` sees a confident pattern, it proposes focus areas — you approve before anything is added
- After ~30 days, `/audit` asks if you're ready to lock in a set or keep auto-learning

You can edit this file manually at any time. If you want to set focus areas upfront, just add them under `focus_areas:` in the frontmatter and Claude will start using them immediately.

## Current focus areas

_Empty. `/welcome` will populate this, or you can add entries manually:_

```yaml
focus_areas:
  - name: "React / Next.js"
    status: active        # active | exploratory | shelved
    added: 2026-04-10
    description: "Web apps for small-business clients"
  - name: "iOS / SwiftUI"
    status: exploratory
    added: 2026-04-10
    description: "Thinking about an iPad sketching app"
```

## How focus affects Claude's behavior

- **`/today`** reads this file and tailors the daily brief to your focus areas
- **`/ingest`** asks which focus area a new note is relevant to (or "general" or "none — save anyway")
- **`/audit`** reports adoption per focus area: "You ingested 5 React notes this week but only referenced 1 in actual work"
- **`/scout`** prioritizes hunting for tools/techniques in your focus areas

## Graduating out of auto-learn mode

When you're ready, set `auto_learn: false` in the frontmatter. The Armory will stop proposing new focus areas automatically and lock in what's currently in the list. You can always flip it back on later.
