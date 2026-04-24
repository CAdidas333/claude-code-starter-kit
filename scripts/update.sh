#!/usr/bin/env bash
# Claude Code Starter Kit — update script
# Re-runs the cross-platform finisher to apply kit updates.
# The finisher is idempotent: brain files you've edited are preserved,
# skills/agents/hooks are refreshed to the latest kit versions,
# settings.json is merged (not overwritten), MCP servers are rebuilt
# if their source changed.
#
# Usage: ./scripts/update.sh
#
# Workflow:
#   cd ~/wherever/you/cloned/claude-code-starter-kit
#   git pull
#   ./scripts/update.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claude Code Starter Kit — Update${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Node is present (the finisher needs it)
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Error: Node.js not found.${NC}"
    echo "The update script needs Node.js to run the finisher."
    echo "Install Node.js (https://nodejs.org) and re-run."
    exit 1
fi

# Check finisher exists
FINISHER="${REPO_ROOT}/bin/finish-setup.js"
if [ ! -f "$FINISHER" ]; then
    echo -e "${RED}Error: finisher not found at ${FINISHER}${NC}"
    echo "Are you running this from the kit repo?"
    exit 1
fi

echo -e "${YELLOW}Running cross-platform finisher to apply updates...${NC}"
echo ""

node "$FINISHER"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Update complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your existing brain files were preserved."
echo "Skills, agents, hooks, and settings were refreshed."
echo ""
echo "If anything looks off, see docs/UPDATING.md troubleshooting."
