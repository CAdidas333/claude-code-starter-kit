# Claude Code Starter Kit - Windows installer
# Tiny OS-level installer. Hands off to bin/finish-setup.js for the heavy lifting.
#
# If PowerShell blocks this script with an execution-policy error, run:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
# and then re-run this script.

$ErrorActionPreference = "Stop"

# $PSScriptRoot is the directory of this script file (PS 3.0+).
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

# --- Error-report fallback: write a Desktop diagnostic on unrecoverable failure ---
# Note: friendly `exit 1` paths (wrong OS, declined prompt, cancelled gh auth,
# "open a new shell and re-run") deliberately bypass this — in PowerShell `exit`
# does not trigger the surrounding try/catch, so no scary file is written when the
# user simply made a choice. Reports fire only for genuine failures: a thrown
# cmdlet error (ErrorActionPreference=Stop), a winget install failure via
# Invoke-Native, or a non-zero finisher exit.
$Script:CurrentStep = "initializing"
$Script:CurrentCmd  = ""

function Write-ErrorReportAndExit {
    param([int]$ExitCode = 1, [string]$Stderr = "")
    Write-Host ""
    Write-Host "Setup failed at: $Script:CurrentStep" -ForegroundColor Red
    Write-Host ""
    $payload = @{
        step    = $Script:CurrentStep
        command = $Script:CurrentCmd
        stderr  = $Stderr
    } | ConvertTo-Json -Compress
    try {
        $reportPath = & node (Join-Path $ScriptDir "bin\lib\error-report.js") --json $payload 2>$null
    } catch {
        $reportPath = "(error-report writer also failed)"
    }
    Write-Host "Wrote a diagnostic report to:" -ForegroundColor Yellow
    Write-Host "  $reportPath"
    Write-Host ""
    Write-Host "Text or email this file to the kit maintainer along with what you were trying to do."
    Write-Host "No secrets are in it -- API keys are flagged present/absent only."
    exit $ExitCode
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Claude Code Starter Kit - Setup (Win)" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# --- Sanity check: are we actually on Windows? ---
# PowerShell Core runs on Mac/Linux too. This installer only makes sense on Windows.
if ($PSVersionTable.PSVersion.Major -ge 6) {
    if (-not $IsWindows) {
        Write-Host "This script is for Windows. Mac users: run ./setup.sh instead." -ForegroundColor Red
        exit 1
    }
} elseif ($env:OS -ne "Windows_NT") {
    Write-Host "This script is for Windows. Mac users: run ./setup.sh instead." -ForegroundColor Red
    exit 1
}

function Test-Command($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Update-PathFromEnvironment {
    # Rebuild $env:Path from persistent Machine + User scopes so tools
    # installed during this session become visible.
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath    = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $parts = @()
    if ($machinePath) { $parts += $machinePath }
    if ($userPath)    { $parts += $userPath }
    $env:Path = ($parts -join ";")

    # npm global bin on Windows is typically %AppData%\npm. It is added to
    # the User PATH at install time, but only for NEW shells - this script's
    # shell inherited the old value. The refresh above should pick it up,
    # but we also append it explicitly as a safety net in case the user's
    # npm prefix is non-standard or the env var hasn't been committed yet.
    $npmGlobal = Join-Path $env:APPDATA "npm"
    if ((Test-Path $npmGlobal) -and ($env:Path -notlike "*$npmGlobal*")) {
        $env:Path = "$env:Path;$npmGlobal"
    }
}

function Invoke-Native {
    param(
        [Parameter(Mandatory=$true)][string]$Description,
        [Parameter(Mandatory=$true)][scriptblock]$Block
    )
    $Script:CurrentCmd = $Description
    & $Block
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "$Description failed (exit code $LASTEXITCODE)." -ForegroundColor Red
        Write-ErrorReportAndExit -ExitCode $LASTEXITCODE -Stderr "$Description failed (exit code $LASTEXITCODE)"
    }
}

try {

# --- Step 1: Check prerequisites ---
$Script:CurrentStep = "prerequisite check"
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$Missing = @()
if (-not (Test-Command "winget")) { $Missing += "winget" }
if (-not (Test-Command "git"))    { $Missing += "git" }
if (-not (Test-Command "node"))   { $Missing += "Node.js" }
if (-not (Test-Command "gh"))     { $Missing += "GitHub CLI" }
if (-not (Test-Command "claude")) { $Missing += "Claude Code" }

if ($Missing.Count -gt 0) {
    Write-Host ""
    Write-Host ("Missing: " + ($Missing -join ", ")) -ForegroundColor Yellow
    Write-Host ""
    Write-Host "I can install these for you. Here's what will happen:"
    Write-Host ""
    foreach ($tool in $Missing) {
        switch ($tool) {
            "winget" {
                Write-Host "  - winget -> must be installed manually from the Microsoft Store"
                Write-Host "    (search for 'App Installer', or open: ms-appinstaller:?source=https://aka.ms/getwinget)"
            }
            "git"        { Write-Host "  - git -> installed via winget (Git.Git)" }
            "Node.js"    { Write-Host "  - Node.js LTS -> installed via winget (OpenJS.NodeJS.LTS)" }
            "GitHub CLI" { Write-Host "  - gh -> installed via winget (GitHub.cli)" }
            "Claude Code" { Write-Host "  - Claude Code -> installed via npm (@anthropic-ai/claude-code)" }
        }
    }
    Write-Host ""
    Write-Host "You may be prompted to accept licenses or approve installs."
    Write-Host ""

    $Continue = Read-Host "Continue? [Y/n]"
    $reply = if ($null -eq $Continue) { "" } else { $Continue.Trim().ToLower() }
    if ($reply -ne "" -and $reply -ne "y" -and $reply -ne "yes") {
        Write-Host "Cancelled. Install prerequisites manually and re-run." -ForegroundColor Red
        exit 1
    }

    if (-not (Test-Command "winget")) {
        Write-Host ""
        Write-Host "winget (Windows Package Manager) is not available on this machine." -ForegroundColor Red
        Write-Host "Install 'App Installer' from the Microsoft Store, then re-run this script:"
        Write-Host "  ms-appinstaller:?source=https://aka.ms/getwinget"
        Write-Host "  (or search 'App Installer' in the Microsoft Store app)"
        exit 1
    }

    if (-not (Test-Command "git")) {
        Invoke-Native "winget install git" {
            winget install --id Git.Git -e --silent --accept-source-agreements --accept-package-agreements
        }
    }
    if (-not (Test-Command "node")) {
        Invoke-Native "winget install Node.js" {
            winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
        }
    }
    if (-not (Test-Command "gh")) {
        Invoke-Native "winget install GitHub CLI" {
            winget install --id GitHub.cli -e --silent --accept-source-agreements --accept-package-agreements
        }
    }

    # Refresh PATH so git / node / gh / npm become visible in this session.
    Update-PathFromEnvironment

    if (-not (Test-Command "claude")) {
        if (-not (Test-Command "npm")) {
            Write-Host ""
            Write-Host "npm is still not on PATH after installing Node.js." -ForegroundColor Red
            Write-Host "Close this PowerShell window, open a new one, and re-run setup.ps1."
            exit 1
        }
        Invoke-Native "npm install -g @anthropic-ai/claude-code" {
            npm install -g "@anthropic-ai/claude-code"
        }
        # Refresh again so the newly installed 'claude' shim on %AppData%\npm resolves.
        Update-PathFromEnvironment
    }

    if (-not (Test-Command "claude")) {
        Write-Host ""
        Write-Host "Claude Code was installed via npm, but 'claude' is not on PATH." -ForegroundColor Red
        Write-Host "Close this PowerShell window, open a new one, and re-run setup.ps1."
        Write-Host "(npm global binaries live in %AppData%\npm, which is added to PATH for new shells.)"
        exit 1
    }
}

Write-Host "All prerequisites present." -ForegroundColor Green
Write-Host ""

# --- Step 2: GitHub auth ---
$Script:CurrentStep = "github auth"
$Script:CurrentCmd  = "gh auth login"
Write-Host "Setting up GitHub access..." -ForegroundColor Yellow
gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "You'll be asked to authenticate with GitHub."
    Write-Host "If you don't have a GitHub account yet, create one at https://github.com/signup"
    Read-Host "Press Enter to continue"
    gh auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "GitHub authentication was cancelled or failed." -ForegroundColor Red
        Write-Host "Re-run .\setup.ps1 when you're ready to authenticate."
        exit 1
    }
}
Write-Host "GitHub authenticated." -ForegroundColor Green
Write-Host ""

# --- Step 3: Hand off to the cross-platform finisher ---
$Script:CurrentStep = "cross-platform finisher"
$Script:CurrentCmd  = "node bin\finish-setup.js"
Write-Host "Running cross-platform finisher..." -ForegroundColor Yellow
Write-Host ""
node (Join-Path $ScriptDir "bin\finish-setup.js")
if ($LASTEXITCODE -ne 0) {
    Write-ErrorReportAndExit -ExitCode $LASTEXITCODE -Stderr "finisher exited with code $LASTEXITCODE"
}

# finish-setup.js prints its own completion message

} catch {
    Write-ErrorReportAndExit -ExitCode 1 -Stderr $_.Exception.Message
}
