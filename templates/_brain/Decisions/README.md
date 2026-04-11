---
tags: [decisions, readme]
---

# Decisions

> Important decisions that shouldn't be re-litigated.

## What goes here

When you make a decision that you or Claude might be tempted to revisit later — architecture choices, naming, tool selections, strategic direction — write it down here. Include:

- **What was decided**
- **When** (date)
- **Why** (the reasoning at the time)
- **Alternatives considered** (briefly — what did you rule out?)
- **Conditions for revisiting** (what would have to change for this to be worth re-opening?)

## Why this matters

Without a decisions log, you'll end up having the same debates with yourself (or with Claude) every few sessions. Write the decision down once, and both of you can reference it later instead of re-deriving from first principles.

## Format

One file per decision. Name: `YYYY-MM-DD-short-topic.md`. Example: `2026-04-10-use-postgres.md`.

```markdown
---
date: 2026-04-10
tags: [decision]
---

# Decision: Use Postgres

## What was decided
Use Postgres as the primary database for Project X.

## Why
- Team has deep Postgres expertise
- Rich JSONB support fits the data model
- Extensions (PostGIS) cover a future geospatial requirement

## Alternatives considered
- SQLite — rejected: will need multi-user concurrency later
- MongoDB — rejected: relational constraints matter for this domain

## Conditions for revisiting
Revisit if: we need globally distributed writes, or if Postgres ops burden becomes untenable.
```
