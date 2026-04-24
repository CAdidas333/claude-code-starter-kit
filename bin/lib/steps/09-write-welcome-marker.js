const fs = require('fs');
const log = require('../logger');
const paths = require('../paths');
const { parentDir } = require('../fs-util');

// Step 09 writes an empty sentinel file at ~/.claude/.welcome-pending.
// The overwatch-session-start.sh hook (installed by step 05) reads
// this file on the first Claude Code launch and prints the "Run
// /welcome to get started" banner. The hook is responsible for
// deleting the marker after the user runs /welcome.
//
// Idempotency: if the marker already exists we leave it alone — the
// user might be mid-onboarding on a previous partial install, and we
// don't want to re-arm a banner they've already acknowledged. If it's
// missing, we create an empty file. Parent dir (~/.claude/) is already
// ensured by step 01; we still mkdir as defense in depth.

module.exports = {
  name: '09: Write welcome marker',
  fatal: true,
  async run() {
    log.header(module.exports.name);

    if (fs.existsSync(paths.WELCOME_MARKER)) {
      log.ok(`Welcome marker already present: ${paths.WELCOME_MARKER}`);
      return;
    }

    fs.mkdirSync(parentDir(paths.WELCOME_MARKER), { recursive: true });
    fs.writeFileSync(paths.WELCOME_MARKER, '');
    log.ok(`Wrote welcome marker: ${paths.WELCOME_MARKER}`);
  },
};
