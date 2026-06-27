---
title: "Recoverable Delete Safety Net — Alias rm to trash for Autonomous Agents"
source: starter-kit-seed
date_ingested: 2026-06-26
category: tools
tags: [safety-net, autonomous-agents, trash, rm-alias, vibe-coding, full-permissions]
relevance_score: 5
related_projects: []
status: processed
investigation_status: not-needed
aliases: [trash alias, recoverable delete, rm safety net, brew trash, autonomous agent safety]
---

# Recoverable Delete Safety Net — Alias rm to trash for Autonomous Agents

## TL;DR
`brew install trash` + `alias rm='trash'` in `~/.zshrc` so any agent or script that calls `rm` moves files to `~/.Trash` instead of obliterating them. One-time setup, zero workflow change, fully recoverable when an auto-approved agent deletes the wrong file.

## Key Takeaways
- **`brew install trash`** installs a CLI that moves files to the macOS Trash (`~/.Trash`) instead of unlinking them from disk.
- **`alias rm='trash'`** in `~/.zshrc` silently redirects every `rm` call — from your shell, from Claude Code, from any script running inside the terminal session.
- **Real failure mode this prevents:** an agent creates a self-referential symlink, then calls `rm` on "the broken link" — which is actually your working directory. Without `trash`, the content is gone. With `trash`, it is in `~/.Trash/` and recovery takes 10 seconds.
- **When this matters most:** running agents in auto-approve / full disk permissions mode. In interactive permission-prompt mode you would catch the bad `rm` before it ran.
- **Scope:** the alias lives in interactive shells, which covers everything inside a Claude Code terminal session. Non-interactive shell scripts (`bash -c "rm ..."`) will not pick up the alias — known limitation, acceptable tradeoff for agent workflows.

## Actionable for your projects
- Install and wire it up in one step: `brew install trash && echo "alias rm='trash'" >> ~/.zshrc && source ~/.zshrc`
- Verify: `touch /tmp/test-safety && rm /tmp/test-safety && ls ~/.Trash/ | grep test-safety`
- For non-interactive scripts that must also be safe, use `mv file ~/.Trash/` explicitly instead of `rm`.
- Check `~/.Trash/` periodically and empty it — it does not auto-clean the way `/tmp` does.
