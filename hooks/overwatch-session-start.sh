#!/bin/bash
# Overwatch Session Start — runs at the beginning of every Claude Code session.
#
# Two jobs:
#   1. If ~/.claude/.welcome-pending exists, nudge the user to run /welcome.
#      This is how first-run onboarding gets triggered after install.
#   2. Otherwise, inject the active project's "Live Systems" context so the
#      session knows what's running and what NOT to touch.

# ── Part 0: First-run welcome nudge ──────────────────────────
# The finisher leaves ~/.claude/.welcome-pending after install. /welcome
# deletes it on completion. While it exists, every session start reminds
# the user to run /welcome before doing real work.
if [ -f "$HOME/.claude/.welcome-pending" ]; then
  echo "## Claude Code Starter Kit — First-run setup pending"
  echo ""
  echo "Run \`/welcome\` to get started."
  echo ""
  echo "(This message will stop appearing once /welcome completes.)"
  exit 0
fi

# ── Part 1: Detect the current project ──────────────────────
# Walk up from cwd looking for docs/context/MASTER_CONTEXT.md. The project
# name is the directory that contains docs/.
PROJECT=""
CONTEXT_FILE=""
SEARCH_DIR="$(pwd)"
while [ "$SEARCH_DIR" != "/" ] && [ "$SEARCH_DIR" != "$HOME" ]; do
  if [ -f "$SEARCH_DIR/docs/context/MASTER_CONTEXT.md" ]; then
    PROJECT="$(basename "$SEARCH_DIR")"
    CONTEXT_FILE="$SEARCH_DIR/docs/context/MASTER_CONTEXT.md"
    break
  fi
  SEARCH_DIR="$(dirname "$SEARCH_DIR")"
done

if [ -z "$PROJECT" ]; then
  echo "## Overwatch Online"
  echo ""
  echo "No project context file detected (no docs/context/MASTER_CONTEXT.md in this tree)."
  exit 0
fi

echo "## Overwatch Online — $PROJECT"
echo ""

# ── Part 2: Force-feed Live Systems section ─────────────────
# Extract everything between "## Live Systems" and the next top-level ##
# heading that does NOT start with "L". Cap at 80 lines so we don't blow
# out the session context.
if [ -f "$CONTEXT_FILE" ]; then
  LIVE_SYSTEMS=$(awk '/^## Live Systems/,/^## [^L]/' "$CONTEXT_FILE" | head -80)
  if [ -n "$LIVE_SYSTEMS" ]; then
    echo "### CRITICAL — Live Systems for $PROJECT"
    echo "These are RUNNING RIGHT NOW. Do not modify, replace, or disable without explicit discussion."
    echo ""
    echo "$LIVE_SYSTEMS"
    echo ""
  fi
fi

exit 0
