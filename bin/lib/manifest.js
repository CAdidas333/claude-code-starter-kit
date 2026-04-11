// KIT_FILES = the explicit allow-list of files shipped by the finisher.
// Adding a file here is a deliberate action. Never use cp -r or similar
// bulk operations — if a file isn't on this list, it doesn't ship.

// kitRoot is resolved relative to bin/finish-setup.js location
// src paths are relative to the kit repo root
// dst paths are relative to the appropriate destination (brain, claude dir, etc.)

const KIT_FILES = {
  // Brain scaffold -> ~/Projects/_brain/
  brain: [
    'templates/_brain/Dashboard.md',
    'templates/_brain/README.md',
    'templates/_brain/Feedback/Working-Style.md',
    'templates/_brain/Feedback/Code-Standards.md',
    'templates/_brain/Decisions/README.md',
    'templates/_brain/Features/README.md',
    'templates/_brain/Ideas/_Inbox.md',
    'templates/_brain/Launch/README.md',
    'templates/_brain/IP/README.md',
    'templates/_brain/Templates/Braindump.md',
    'templates/_brain/Templates/Explored-Idea.md',
    'templates/_brain/Templates/New-Project-Bootstrap.md',
    'templates/_brain/Armory/README.md',
    'templates/_brain/Armory/Focus.md',
    'templates/_brain/Armory/Index.md',
  ],

  // Skills -> ~/.claude/skills/<name>/SKILL.md
  skills: [
    'welcome', 'new-project', 'today', 'wrap', 'status-report',
    'ingest', 'digest', 'investigate', 'scout', 'audit',
    'morning-brief', 'memory-md-management',
  ],

  // Agents -> ~/.claude/agents/<name>.md
  agents: ['context-updater', 'brain-updater'],

  // Hooks -> ~/.claude/hooks/<name>
  hooks: [
    'overwatch-session-start.sh',
    'overwatch-context-guard.sh',
    'code-reviewer-prompt.md',
  ],

  // ~/Projects (root CLAUDE.md)
  rootClaude: 'templates/CLAUDE.md',

  // ~/.claude/settings.json (merge, don't overwrite)
  settings: 'templates/settings.json',

  // ~/.mcp.json (merge, don't overwrite)
  mcp: 'templates/mcp.json',

  // Armory seed notes -> ~/Projects/_brain/Armory/Notes/
  armorySeeds: [
    'armory-seeds/plan-mode-first.md',
    'armory-seeds/context-forty-percent-rule.md',
    'armory-seeds/vertical-slices.md',
  ],
};

module.exports = { KIT_FILES };
