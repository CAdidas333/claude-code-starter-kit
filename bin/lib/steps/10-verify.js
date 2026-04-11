const fs = require('fs');
const log = require('../logger');
const paths = require('../paths');
const { KIT_FILES } = require('../manifest');
const { joinUnder } = require('../fs-util');

// Step 10 is a read-only verification pass. It enumerates every file the
// earlier steps were expected to install and checks that each one lands
// where the manifest says it should. Anything missing is reported as a
// warning — the step NEVER exits non-zero. This is an informational
// report, not a gate.
//
// Why non-fatal: during development the kit's templates, skills, agents,
// and hooks may not exist yet — Phases 4-8 create them. A fatal verify
// step would make the finisher unusable until every phase was complete.
// Even in production, a single missing file shouldn't wipe out an
// otherwise successful install; the user can see what's missing and
// re-run or patch manually.

const BRAIN_SRC_PREFIX = 'templates/_brain/';

// Build the full list of (category, label, destination) tuples from
// the manifest. Central spot so the verify logic doesn't have to know
// the relative-path math each category uses.
function buildExpectedTargets() {
  const targets = [];

  for (const relSrc of KIT_FILES.brain) {
    const relDst = relSrc.startsWith(BRAIN_SRC_PREFIX)
      ? relSrc.slice(BRAIN_SRC_PREFIX.length)
      : relSrc;
    targets.push({
      category: 'brain',
      label: relDst,
      dst: joinUnder(paths.BRAIN, relDst),
    });
  }

  for (const name of KIT_FILES.skills) {
    targets.push({
      category: 'skill',
      label: name,
      dst: joinUnder(paths.CLAUDE_SKILLS, `${name}/SKILL.md`),
    });
  }

  for (const name of KIT_FILES.agents) {
    targets.push({
      category: 'agent',
      label: name,
      dst: joinUnder(paths.CLAUDE_AGENTS, `${name}.md`),
    });
  }

  for (const name of KIT_FILES.hooks) {
    targets.push({
      category: 'hook',
      label: name,
      dst: joinUnder(paths.CLAUDE_HOOKS, name),
    });
  }

  // Single-file targets from the manifest.
  targets.push({
    category: 'settings',
    label: 'settings.json',
    dst: paths.CLAUDE_SETTINGS,
  });
  targets.push({
    category: 'mcp',
    label: '.mcp.json',
    dst: paths.MCP_CONFIG,
  });
  targets.push({
    category: 'marker',
    label: '.welcome-pending',
    dst: paths.WELCOME_MARKER,
  });

  return targets;
}

module.exports = {
  name: '10: Verify install',
  fatal: false,
  async run() {
    log.header(module.exports.name);

    const targets = buildExpectedTargets();

    // Tally per category so the summary line is meaningful.
    const counts = {};
    const missing = [];

    for (const t of targets) {
      if (!counts[t.category]) counts[t.category] = { present: 0, total: 0 };
      counts[t.category].total += 1;
      if (fs.existsSync(t.dst)) {
        counts[t.category].present += 1;
      } else {
        missing.push(t);
      }
    }

    // Brain git check is a separate concern — .git is a directory, not
    // a manifest entry, and we want it called out by name in the summary.
    const brainGitDir = joinUnder(paths.BRAIN, '.git');
    const brainGitInitialized = fs.existsSync(brainGitDir);

    // Per-category lines, plus the git line, plus missing warnings.
    for (const category of Object.keys(counts)) {
      const { present, total } = counts[category];
      if (present === total) {
        log.ok(`${category}: ${present}/${total}`);
      } else {
        log.warn(`${category}: ${present}/${total}`);
      }
    }

    if (brainGitInitialized) {
      log.ok('brain git repo: initialized');
    } else {
      log.warn('brain git repo: NOT initialized');
    }

    if (missing.length > 0) {
      log.warn(`${missing.length} manifest file(s) not found at destination:`);
      // Cap the per-file printout so an empty scaffold doesn't dump
      // hundreds of lines. First 20 are enough to diagnose.
      const MAX = 20;
      for (const t of missing.slice(0, MAX)) {
        log.warn(`  - ${t.category}/${t.label}`);
      }
      if (missing.length > MAX) {
        log.warn(`  ... and ${missing.length - MAX} more`);
      }
    }

    // Final one-line summary.
    const totalPresent = Object.values(counts).reduce((s, c) => s + c.present, 0);
    const totalExpected = Object.values(counts).reduce((s, c) => s + c.total, 0);
    const brainTemplates = counts.brain ? counts.brain.present : 0;
    const skillsCount = counts.skill ? counts.skill.present : 0;
    const agentsCount = counts.agent ? counts.agent.present : 0;
    const hooksCount = counts.hook ? counts.hook.present : 0;
    const everything = totalPresent === totalExpected && brainGitInitialized;

    log.step(
      `Verification: ${brainTemplates} brain templates, ${skillsCount} skills, ` +
        `${agentsCount} agents, ${hooksCount} hooks, plus settings.json, ` +
        `.mcp.json, git-initialized brain. Everything found: ${everything ? 'yes' : 'no'}.`
    );
  },
};
