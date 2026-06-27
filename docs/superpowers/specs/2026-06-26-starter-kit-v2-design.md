# Claude-Code-Starter-Kit v2 — Design

**Status:** Draft — pending Chris approval before implementation plan.
**Author:** Claude (Opus 4.7 / 4.8) + the kit maintainer.
**Date:** 2026-06-26.
**Brainstorming session:** Armory thread, evening of 2026-06-26.

---

## 1. Why v2

v1 shipped in late April 2026 as a working install of Chris's daily Claude Code workflow. The Mac end-to-end test passed in a scratch HOME. The Windows end-to-end test was deferred (`Phase 13b — needs actual Windows hardware`) and never ran. When Chris attempted to install v1 on Windows two months ago, the experience was "incredibly bumpy" — he got it working only by being physically present to troubleshoot.

v2 has two goals:

1. **Bulletproof the unattended Windows install.** Chris's friend (Windows, scared of code, has used Claude.ai via Co-Work but never the CLI) will install this without Chris in front of the machine.
2. **Fold in three months of new learnings.** New skills, new MCP servers, refined audit/dedup rules, the cloud cron-loop pattern, the System-Manifest operational-wisdom cheatsheet, expanded Armory seeds.

Most of the v1 infrastructure is good. v2 is a hardening + content refresh, not a redesign.

---

## 2. Scope ceiling

**Full surface.** v2 ships the broadest set of skills, MCPs, and patterns that are realistically portable to Windows. Specifically:

- All v1 skills + 9 new ones (21 total).
- Three MCP servers: lean-ctx (install vector fixed), Armory (refreshed), Council (new — Gemini + GPT + NVIDIA).
- A System-Manifest cheatsheet template.
- ~10 expanded Armory seed notes.
- A documented cloud cron-loop recipe via `/schedule` (Windows-clean because it runs in Anthropic's cloud, not on the user's machine).
- Documented macOS-only "power upgrade" path — daemon plists + Full Disk Access walkthrough + autoloop routine template — that adds the launchd ecosystem when the user is on Mac. Hidden from Windows users.

