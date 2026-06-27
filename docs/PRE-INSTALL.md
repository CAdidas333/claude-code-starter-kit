# Before You Install

The starter-kit installer assumes you already have a few things set up. This doc walks you through every one of them, with self-checks so you know each step worked before moving on. Plan on 20-30 minutes start to finish — most of it is account creation, not technical work.

**Pick your platform and follow that track.** Don't skip steps. If a self-check fails, hit the troubleshooting section at the bottom of this doc before going further.

---

## Windows track

### 1. Create your GitHub account

GitHub is where the starter kit lives and where you'll push the code you build later. The account is free.

1. Go to [github.com/signup](https://github.com/signup).
2. Pick a username you wouldn't mind being your permanent identity for code work.
3. Use an email address you actually check — GitHub uses it for security notifications.
4. Click the link in the verification email when it lands.

**Self-check:** Log in at [github.com](https://github.com) — you should see your avatar in the top-right corner. If you can click it and see "Your repositories," you're good.

### 2. Create your Anthropic account + activate Claude Code

Claude Code is Anthropic's CLI tool. It uses your Anthropic account, but Claude Code is a *separate paid subscription* from the regular Claude.ai chat product. If you've been paying for Claude.ai Pro, that does NOT include Claude Code — you'll need a Claude Code pass too.

1. Go to [claude.com](https://claude.com).
2. Sign up with email, Google, or Apple SSO.
3. Find the **Claude Code** section in your account settings.
4. Activate a Claude Code pass — Pro, Max 5x, Max 20x, or Ultra. Start with whatever fits your budget; you can upgrade later.

**Self-check:** From your Claude.com dashboard, you can see your subscription tier and "Claude Code" appears as an active product.

### 3. Install winget (App Installer)

`winget` is Microsoft's command-line package installer. It's how the kit will install git, Node.js, and the GitHub CLI for you.

1. Open the **Microsoft Store** app.
2. Search for **App Installer**. (That's the official name for winget.)
3. Click **Install** or **Update**. If it says "Open" — you already have it.

**Self-check:** Press `Win+R`, type `powershell`, press Enter. In the window that opens, type:

```powershell
winget --version
```

You should see a version number like `v1.6.x`. If you see "winget is not recognized," restart your computer and try again — the install hasn't picked up yet.

### 4. Install Obsidian

Obsidian is a free markdown app that gives you a graph view, search, and backlinks over your "brain" folder (where the starter kit stores your notes). You don't have to use it, but it's a much better experience than reading markdown in Notepad.

1. Go to [obsidian.md](https://obsidian.md).
2. Click **Download for Windows**.
3. Run the installer with default settings.

Don't open Obsidian or set up a vault yet — the installer will create the brain folder, and you'll point Obsidian at it later.

**Self-check:** Obsidian appears in your Start menu.

### 5. Verify your terminal

Windows Terminal is built into Windows 10/11. It's a much better terminal than the old "Command Prompt" — colors, tabs, copy-paste that works.

1. Press `Win+R`.
2. Type `wt` and press Enter.

A terminal window should open. If `wt` opens nothing or errors out, you're probably on an older Windows version — install Windows Terminal from the Microsoft Store first.

**Self-check:** A terminal window opens and shows a `PS C:\Users\YourName>` prompt.

### 6. (Optional) Voice dictation

If you want to talk to Claude instead of typing, Windows has built-in dictation:

1. Press `Win+H` anywhere you can type.
2. Start talking.

If you want something fancier later, there are paid options — but Win+H is plenty for getting started.

### 7. Final health check

Open Windows Terminal (Win+R, `wt`, Enter) and run this exact sequence:

```powershell
winget --version
```

You should see a version number. If you don't, restart and re-do step 3.

### 8. You're ready

Now clone the kit and run the installer:

```powershell
cd $HOME
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
.\setup.ps1
```

The installer prints what it's about to do and asks for confirmation. Read each prompt and press Enter when ready.

---

## Mac track

### 1. Create your GitHub account
(Same as Windows step 1.)

### 2. Create your Anthropic account + activate Claude Code
(Same as Windows step 2.)

### 3. Install Homebrew

Homebrew is Mac's package manager. The kit uses it to install git, Node.js, and lean-ctx.

1. Open **Terminal** (Cmd+Space, type "Terminal", Enter).
2. Paste this exact command:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

3. Follow the prompts. You'll need your Mac password.

**Self-check:** In Terminal, type `brew --version`. You should see a version number.

### 4. Install Obsidian

```bash
brew install --cask obsidian
```

**Self-check:** Obsidian appears in your Applications folder.

### 5. (Optional) Install cmux ($)

[cmux](https://cmux.dev) is a paid Mac-only terminal multiplexer many people love for Claude Code workflows. The kit works fine without it.

### 6. (Optional) Install Wispr Flow ($)

[Wispr Flow](https://wisprflow.ai) is paid voice dictation. Much better than the built-in dictation on Mac. Optional.

### 7. Final health check

```bash
brew --version
which git
```

Both commands should print a path.

### 8. You're ready

```bash
cd ~
git clone https://github.com/CAdidas333/claude-code-starter-kit.git
cd claude-code-starter-kit
./setup.sh
```

---

## Troubleshooting

### "winget is not recognized" after installing App Installer
Restart Windows. The PATH update doesn't apply to already-open shells.

### "git is not recognized" on Windows after the installer ran step 3
The installer is supposed to install git via winget. If it didn't run, open Microsoft Store and search for `App Installer` — make sure it's installed, then re-run `.\setup.ps1`.

### "homebrew command not found" after install
Homebrew installs to `/opt/homebrew/bin/brew` on Apple Silicon. Run:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Then re-test with `brew --version`.

### Anthropic account doesn't show "Claude Code"
Make sure you signed up at [claude.com](https://claude.com), not [claude.ai](https://claude.ai) (the chat product). The Claude Code subscription tile lives in your claude.com account settings.

### Browser opens but the installer "hangs"
The installer is waiting for you to finish in the browser, then come back to the terminal and press Enter. Switch back to the terminal window after you finish authenticating.

### Setup hit an error you can't get past
The installer writes a structured error report to your Desktop named `starter-kit-broke-<timestamp>.txt`. Send it to the kit maintainer along with a short description of what happened. They can debug from the report without being at your machine.
