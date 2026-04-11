const os = require('os');
const path = require('path');

const HOME = os.homedir();
const PROJECTS = path.join(HOME, 'Projects');
const BRAIN = path.join(PROJECTS, '_brain');
const CLAUDE_DIR = path.join(HOME, '.claude');
const CLAUDE_SKILLS = path.join(CLAUDE_DIR, 'skills');
const CLAUDE_AGENTS = path.join(CLAUDE_DIR, 'agents');
const CLAUDE_HOOKS = path.join(CLAUDE_DIR, 'hooks');
const CLAUDE_SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const MCP_CONFIG = path.join(HOME, '.mcp.json');
const WELCOME_MARKER = path.join(CLAUDE_DIR, '.welcome-pending');

module.exports = {
  HOME, PROJECTS, BRAIN,
  CLAUDE_DIR, CLAUDE_SKILLS, CLAUDE_AGENTS, CLAUDE_HOOKS, CLAUDE_SETTINGS,
  MCP_CONFIG, WELCOME_MARKER,
};
