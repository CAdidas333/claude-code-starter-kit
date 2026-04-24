---
updated: 2026-04-10
tags: [feedback, code-standards]
---

# Code Standards

> Cross-project coding rules. Claude applies these across any project unless a project's own `CLAUDE.md` overrides.
>
> This file is a starter template — edit to match your preferences.

## General

- Read existing code before writing new code
- Match the style of the surrounding code
- Don't introduce dependencies without discussing first
- Don't add features beyond what was asked
- Don't add error handling for impossible scenarios
- Don't add comments that narrate what code does — comment the why, not the what

## Naming

- Prefer clarity over brevity (within reason)
- Descriptive variable names
- Function names are verbs; class/type names are nouns

## Testing

- Write tests for new behavior at system boundaries
- Don't write tests for trivial getters/setters
- Test the contract, not the implementation

## Git

- Small, focused commits
- Commit messages explain why, not just what
- Push after every commit (solo dev, no review gates)

## Language/Framework Specifics

_Add your preferences for the languages and frameworks you use. Example starting points:_

### TypeScript
- Strict mode on
- No `any` unless there's a very good reason
- Prefer `unknown` + narrowing over `any`

### Python
- Type hints on function signatures
- f-strings over `.format()` or `%`

### Shell
- Target POSIX sh or bash 3.2 unless you know the target is newer
- `set -euo pipefail` for bash scripts
- Quote variables unless you explicitly need word splitting
