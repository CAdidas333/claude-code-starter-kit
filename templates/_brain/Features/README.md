---
tags: [features, readme]
---

# Features

> Feature specs, organized by project.

## What goes here

When you have a feature that's bigger than a single task but not its own project, write a spec here. Features cross session boundaries — they need documentation that survives.

## Format

One file per feature. Name: `Feature-Name.md` (PascalCase or hyphenated, your choice — be consistent).

Template:

```markdown
---
tags: [feature]
project: <project-name>
status: proposed | in-progress | shipped | abandoned
---

# Feature Name

## Problem
What pain does this solve? Who feels it?

## Proposed Solution
High-level approach. One or two paragraphs.

## User Stories
- As a <role>, I want <action> so that <outcome>

## Open Questions
- [ ] Question 1
- [ ] Question 2

## Decisions
(Link to `Decisions/` entries for decisions made while designing this feature)

## Implementation Notes
Technical notes, constraints, edge cases.

## Related
- [[Other Feature]]
- Project: [[ProjectName]]
```

## Link from projects

In your project's `docs/context/ACTIVE_PROJECTS.md`, link to feature specs here with `[[Features/Feature-Name]]` (Obsidian wiki-style) so the graph view shows the connection.
