const fs = require('fs');
const log = require('../logger');
const paths = require('../paths');
const { KIT_FILES } = require('../manifest');
const { joinUnder, parentDir } = require('../fs-util');

// Step 02 ships the brain scaffold templates into ~/Projects/_brain/.
//
// IMPORTANT: This step MUST NOT overwrite existing files. The user's brain
// is their working memory — Dashboard.md, feedback notes, decision logs, etc.
// may have been edited between runs. We only copy a template if the
// destination does not already exist. This makes re-runs safe and lets
// kit updates land only on files the user hasn't created yet.
//
// Source paths in KIT_FILES.brain are relative to kitRoot and already
// include the `templates/_brain/` prefix. The destination is the same
// relative path below paths.BRAIN, minus that prefix.

const BRAIN_SRC_PREFIX = 'templates/_brain/';

module.exports = {
  name: '02: Install brain templates',
  fatal: true,
  async run(kitRoot) {
    log.header(module.exports.name);

    let copied = 0;
    let skipped = 0;
    let missing = 0;

    for (const relSrc of KIT_FILES.brain) {
      const src = joinUnder(kitRoot, relSrc);
      const relDst = relSrc.startsWith(BRAIN_SRC_PREFIX)
        ? relSrc.slice(BRAIN_SRC_PREFIX.length)
        : relSrc;
      const dst = joinUnder(paths.BRAIN, relDst);

      if (!fs.existsSync(src)) {
        log.warn(`source missing, skipping: ${relSrc}`);
        missing += 1;
        continue;
      }

      if (fs.existsSync(dst)) {
        skipped += 1;
        continue;
      }

      fs.mkdirSync(parentDir(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      copied += 1;
    }

    log.ok(
      `Brain templates: ${copied} copied, ${skipped} already present, ${missing} source missing`
    );

    // Armory seed notes -> ~/Projects/_brain/Armory/Notes/
    // Same no-overwrite invariant: skip if destination already exists.
    let seedsCopied = 0;
    let seedsSkipped = 0;
    let seedsMissing = 0;

    for (const relSrc of KIT_FILES.armorySeeds) {
      const src = joinUnder(kitRoot, relSrc);
      const basename = relSrc.split('/').pop();
      const dst = joinUnder(paths.BRAIN, 'Armory/Notes/' + basename);

      if (!fs.existsSync(src)) {
        log.warn(`seed source missing, skipping: ${relSrc}`);
        seedsMissing += 1;
        continue;
      }

      if (fs.existsSync(dst)) {
        seedsSkipped += 1;
        continue;
      }

      fs.mkdirSync(parentDir(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      seedsCopied += 1;
    }

    log.ok(
      `Armory seeds: ${seedsCopied} copied, ${seedsSkipped} already present, ${seedsMissing} source missing`
    );

    // Armory cheatsheets -> ~/Projects/_brain/Armory/Cheatsheets/
    // Same no-overwrite invariant: skip if destination already exists.
    let csCopied = 0;
    let csSkipped = 0;
    let csMissing = 0;

    for (const relSrc of KIT_FILES.armoryCheatsheets) {
      const src = joinUnder(kitRoot, relSrc);
      const basename = relSrc.split('/').pop();
      const dst = joinUnder(paths.BRAIN, 'Armory/Cheatsheets/' + basename);

      if (!fs.existsSync(src)) {
        log.warn(`cheatsheet source missing, skipping: ${relSrc}`);
        csMissing += 1;
        continue;
      }

      if (fs.existsSync(dst)) {
        csSkipped += 1;
        continue;
      }

      fs.mkdirSync(parentDir(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      csCopied += 1;
    }

    log.ok(
      `Armory cheatsheets: ${csCopied} copied, ${csSkipped} already present, ${csMissing} source missing`
    );
  },
};
