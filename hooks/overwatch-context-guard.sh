#!/bin/bash
# Overwatch Context Guard — PreToolUse hook for Write/Edit.
# Fires before any file modification, injects the host project's "Live Systems"
# section so the session is reminded not to unknowingly break running features.

# Read the tool input from stdin (JSON with file_path, etc.)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//')

# If no file path found, pass through
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only guard files inside a project tree
case "$FILE_PATH" in
  "$HOME/Projects/"*) : ;;
  /*) : ;;
  *) exit 0 ;;
esac

# Walk up from the target file looking for docs/context/MASTER_CONTEXT.md.
# The project name is the directory that contains docs/.
PROJECT=""
CONTEXT_FILE=""
SEARCH_DIR="$(dirname "$FILE_PATH")"
while [ "$SEARCH_DIR" != "/" ] && [ "$SEARCH_DIR" != "$HOME" ] && [ -n "$SEARCH_DIR" ]; do
  if [ -f "$SEARCH_DIR/docs/context/MASTER_CONTEXT.md" ]; then
    PROJECT="$(basename "$SEARCH_DIR")"
    CONTEXT_FILE="$SEARCH_DIR/docs/context/MASTER_CONTEXT.md"
    break
  fi
  SEARCH_DIR="$(dirname "$SEARCH_DIR")"
done

# No project context file found — nothing to guard against
if [ -z "$CONTEXT_FILE" ] || [ ! -f "$CONTEXT_FILE" ]; then
  exit 0
fi

# Extract the Live Systems section: everything between "## Live Systems"
# and the next top-level ## heading that does not start with "L".
LIVE_SYSTEMS=$(awk '/^## Live Systems/,/^## [^L]/' "$CONTEXT_FILE" | head -60)

if [ -z "$LIVE_SYSTEMS" ]; then
  exit 0
fi

# Output the context guard reminder
cat << EOF
## Overwatch Context Guard — $PROJECT

You are modifying a file in **$PROJECT**. Before proceeding, verify your change does not conflict with these live systems:

$LIVE_SYSTEMS

If your change touches, replaces, or disables any of the above: STOP and explain why. These are running in production or on active schedules.
EOF

exit 0
