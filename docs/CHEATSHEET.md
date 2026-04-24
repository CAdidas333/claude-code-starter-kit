# Cheatsheet — Claude Code Starter Kit

Print this. Keep it next to your keyboard.

---

```
╔═ LAUNCH CLAUDE ═══════════════════════════════════════════════╗
║ claude                    start a new session here            ║
║ claude -c                 continue your last session          ║
║ claude -p "prompt"        one-shot headless query             ║
║ claude --model opus       pick a specific model               ║
║ claude --add-dir ../lib   give Claude access to another dir   ║
║                                                               ║
║ See CLI-REFERENCE.md for every flag.                          ║
╚═══════════════════════════════════════════════════════════════╝
```

```
╔═ BUILT-IN COMMANDS (type inside a session) ═══════════════════╗
║ /help            list every command available in this session ║
║ /clear           wipe context, start fresh (keep the session)  ║
║ /compact         summarize history to free up context          ║
║ /model           switch models mid-session                     ║
║ /cost            see what this session has cost so far         ║
║ /memory          open your memory file for the current project ║
║ /mcp             list connected MCP servers and their status   ║
║ /doctor          diagnose problems with your install           ║
║ /status          show session info (model, context %, tools)   ║
║ /fast            toggle Opus 4.6 fast output mode              ║
║ /voice           hold spacebar to record voice input           ║
║ /rc              connect session to the Claude mobile app      ║
╚═══════════════════════════════════════════════════════════════╝
```

```
╔═ YOUR INSTALLED SKILLS ═══════════════════════════════════════╗
║ /welcome             onboarding interview (first run)          ║
║ /new-project         scaffold a new project end to end         ║
║ /today               daily briefing across all projects        ║
║ /wrap                end-of-session cleanup + commit + handoff ║
║ /status-report       printable project report                  ║
║ /ingest <url>        save a video/article/tweet to Armory      ║
║ /digest              weekly Armory summary                     ║
║ /investigate         verify claims from ingested notes         ║
║ /scout               autonomous research in your focus areas   ║
║ /audit               check what Armory knowledge you've used   ║
║ /morning-brief       Gmail triage + today's schedule           ║
║ /memory-md-management  audit and clean up memory files         ║
╚═══════════════════════════════════════════════════════════════╝
```

```
╔═ KEYBOARD SHORTCUTS ══════════════════════════════════════════╗
║ Shift+Tab+Tab     enter Plan Mode — design before you build   ║
║ Ctrl+S            stash your current input (come back later)  ║
║ Ctrl+O            open the session transcript search          ║
║ Esc               interrupt Claude when it's off track        ║
║ Up arrow          recall your previous prompts                ║
╚═══════════════════════════════════════════════════════════════╝
```

```
╔═ SESSION RULES ═══════════════════════════════════════════════╗
║                                                               ║
║  START NEW SESSION when:                                      ║
║   - You switch projects                                       ║
║   - Context is past ~40% and quality is degrading             ║
║   - You're starting a fundamentally different task            ║
║                                                               ║
║  CONTINUE SESSION (claude -c) when:                           ║
║   - You're picking up where you left off an hour ago          ║
║   - Context is still fresh                                    ║
║   - The handoff from /wrap is still relevant                  ║
║                                                               ║
║  WRAP when:                                                   ║
║   - You're done with a work block                             ║
║   - You're switching to a meeting or dinner                   ║
║   - Context is full and you want a clean handoff              ║
║                                                               ║
║  HANDOFF PROMPT: /wrap writes one automatically.              ║
║   Next session, paste it in or type 'read handoff' and        ║
║   Claude picks up without a ramp-up.                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

```
╔═ FIRST PRINCIPLES ════════════════════════════════════════════╗
║                                                               ║
║  1. Talk, don't type.                                         ║
║     Wispr Flow or /voice. Longer thoughts, less friction.     ║
║                                                               ║
║  2. Lead with pain, not solutions.                            ║
║     Describe the problem. Let Claude propose the fix.         ║
║                                                               ║
║  3. Let Claude read before it writes.                         ║
║     "Read these files, then tell me what you'd change."       ║
║                                                               ║
║  4. Plan Mode for anything non-trivial.                       ║
║     Shift+Tab+Tab. Argue about the plan, then build.          ║
║                                                               ║
║  5. One project per window.                                   ║
║     Never run two projects in one session. Context bleeds.    ║
║                                                               ║
║  6. Push often.                                               ║
║     /wrap commits and pushes. Do it every work block.         ║
║                                                               ║
║  7. Private by default.                                       ║
║     New repos are private until you decide otherwise.         ║
║                                                               ║
║  8. Talk to the Armory.                                       ║
║     /ingest anything useful. /scout on quiet days.            ║
║                                                               ║
║  9. Trust the /wrap habit.                                    ║
║     Five minutes of wrapping saves an hour of ramping up.     ║
║                                                               ║
║ 10. Quality beats speed.                                      ║
║     Better to go slow and right than fast and wrong.          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

Built by Chris Whitney — github.com/CAdidas333/claude-code-starter-kit
