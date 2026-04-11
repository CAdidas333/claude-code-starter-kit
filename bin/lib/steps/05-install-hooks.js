const fs = require('fs');
const log = require('../logger');
const paths = require('../paths');
const { KIT_FILES } = require('../manifest');
const { joinUnder, parentDir, assertSafeRelPath } = require('../fs-util');

// Step 05 installs hook scripts from kitRoot/hooks/<name> into
// ~/.claude/hooks/<name>.
//
// Overwrite semantics: hooks are kit-owned — updates flow to the user,
// same as skills and agents.
//
// Executable bit: shell hooks (.sh) need to be executable. We chmod
// them to 0755 after copying. Markdown hook prompts (.md) do not get
// the executable bit. chmod is a no-op on Windows where the NTFS layer
// ignores POSIX mode bits.

module.exports = {
  name: '05: Install hooks',
  fatal: true,
  async run(kitRoot) {
    log.header(module.exports.name);

    let copied = 0;
    let updated = 0;
    let missing = 0;
    let chmodded = 0;

    for (const name of KIT_FILES.hooks) {
      assertSafeRelPath(name);
      const relPath = `hooks/${name}`;
      const src = joinUnder(kitRoot, relPath);
      const dst = joinUnder(paths.CLAUDE_HOOKS, name);

      if (!fs.existsSync(src)) {
        log.warn(`hook source missing, skipping: ${name}`);
        missing += 1;
        continue;
      }

      const existed = fs.existsSync(dst);
      fs.mkdirSync(parentDir(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      if (existed) updated += 1;
      else copied += 1;

      if (name.endsWith('.sh')) {
        try {
          fs.chmodSync(dst, 0o755);
          chmodded += 1;
        } catch (err) {
          // chmod can fail on some Windows filesystems; non-fatal.
          log.warn(`chmod failed for ${name}: ${err.message}`);
        }
      }
    }

    log.ok(
      `Hooks: ${copied} installed, ${updated} updated, ${chmodded} chmodded, ${missing} source missing`
    );
  },
};
