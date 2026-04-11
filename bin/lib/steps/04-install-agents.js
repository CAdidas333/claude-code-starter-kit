const fs = require('fs');
const log = require('../logger');
const paths = require('../paths');
const { KIT_FILES } = require('../manifest');
const { joinUnder, parentDir, assertSafeRelPath } = require('../fs-util');

// Step 04 installs agent definitions from kitRoot/agents/<name>.md
// into ~/.claude/agents/<name>.md.
//
// Overwrite semantics: same as skills — agents are kit-owned and kit
// updates should flow through to the user. Existing destinations are
// overwritten.

module.exports = {
  name: '04: Install agents',
  fatal: true,
  async run(kitRoot) {
    log.header(module.exports.name);

    let copied = 0;
    let updated = 0;
    let missing = 0;

    for (const name of KIT_FILES.agents) {
      assertSafeRelPath(name);
      const relPath = `agents/${name}.md`;
      const src = joinUnder(kitRoot, relPath);
      const dst = joinUnder(paths.CLAUDE_AGENTS, `${name}.md`);

      if (!fs.existsSync(src)) {
        log.warn(`agent source missing, skipping: ${name}`);
        missing += 1;
        continue;
      }

      const existed = fs.existsSync(dst);
      fs.mkdirSync(parentDir(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      if (existed) updated += 1;
      else copied += 1;
    }

    log.ok(
      `Agents: ${copied} installed, ${updated} updated, ${missing} source missing`
    );
  },
};