**Out of scope for v2.**
- Auto-installing macOS daemons during initial install (only via documented opt-in upgrade).
- Voice-flow tooling specific to Wispr Flow on Windows (it's Mac-only).
- Telemetry / phone-home.

---

## 3. Overall flow

```
┌──────────────────────────────────────────────────────────┐
│ PRE-INSTALL.md (browser-only, no terminal)              │
│ Accounts (GitHub, Anthropic), optional tools (Obsidian, │
│ terminal, dictation, Wispr / cmux for Mac users)        │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│ setup.ps1 (Windows) / setup.sh (Mac)                    │
│ Pre-flight prereq check → auth checkpoint A (gh) →      │
│ finisher (10 steps, hardened) → auth checkpoint B       │
│ (claude /login) → /verify smoke test → /welcome         │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│ /welcome — Two-track interview                          │
│ Routes implicitly by coding-experience answer.          │
│ Track A (Beginner): v1's interview, preserved.          │
│ Track B (Adopter): trimmed, shows what's new,           │
│ branch into bring-existing-project OR new-workflow.     │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│ First real session                                      │
└──────────────────────────────────────────────────────────┘
```

---

## 4. What ships in v2 (delta from v1)

### 4.1 Skills (21 total)

**v1 skills carried forward (12):** audit, digest, ingest, investigate, memory-md-management, morning-brief, new-project, scout, status-report, today, welcome, wrap. All refreshed where content has drifted (especially `audit` which now encodes the three audit rules from Session 19 + the 2026-06-23 app-stack scope ruling — see §6.2).

**New skills (9):**
- `/uptospeed` — re-enter a project with confidence after time away.
- `/audit-internal` — Brain-side drift detection in `_brain/`. Encodes: same-source vs distinct-source dedup classification (Step 3.4), two-surface System-Manifest check (Step 5.3), project-stack lib filter (Step 7.1.5).
- `/armory-cost` — per-session token + estimated cost from JSONL transcripts (no telemetry infrastructure required).
- `/simplify` — feature-completion subtractive pass (the `/simplify` habit or "find every dead/duplicate/unnecessary piece you just added" prompt).
- `/loop` — recurring task pattern within a single session.
- `/schedule` — cloud cron routine creation. Required for the cron loop recipe.
- `/run` — launch and drive the project's app to verify changes in a real browser/window.
- `/verify` — confirm a code change actually does what it claims (used internally by the installer's smoke test; also user-invocable).
- `/speak` — voice playback of last response via macOS `say` (Mac-only, document accordingly).

### 4.2 MCP servers

| Server | v1 | v2 | Notes |
|---|---|---|---|
| lean-ctx | npm guess (broken) | brew tap (Mac) / scoop or winget (Windows) | Install vector finally verified. |
| Armory (Armor-Bearer) | Vendored April snapshot | Refreshed against current source | 7 tools: search, briefing, ingest, cheatsheet, stats, send_message, read_messages. |
| Council | — | NEW, vendored from source | 6 tools (consult, code_review, save, status, design_generate, design_review) + Gemini/GPT/NVIDIA voices. Gated on per-voice API key env vars (null-no-op when key missing, same pattern Armory uses). Friend can install v2 without any keys and Council registers as no-op until he adds them. |

### 4.3 Operational docs

- `templates/System-Manifest.md` — NEW. Seeded with foundational entries (Planning, Coding, Context Management, Skill Design, Working with Chris, Observability). The friend appends his own learnings as he uses the kit. This is the operational-wisdom doc pattern Chris's own Armory has been using for months.

### 4.4 Armory seed notes

Expanded from 3 to ~10:

- `2026-04-10_context-forty-percent-rule.md` (carried)
- `2026-04-10_plan-mode-first.md` (carried)
- `2026-04-10_vertical-slices.md` (carried)
- NEW: `rewind-discipline.md` — `/rewind` instead of "try again."
- NEW: `boris-cherny-claude-md.md` — CLAUDE.md as accumulating learnings file.
- NEW: `feature-completion-subtractive-pass.md` — `/simplify` habit.
- NEW: `idempotency-keys.md` — every mutating endpoint accepts `Idempotency-Key`.
- NEW: `adhd-prompts-kit.md` — task paralysis shatterer, dopamine menu, body doubling, etc.
- NEW: `jsonl-transcript-debugging.md` — debug skills from the JSONL transcript, not memory.
- NEW: `recoverable-delete-safety-net.md` — `brew install trash` (Mac) or equivalent.

All seeds are sanitized (no Chris-specific business names, no real internal paths) and pass `.banned-strings`.

### 4.5 Cron loop recipe

`docs/recipes/cron-loop.md` — NEW. Walkthrough of creating an hourly cloud routine via `/schedule`, with:
- A starter prompt template the friend can customize.
- An explanation of *why* this works on Windows (runs in Anthropic's cloud, not local launchd / Task Scheduler).
- The conservative-action defaults from Chris's own autoloop (cap on file mods per tick, escalate-to-inbox-brain pattern, no-op exit when nothing actionable).

### 4.6 Mac-only power upgrade

`docs/upgrades/mac-daemons.md` + `templates/launchd/` — NEW. Documented opt-in path. Detects Mac platform; walks through enabling the daemon plists (watcher, scout, daily-audit, investigator, internal-auditor, overwatch, morning-brief, digest, nerve-center-watcher), Full Disk Access setup for the iMessage Swift binary, and the autoloop routine. Hidden from Windows users by platform-detect in the installer.

### 4.7 Hooks + agents — unchanged

Three hooks (code-reviewer-prompt, overwatch-context-guard.sh, overwatch-session-start.sh) and two agents (brain-updater.md, context-updater.md) carry forward from v1 with content refresh where drifted.

---

## 5. Install flow choreography

### 5.1 PRE-INSTALL.md (browser-only, no terminal)

Platform-split into two parallel tracks. Each section ≤200 words, imperative voice, ends with a self-check the friend verifies on his own. Troubleshooting subsections appear at the bottom of the doc.

**Windows track (the friend):**
1. Create your GitHub account — github.com/signup, pick a username, verify email. Self-check: see your avatar in the top-right.
2. Create your Anthropic account + Claude Code pass — claude.com signup, activate Claude Code subscription. Self-check: Claude Code tile visible in your dashboard.
3. Install winget (App Installer) — Microsoft Store one-click. Self-check: `winget --version` returns a number in PowerShell.
4. Install Obsidian — obsidian.md download + run installer. Self-check: Obsidian launches; don't set up a vault yet.
5. Verify your terminal — Windows Terminal is built-in on Win 10/11. Self-check: `Win+R`, type `wt`, terminal opens.
6. (Optional) Voice dictation — Win+H for the built-in dictation, or skip.
7. Final check — open PowerShell, run a 3-line health check, all succeed.
8. **Now you're ready** — clone the kit, cd in, run `.\setup.ps1`.

**Mac track (Chris's future self):**
Parallel beats with Homebrew (install if not present), `brew install obsidian`, optional Wispr Flow ($), optional cmux ($). Same self-check pattern.

The doc is expected to take 20-30 minutes start to finish. By the time the friend opens PowerShell, every prerequisite is in place.

### 5.2 setup.ps1 / setup.sh flow

1. **Pre-flight** — detect all 5 prerequisites at once (winget, git, node, gh, claude). If any missing, show ONE consolidated list with copy-paste install commands. No piecemeal prompts.
2. **Auth checkpoint A** — `gh auth status` check. If not authed, explicit pause-prompt: *"I'm about to open your browser to authenticate GitHub. Finish there, come back here, press Enter when ready."* Run `gh auth login`. Re-check `gh auth status`. On still-failed, write a fallback error report (§5.5) and exit with clear single-step instruction.
3. **Finisher** — the 10-step Node finisher (see §5.3 for hardening).
4. **Auth checkpoint B** — first invocation of `claude` for the smoke test. Same pause-prompt pattern. Detects browser redirect, waits for the credential file to materialize at `~/.config/claude/` (Mac) or `%APPDATA%\claude\` (Windows).
5. **Smoke test** — `/verify` skill invocation (see §5.4). On any failure, fallback error report.
6. **`/welcome`** — drops into the two-track first-run interview.

### 5.3 Finisher hardening (10 steps + new safeguards)

The 10-step architecture from v1 is preserved (steps 01-create-workspace through 10-verify). Hardening:

- **Step 07 (install MCPs) — lean-ctx vector fixed.** Detect Homebrew on Mac → `brew tap` install. Detect scoop or winget on Windows → install via that. If neither → write a clear manual instruction with link + mark as "skipped" (kit still ships; lean-ctx can be added later). The `LEAN_CTX_PACKAGE` env var override stays for advanced users.
- **Step 07 — Council MCP added** with API-key gating like Armory's NVIDIA pattern. No keys = registers as no-op, no errors.
- **Cross-step — PATH refresh self-heal.** When step 07 needs npm but npm isn't visible after Node install, the finisher spawns a child process with the freshly-rebuilt PATH instead of telling the user "close PowerShell and re-run." Tested on Windows VM.
- **Resumability** — every step is already idempotent in v1. Document this explicitly so the friend can re-run `setup.ps1` after fixing an error without starting over. The finisher prints which step it's on and which already succeeded.

### 5.4 `/verify` smoke test (new skill)

Runs after the finisher and at any time the user invokes it. Checks:
- `claude mcp list` returns expected MCPs (lean-ctx, armory, council). Council voices may be inactive (no keys) — that's expected, not failure.
- Hooks fire on a tiny test edit (write a throwaway file under `~/Projects/_test/`, edit it, watch the code-reviewer-prompt hook print, delete the file).
- `~/Projects/_brain/` exists with the expected template tree.
- `gh auth status` returns OK.
- At least one kit-specific key is present in `~/.claude/settings.json` (proves the merge step ran).

On any failure: print exactly what's missing + one-liner remediation. On success: print a single OK line and exit.

### 5.5 Fallback error channel

When the installer hits an unrecoverable error, it writes a structured report to:
- Windows: `%USERPROFILE%\Desktop\starter-kit-broke-<UTC-timestamp>.txt`
- Mac: `~/Desktop/starter-kit-broke-<UTC-timestamp>.txt`

Contents:
- Which step failed.
- Command that was running.
- Full stderr (truncated to 4KB).
- System info: OS version, PowerShell version (Windows), Node version, npm version, `which`/`where` results for git/node/gh/claude, environment variables that matter (PATH, HOME, APPDATA, ANTHROPIC_API_KEY presence).
- **Explicit instructions** for the friend: *"Text this file to Chris at [number]"* (or whatever channel makes sense — Discord, email).

The error report contains no secrets — API keys are redacted, only presence/absence flagged. The friend can safely send it to Chris.

---

## 6. `/welcome` — two-track first-run interview

### 6.1 Routing question

The first thing `/welcome` asks (after detecting first-run vs re-run):

> Where are you at with coding?
> A. I haven't really written code before.
> B. I've used Claude (chat / Co-Work / projects) but never the CLI tool.
> C. I've done some scripting before.
> D. I'm a developer.

Routing:
- **A → Track A (Beginner).**
- **B / C / D → Track B (Adopter)**, with progressive intro-skipping. D skips the "here's what's new vs Claude.ai" preamble.

### 6.2 Track A — Beginner

Essentially v1's `/welcome` interview, preserved:
- Section 1 Identity (name, role, platform, coding level).
- Section 2 Focus — three-path fork (existing project / fresh idea / don't know yet).
- Section 3 Working style.
- Section 4 Communication style.
- Ends with the open braindump invitation.

The Wispr Flow callout fires after question 1 or 2 (Mac users only). 5-10 minute interview.

### 6.3 Track B — Adopter

New content, ~280 lines vs v1's 551:

1. **Identity** — name, platform, what you currently use Claude for (chat / projects / Co-Work). 3 questions.
2. **What's new vs Claude.ai** — a 4-bullet "here's what this kit gives you on top of what you already have" message:
   - Skills as callable functions
   - Hooks that fire on every Edit/Write
   - Persistent brain folder you can open in Obsidian
   - Armory ingestion (drop a YouTube link, get a structured note)
3. **Branch** — two-path fork:
   - **"Bring an existing project from Co-Work over"** — walks him through copying files into `~/Projects/<thing>/`, running `/uptospeed`, continuing where he left off.
   - **"Set up a workflow for ongoing use"** — walks him through Armory ingestion (try `/ingest` on a YouTube video he's been saving), the brain folder pattern, one cron loop recipe.
4. **Power moves to try in the first session** — 2-3 concrete things, e.g.:
   - Run `/ingest <youtube-url>` on something you've been meaning to watch.
   - Ask Claude to help you build a small TODO app following plan-mode-first.
   - Set up a `/schedule`-based hourly routine for the inbox you care about.

Ends with: *"Try one of those. I'll be there. Just type `claude` from `~/Projects/<dir>` and start."* Concrete next action, not braindump.

### 6.4 Re-run mode

If the marker file is gone but a profile file exists, `/welcome` shows a re-run menu:
- Update identity
- Update focus
- Update working style (Track A only)
- Add new project
- Cancel

Re-run is platform-agnostic; works for both tracks.

---

## 7. Verification + testing strategy

### 7.1 `/verify` smoke test

See §5.4. Bundled into the install flow; also user-invocable any time.

### 7.2 Fallback error channel

See §5.5. Always-available; writes structured report on any unrecoverable error.

### 7.3 GitHub Actions CI

`.github/workflows/install.yml` — runs on every push to any branch.

- **macos-latest runner** — installs Node, clones the kit fresh, runs `./setup.sh` with `HOME=/tmp/test-home`, asserts `/verify` smoke test passes.
- **windows-latest runner** — installs Node, clones the kit fresh, runs `.\setup.ps1` with `USERPROFILE=C:\test-home`, asserts `/verify` smoke test passes.

Where browser-auth is unavoidable (GitHub auth, Claude /login), the CI uses pre-provisioned secrets stored in GitHub Actions:
- `GH_TOKEN` (for `gh auth login --with-token`)
- `ANTHROPIC_API_KEY` (for non-interactive `claude` auth where supported, otherwise we mock the credential file)

CI failure → red on the PR; blocks merge to `main`. This catches every regression in the install flow without needing a VM open on Chris's side.

### 7.4 Pre-ship manual verification

Before handing v2 to the friend:
- All GitHub Actions runs green on `feat/v2-build` for the most recent 3 pushes.
- Chris manually runs `setup.sh` in a Mac scratch HOME and confirms.
- Chris runs `setup.ps1` in a Windows Sandbox or VM and confirms (one-time, before shipping). After that, CI carries the weight.

---

## 8. Implementation order (sketch — full plan comes from writing-plans)

Rough sequencing. The detailed plan with subagent dispatch is the next deliverable.

1. **Branch + scaffold.** `feat/v2-build`. Refresh CLAUDE.md + docs/context/ with v2 state.
2. **PRE-INSTALL.md.** Browser-only prep doc, Windows + Mac tracks.
3. **lean-ctx install vector fix.** Update step 07 with brew tap / scoop / winget detection. Verify in scratch.
4. **Council MCP vendor.** Vendor + sanitize from `~/Projects/Armory/council-server/`. Apply same gating pattern as Armory.
5. **System-Manifest template + 7 new Armory seeds.** Sanitize, scrub Chris-specific paths.
6. **9 new skills.** Sanitize from `~/.claude/skills/`. Each gets a 1-paragraph "what this does" intro for newcomers.
7. **`/verify` skill.** New skill with the 5-check smoke test.
8. **Fallback error channel.** Hook into both finisher and setup.ps1/setup.sh.
9. **`/welcome` two-track rewrite.** Track A preserved, Track B new content. Routing question added.
10. **PATH refresh self-heal.** Child process spawn for retry path.
11. **Cron loop recipe doc.** `docs/recipes/cron-loop.md` with starter routine template.
12. **Mac-only power upgrade doc + templates.** `docs/upgrades/mac-daemons.md` + `templates/launchd/`.
13. **GitHub Actions CI.** `.github/workflows/install.yml` with Mac + Windows runners.
14. **Pre-publish sanitization sweep.** Re-run `.banned-strings` check against all new content. Chris reviews every changed file.
15. **Manual smoke** — Mac scratch + Windows VM/Sandbox.
16. **Merge `feat/v2-build` → `main`.** Tag `v2.0.0`. Ship.

---

## 9. Open questions / explicit non-decisions

- **Cmux on Windows?** Cmux is Mac-only. Windows alternatives are documented (Windows Terminal built-in, VSCode terminal). Document these in PRE-INSTALL but don't recommend a paid cmux equivalent.
- **Wispr Flow on Windows?** Wispr Flow is Mac-only. Windows alternative is Win+H built-in dictation. Document in PRE-INSTALL.
- **iMessage Send / Read on Windows?** Cannot work — iMessage doesn't exist on Windows. Armory's `armory_send_message` and `armory_read_messages` MCP tools will register but no-op on Windows (or print a clear "not available on this platform" error). This needs a small platform-detect in the Armory MCP server source — flag for review during MCP refresh.
- **Anthropic CLI for Claude Code non-interactive auth?** As of writing, Claude Code's first-login is browser-only. CI will need to mock the credential file. Verify the API hasn't changed before implementing the CI step.

---

## 10. Self-review notes (post-draft)

- **Placeholders:** None — no TBD or TODO in this doc.
- **Internal consistency:** §4 skill list and §8 implementation order both reference the 9 new skills consistently. §5 install flow and §6 `/welcome` structure cross-reference correctly.
- **Scope:** This is one design doc, one implementation plan. The "Mac power upgrade" content adds surface area but is gated by platform detect — doesn't bloat the Windows install path.
- **Ambiguity:** `/verify`'s "hooks fire" check could be flaky if the test edit lands during a /clear or compact. Plan should specify a stable test edit path (e.g., a dedicated `~/Projects/_starter-kit-verify/`).

End of design.
