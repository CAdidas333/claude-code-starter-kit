const fs = require('fs');
const path = require('path');
const log = require('../logger');
const paths = require('../paths');

// Directories that must exist before any copy steps run. mkdirSync with
// recursive:true is a safe no-op when the directory already exists, which
// is what keeps this step idempotent.
const DIRS_TO_CREATE = [
  paths.PROJECTS,
  paths.BRAIN,
  path.join(paths.BRAIN, 'Feedback'),
  path.join(paths.BRAIN, 'Decisions'),
  path.join(paths.BRAIN, 'Features'),
  path.join(paths.BRAIN, 'Launch'),
  path.join(paths.BRAIN, 'IP'),
  path.join(paths.BRAIN, 'Ideas'),
  path.join(paths.BRAIN, 'Ideas', 'Braindumps'),
  path.join(paths.BRAIN, 'Ideas', 'Explored'),
  path.join(paths.BRAIN, 'Templates'),
  path.join(paths.BRAIN, 'Armory'),
  path.join(paths.BRAIN, 'Armory', 'Cheatsheets'),
  path.join(paths.BRAIN, 'Armory', 'Notes'),
  path.join(paths.BRAIN, 'Armory', 'Investigations'),
  path.join(paths.BRAIN, 'Armory', 'Digests'),
  paths.CLAUDE_DIR,
  paths.CLAUDE_SKILLS,
  paths.CLAUDE_AGENTS,
  paths.CLAUDE_HOOKS,
];

module.exports = {
  name: '01: Create workspace directories',
  fatal: true,
  async run() {
    log.header(module.exports.name);
    for (const dir of DIRS_TO_CREATE) {
      fs.mkdirSync(dir, { recursive: true });
    }
    log.ok(`Created ${DIRS_TO_CREATE.length} directories`);
  },
};
