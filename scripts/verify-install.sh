#!/usr/bin/env bash
# Claude Code Starter Kit — install verification
# Checks that the kit's install actually worked. Can be run any time
# after setup.sh / setup.ps1 to confirm everything is in place.
#
# Usage: ./scripts/verify-install.sh

set -uo pipefail
# NOTE: not using -e — we want to report ALL failures, not stop at the first

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_file() {
    local description="$1"
    local path="$2"
    if [ -f "$path" ]; then
        echo -e "  ${GREEN}✓${NC} ${description}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗${NC} ${description} — missing: ${path}"
        FAIL=$((FAIL + 1))
    fi
}

check_dir() {
    local description="$1"
    local path="$2"
    if [ -d "$path" ]; then
        echo -e "  ${GREEN}✓${NC} ${description}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗${NC} ${description} — missing: ${path}"
        FAIL=$((FAIL + 1))
    fi
}

check_command() {
    local description="$1"
    local cmd="$2"
    if command -v "$cmd" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} ${description}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${YELLOW}!${NC} ${description} — command not found: ${cmd}"
        WARN=$((WARN + 1))
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claude Code Starter Kit — Verify${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}OS-level prerequisites:${NC}"
check_command "Node.js" node
check_command "git" git
check_command "Claude Code (claude)" claude
check_command "GitHub CLI (gh)" gh
echo ""

echo -e "${YELLOW}Workspace:${NC}"
check_dir "~/Projects/" "$HOME/Projects"
check_dir "~/Projects/_brain/" "$HOME/Projects/_brain"
check_dir "~/Projects/_brain/Feedback/" "$HOME/Projects/_brain/Feedback"
check_dir "~/Projects/_brain/Templates/" "$HOME/Projects/_brain/Templates"
check_dir "~/Projects/_brain/Armory/" "$HOME/Projects/_brain/Armory"
check_file "Brain Dashboard.md" "$HOME/Projects/_brain/Dashboard.md"
check_file "Brain Armory/Focus.md" "$HOME/Projects/_brain/Armory/Focus.md"
echo ""

echo -e "${YELLOW}Claude Code config:${NC}"
check_dir "~/.claude/" "$HOME/.claude"
check_dir "~/.claude/skills/" "$HOME/.claude/skills"
check_dir "~/.claude/agents/" "$HOME/.claude/agents"
check_dir "~/.claude/hooks/" "$HOME/.claude/hooks"
check_file "settings.json" "$HOME/.claude/settings.json"
check_file ".mcp.json" "$HOME/.mcp.json"
echo ""

echo -e "${YELLOW}Installed skills (from kit):${NC}"
for skill in welcome new-project today wrap status-report ingest digest investigate scout audit morning-brief memory-md-management; do
    check_file "/$skill" "$HOME/.claude/skills/$skill/SKILL.md"
done
echo ""

echo -e "${YELLOW}Installed agents:${NC}"
check_file "context-updater" "$HOME/.claude/agents/context-updater.md"
check_file "brain-updater" "$HOME/.claude/agents/brain-updater.md"
echo ""

echo -e "${YELLOW}Installed hooks:${NC}"
check_file "overwatch-session-start" "$HOME/.claude/hooks/overwatch-session-start.sh"
check_file "overwatch-context-guard" "$HOME/.claude/hooks/overwatch-context-guard.sh"
echo ""

echo -e "${YELLOW}Hook executable bits:${NC}"
for hook in overwatch-session-start.sh overwatch-context-guard.sh; do
    if [ -x "$HOME/.claude/hooks/$hook" ]; then
        echo -e "  ${GREEN}✓${NC} $hook is executable"
        PASS=$((PASS + 1))
    elif [ -f "$HOME/.claude/hooks/$hook" ]; then
        echo -e "  ${RED}✗${NC} $hook exists but is NOT executable"
        FAIL=$((FAIL + 1))
    fi
done
echo ""

echo -e "${BLUE}========================================${NC}"
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}  Verify Complete: ${PASS} passed, ${WARN} warnings, ${FAIL} failed${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Looks good. Run \`cd ~/Projects && claude\` to start a session."
    exit 0
else
    echo -e "${RED}  Verify Complete: ${PASS} passed, ${WARN} warnings, ${FAIL} FAILED${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "Some checks failed. Re-run the installer:"
    echo "  ./setup.sh    (Mac)"
    echo "  ./setup.ps1   (Windows)"
    echo ""
    echo "Or run the finisher directly:"
    echo "  node bin/finish-setup.js"
    echo ""
    echo "If problems persist, see docs/INSTALL.md troubleshooting."
    exit 1
fi
