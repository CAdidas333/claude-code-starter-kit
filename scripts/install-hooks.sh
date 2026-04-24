#!/usr/bin/env bash
# Install git hooks for this repo.
#
# Currently installs a pre-commit hook that delegates to
# scripts/check-banned-strings.sh, so every commit is scanned against the
# local .banned-strings file (if present).
#
# Idempotent: re-running overwrites the hook cleanly and reports when it
# replaced different content. No interactive prompts. Portable to stock
# macOS bash 3.2 and Linux — uses only POSIX-safe shell idioms.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_DIR="${REPO_ROOT}/.git/hooks"
HOOK_PATH="${HOOK_DIR}/pre-commit"

mkdir -p "$HOOK_DIR"

# The canonical one-line exec stub we install. Any existing hook whose
# content differs from this byte-for-byte will be reported as replaced.
read -r -d '' HOOK_CONTENT <<'EOF' || true
#!/usr/bin/env bash
exec "$(git rev-parse --show-toplevel)/scripts/check-banned-strings.sh"
EOF

REPLACED=0
if [ -e "$HOOK_PATH" ]; then
    existing="$(cat "$HOOK_PATH")"
    if [ "$existing" != "$HOOK_CONTENT" ]; then
        REPLACED=1
    fi
fi

printf '%s\n' "$HOOK_CONTENT" > "$HOOK_PATH"
chmod +x "$HOOK_PATH"

if [ "$REPLACED" -eq 1 ]; then
    echo "⚠ Replacing existing pre-commit hook with banned-strings stub"
fi

echo "✓ Installed pre-commit hook: ${HOOK_PATH}"
echo "  → runs scripts/check-banned-strings.sh on every commit"
