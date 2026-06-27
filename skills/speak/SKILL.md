---
name: speak
description: Voice-playback of Claude's last response using macOS `say` with the Alex voice. Use when the user types `/speak` (read last response aloud), `/speak auto` (enable auto-playback of every response via Stop hook), `/speak off` or `/speak manual` (disable auto-playback), or `/speak status` (report current mode).
---

# /speak — Voice playback

The user wants to hear Claude's responses read aloud instead of reading everything. Two modes controlled by a state file at `~/.claude/speak-mode`:

- **`manual` (default)** — nothing auto-plays. `/speak` reads the last message on demand.
- **`auto`** — a Stop hook in `~/.claude/settings.json` runs the same script after every Claude turn, reading the final message automatically.

Worker: `~/.claude/scripts/speak-last.sh`
Synth: `~/.claude/scripts/bin/speak-av.swift` (AVSpeechSynthesizer, sees every installed voice including Siri regionals + Personal Voice). Falls back to `say` if the helper is missing.
Voice: set in `~/.claude/speak-voice` (default `Samantha`). Change with `/speak voice <name>`. Name can be a voice name (e.g. `Eddy`), a full label (e.g. `Voice 3`), `personal` to use Personal Voice, or the full identifier.

## What this skill does

Reads Claude's last response aloud using macOS text-to-speech. Supports on-demand playback (`/speak`) and auto-playback mode that speaks every response automatically via a Stop hook. Useful when you want to listen rather than read, or when working hands-free.

## Dispatch — run the matching bash command, then reply with the confirmation text

| User input | Action | Reply |
|------------|--------|-------|
| `/speak` _(no arg)_ | `bash ~/.claude/scripts/speak-last.sh` | "Playing last response." (do not re-narrate the message) |
| `/speak auto` | `echo auto > ~/.claude/speak-mode` | "Auto mode ON — every response will be read aloud. Use `/speak off` to stop." |
| `/speak off` OR `/speak manual` | `echo manual > ~/.claude/speak-mode` | "Auto mode OFF — use `/speak` to hear the last response on demand." |
| `/speak status` | `cat ~/.claude/speak-mode` and `cat ~/.claude/speak-voice` | "Current mode: <value>. Voice: <voice>." |
| `/speak voice <name>` | `echo <name> > ~/.claude/speak-voice && ~/.claude/scripts/bin/speak-av.swift --voice "<name>" "This is <name>."` | "Voice set to <name>. Just spoke a sample." |
| `/speak voices` | `~/.claude/scripts/bin/speak-av.swift --list \| grep -E '^(en\|personal)' \| sort` | Print the table of English + Personal voices (`lang<TAB>quality<TAB>name<TAB>identifier`). |
| `/speak stop` | `pkill -f speak-av.swift; pkill -x say` | "Stopped playback." |

## Rules

- Do **not** echo back the message content when invoking `/speak` — the whole point is the user doesn't need it re-typed.
- Keep replies to one line. This is a utility; don't narrate.
- The script auto-kills any currently-speaking `say` process, so `/speak` is always safe to retrigger.
- If the script prints an error to stderr (e.g. "no transcript found"), surface it verbatim so the user can debug.
- Markdown is stripped before TTS (bold, italics, code fences → " ... code block ... ", links collapse to text, emojis dropped, long outputs cap ~2500 chars).

## Infrastructure (already installed — do not rebuild unless missing)

1. `~/.claude/scripts/speak-last.sh` — executable worker (handles both manual + `--stop` invocation).
2. `~/.claude/speak-mode` — state file, seed value `manual`.
3. `~/.claude/settings.json` → `hooks.Stop` entry running `bash ~/.claude/scripts/speak-last.sh --stop` on every turn. The hook itself honors the mode file and exits silently when mode is `manual`.
