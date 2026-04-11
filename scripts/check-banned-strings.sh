#!/usr/bin/env bash
# Banned-strings pre-commit check
# Reads .banned-strings (if present), uses word-boundary matching,
# supports path-scoped exceptions.
#
# Portable to bash 3.2 (macOS default) — no associative arrays.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
BANNED_FILE="${REPO_ROOT}/.banned-strings"

# If no banned-strings file, skip silently (not configured)
if [ ! -f "$BANNED_FILE" ]; then
    echo "ℹ️  No .banned-strings file found. Skipping banned-strings check."
    echo "   To enable, copy .banned-strings.example to .banned-strings and fill it in."
    exit 0
fi

# Parse banned-strings file into two lists:
#   - STRICT_BANS: plain strings banned everywhere
#   - ALLOW_KEYS + ALLOW_PATHS: parallel arrays for allow-list exceptions
STRICT_BANS=()
ALLOW_KEYS=()
ALLOW_PATHS=()

while IFS= read -r line || [ -n "$line" ]; do
    # Skip blank lines and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

    # Check for allow-list syntax: "string | path1,path2"
    if [[ "$line" == *"|"* ]]; then
        key="$(echo "${line%%|*}" | xargs)"
        paths="$(echo "${line#*|}" | xargs)"
        ALLOW_KEYS+=("$key")
        ALLOW_PATHS+=("$paths")
    else
        STRICT_BANS+=("$(echo "$line" | xargs)")
    fi
done < "$BANNED_FILE"

# Files to check (staged if in a git commit context, otherwise all tracked files)
STAGED_FILES="$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)"
if [ -n "$STAGED_FILES" ]; then
    FILES="$STAGED_FILES"
else
    FILES="$(git ls-files 2>/dev/null || find . -type f -not -path './.git/*' -not -path './node_modules/*')"
fi

VIOLATIONS=0

# Strict ban check
for ban in "${STRICT_BANS[@]:-}"; do
    [ -z "$ban" ] && continue
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        [ -f "$file" ] || continue
        if grep -qniE "\b${ban}\b" "$file" 2>/dev/null; then
            echo "❌ Banned string found: \"$ban\""
            while IFS= read -r hit; do
                echo "   $file:$hit"
            done < <(grep -niE "\b${ban}\b" "$file" 2>/dev/null | head -5)
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
    done <<< "$FILES"
done

# Allow-list check (same string, but only flag if found OUTSIDE allowed paths)
allow_count=${#ALLOW_KEYS[@]}
i=0
while [ "$i" -lt "$allow_count" ]; do
    key="${ALLOW_KEYS[$i]}"
    allowed_paths="${ALLOW_PATHS[$i]}"
    allow_pattern="$(echo "$allowed_paths" | sed 's/,/\\|/g')"

    while IFS= read -r file; do
        [ -z "$file" ] && continue
        [ -f "$file" ] || continue
        # Skip if this file is in the allowed list
        if echo "$file" | grep -qE "^(${allow_pattern})$"; then
            continue
        fi
        if grep -qniE "\b${key}\b" "$file" 2>/dev/null; then
            echo "❌ Allow-list string \"$key\" found outside permitted paths: $file"
            while IFS= read -r hit; do
                echo "   $file:$hit"
            done < <(grep -niE "\b${key}\b" "$file" 2>/dev/null | head -3)
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
    done <<< "$FILES"
    i=$((i + 1))
done

if [ "$VIOLATIONS" -gt 0 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED: $VIOLATIONS banned string violation(s) found."
    echo "   Fix these before committing, or edit .banned-strings if the entry is wrong."
    exit 1
fi

echo "✓ Banned-strings check passed."
exit 0
