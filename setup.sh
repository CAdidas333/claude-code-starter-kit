#!/usr/bin/env bash
# Claude Code Starter Kit — Mac installer
# Tiny OS-level installer. Hands off to bin/finish-setup.js for the heavy lifting.

set -euo pipefail

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claude Code Starter Kit — Setup (Mac)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're on macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo -e "${RED}This script is for macOS. Windows users: run setup.ps1 instead.${NC}"
  exit 1
fi

# --- Step 1: Check / install prerequisites ---
echo -e "${YELLOW}Checking prerequisites...${NC}"

MISSING=()
command -v brew   >/dev/null 2>&1 || MISSING+=("Homebrew")
command -v git    >/dev/null 2>&1 || MISSING+=("git")
command -v node   >/dev/null 2>&1 || MISSING+=("Node.js")
command -v gh     >/dev/null 2>&1 || MISSING+=("GitHub CLI")
command -v claude >/dev/null 2>&1 || MISSING+=("Claude Code")

if [ "${#MISSING[@]}" -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}Missing: ${MISSING[*]}${NC}"
  echo ""
  echo "I can install these for you. Here's what will happen:"
  echo ""
  for tool in "${MISSING[@]}"; do
    case "$tool" in
      "Homebrew")
        echo "  - Homebrew -> official installer from https://brew.sh"
        echo "    macOS will ask for your password. This is normal -"
        echo "    Homebrew needs admin access to install system-wide."
        ;;
      "git")
        echo "  - git -> installed via Homebrew"
        ;;
      "Node.js")
        echo "  - Node.js 20 -> installed via Homebrew"
        ;;
      "GitHub CLI")
        echo "  - gh -> installed via Homebrew"
        ;;
      "Claude Code")
        echo "  - Claude Code -> installed via npm"
        ;;
    esac
  done
  echo ""
  read -p "Continue? [Y/n] " -n 1 -r
  echo ""
  if [[ ! "$REPLY" =~ ^[Yy]?$ ]]; then
    echo "Cancelled. Install prerequisites manually and re-run."
    exit 1
  fi

  # Install Homebrew if missing.
  #
  # Security note: we download the official Homebrew installer to a temp file
  # and execute it locally, rather than piping curl directly into a shell.
  # This gives the user a chance to inspect the script if they want, and
  # avoids the `curl | bash` anti-pattern that trips static analysis tools.
  # The installer URL is the canonical one published at https://brew.sh.
  if [[ " ${MISSING[*]} " == *" Homebrew "* ]]; then
    BREW_INSTALLER_URL="https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh"
    BREW_INSTALLER_TMP="$(mktemp -t brew-install.XXXXXX)"
    trap 'rm -f "$BREW_INSTALLER_TMP"' EXIT
    if ! curl -fsSL "$BREW_INSTALLER_URL" -o "$BREW_INSTALLER_TMP"; then
      echo -e "${RED}Failed to download Homebrew installer from ${BREW_INSTALLER_URL}${NC}"
      echo "Check your internet connection or install Homebrew manually from https://brew.sh"
      exit 1
    fi
    echo "Downloaded Homebrew installer to ${BREW_INSTALLER_TMP}"
    echo "(You can inspect it in another terminal before continuing, then press any key.)"
    read -n 1 -s
    echo ""
    /bin/bash "$BREW_INSTALLER_TMP"
    rm -f "$BREW_INSTALLER_TMP"
    trap - EXIT
  fi

  # Refresh PATH for this script (Apple Silicon or Intel layout)
  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  else
    echo -e "${RED}Homebrew was not found after install attempt.${NC}"
    echo "Expected one of:"
    echo "  /opt/homebrew/bin/brew (Apple Silicon)"
    echo "  /usr/local/bin/brew    (Intel)"
    echo "Please install Homebrew manually from https://brew.sh and re-run setup.sh."
    exit 1
  fi

  # Install git, node, gh via brew (no-op if already present)
  for tool in git node gh; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      brew install "$tool"
    fi
  done

  # Install Claude Code via npm
  if ! command -v claude >/dev/null 2>&1; then
    npm install -g @anthropic-ai/claude-code
  fi
fi

echo -e "${GREEN}All prerequisites present.${NC}"
echo ""

# --- Step 2: GitHub auth (interactive) ---
echo -e "${YELLOW}Setting up GitHub access...${NC}"
if ! gh auth status >/dev/null 2>&1; then
  echo "You'll be asked to authenticate with GitHub."
  echo "If you don't have a GitHub account yet, create one at https://github.com/signup"
  echo "and then press any key to continue..."
  read -n 1 -s
  echo ""
  # Temporarily disable errexit so a cancelled login produces a friendly message
  # instead of an abrupt exit with no explanation.
  set +e
  gh auth login
  gh_rc=$?
  set -e
  if [ "$gh_rc" -ne 0 ]; then
    echo -e "${RED}GitHub authentication was cancelled or failed.${NC}"
    echo "Re-run ./setup.sh when you're ready to authenticate."
    exit 1
  fi
fi
echo -e "${GREEN}GitHub authenticated.${NC}"
echo ""

# --- Step 3: Hand off to the cross-platform finisher ---
echo -e "${YELLOW}Running cross-platform finisher...${NC}"
echo ""
node "${SCRIPT_DIR}/bin/finish-setup.js"

# finish-setup.js prints its own completion message
