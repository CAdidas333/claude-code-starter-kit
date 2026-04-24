const fs = require('fs');
const log = require('../logger');
const paths = require('../paths');
const { KIT_FILES } = require('../manifest');
const { joinUnder, parentDir, assertSafeRelPath } = require('../fs-util');

// Step 03 installs skill definitions from kitRoot/skills/<name>/SKILL.md
// into ~/.claude/skills/<name>/SKILL.md.
//
// Overwrite semantics: unlike brain templates (which are the user's
// working memory), skills are kit-owned. When the kit updates a skill
// we WANT the new version to flow to the user, so this step overwrites
// any existing SKILL.md at the destination. If the user has customized
// a skill they should put their version under a different name.

module.exports = {
  name: '03: Install skills',
  fatal: true,
  async run(kitRoot) {
    log.header(module.exports.name);

    let copied = 0;
    let updated = 0;
    let missing = 0;

    for (const name of KIT_FILES.skills) {
      assertSafeRelPath(name);
      const relPath = `skills/${name}/SKILL.md`;
      const src = joinUnder(kitRoot, relPath);
      const dst = joinUnder(paths.CLAUDE_SKILLS, `${name}/SKILL.md`);

      if (!fs.existsSync(src)) {
        log.warn(`skill source missing, skipping: ${name}`);
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
      `Skills: ${copied} installed, ${updated} updated, ${missing} source missing`
    );
  },
};
